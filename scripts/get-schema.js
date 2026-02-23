const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getTableSchema() {
    console.log('🔍 Fetching complete schema for associative tables...\n')

    // Query information_schema to get column details
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name LIKE 'associative_%'
      ORDER BY table_name, ordinal_position;
    `
    })

    if (error) {
        console.error('❌ Error querying schema:', error.message)
        console.log('\nTrying alternative method...\n')

        // Alternative: use pg_catalog
        const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
            sql: `
        SELECT 
          t.tablename as table_name,
          a.attname as column_name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
          NOT a.attnotnull as is_nullable
        FROM pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_catalog.pg_tables t ON c.relname = t.tablename
        WHERE n.nspname = 'public'
          AND t.tablename LIKE 'associative_%'
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY t.tablename, a.attnum;
      `
        })

        if (altError) {
            console.error('❌ Alternative method also failed:', altError.message)
            return
        }

        displaySchema(altData)
    } else {
        displaySchema(data)
    }
}

function displaySchema(rows) {
    if (!rows || rows.length === 0) {
        console.log('No schema data found')
        return
    }

    let currentTable = ''

    rows.forEach(row => {
        if (row.table_name !== currentTable) {
            currentTable = row.table_name
            console.log(`\n📋 ${currentTable}:`)
        }

        const nullable = row.is_nullable === 'YES' || row.is_nullable === true ? 'NULL' : 'NOT NULL'
        const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : ''
        console.log(`   - ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`)
    })
}

getTableSchema()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err)
        process.exit(1)
    })

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
    console.log('🔍 Checking table schemas...\n')

    // Test inserting into each table to see what columns exist
    const tables = [
        'associative_events',
        'associative_event_participants',
        'associative_money_pots',
        'associative_contributions',
        'associative_materials',
        'associative_loans',
        'associative_polls',
        'associative_poll_votes'
    ]

    for (const table of tables) {
        console.log(`\n📋 ${table}:`)
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

        if (error) {
            console.log(`   ❌ Error: ${error.message}`)
        } else if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
        } else {
            // Table is empty, try to get column info from a failed insert
            const { error: insertError } = await supabase
                .from(table)
                .insert({})
                .select()

            if (insertError) {
                // Parse error message to find missing columns
                console.log(`   Info: ${insertError.message}`)
            }
        }
    }
}

checkSchema()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err)
        process.exit(1)
    })

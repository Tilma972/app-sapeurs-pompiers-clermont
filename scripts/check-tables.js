const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    console.log('🔍 Checking existing associative tables...\n')

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
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.log(`❌ ${table}: Does NOT exist`)
            console.log(`   Error: ${error.message}`)
        } else {
            console.log(`✅ ${table}: EXISTS (${count || 0} rows)`)
        }
    }
}

listTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err)
        process.exit(1)
    })

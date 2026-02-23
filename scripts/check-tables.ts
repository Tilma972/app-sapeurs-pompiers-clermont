import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
        const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.log(`❌ ${table}: Does NOT exist (${error.message})`)
        } else {
            console.log(`✅ ${table}: EXISTS (${data?.length || 0} rows)`)
        }
    }

    // Check for types
    console.log('\n🔍 Checking existing types...\n')

    const { data: types, error: typesError } = await supabase.rpc('exec_sql', {
        sql: `
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('EventType', 'EventStatus', 'ParticipationStatus', 'PotStatus', 'ContributionStatus', 'MaterialCondition', 'LoanStatus')
      ORDER BY typname;
    `
    })

    if (typesError) {
        console.log('Could not check types:', typesError.message)
    } else {
        console.log('Existing types:', types)
    }
}

listTables().catch(console.error)

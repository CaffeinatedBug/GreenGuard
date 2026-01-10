
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAnomaly() {
    console.log('Searching for anomalous energy readings (> 1000 kWh)...');

    // First, let's see how many there are
    const { data: logs, error: searchError } = await supabase
        .from('iot_logs')
        .select('*')
        .gt('energy_kwh', 1000);

    if (searchError) {
        console.error('Error searching logs:', searchError);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('No anomalous readings found.');
        return;
    }

    console.log(`Found ${logs.length} anomalous reading(s). Deleting...`);

    // Delete matching logs
    const { error: deleteError } = await supabase
        .from('iot_logs')
        .delete()
        .gt('energy_kwh', 1000);

    if (deleteError) {
        console.error('Error deleting logs:', deleteError);
    } else {
        console.log('Successfully deleted anomalous readings.');
        console.log('The graph should now normalize.');
    }
}

resetAnomaly();

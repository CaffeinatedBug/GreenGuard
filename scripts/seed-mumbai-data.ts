// Seed IoT data for Mumbai Electronics Co
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function seedMumbaiData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🌊 Seeding IoT data for Mumbai Electronics Co...\n');
  
  // Get Mumbai supplier ID
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('name', 'Mumbai Electronics Co')
    .single();
  
  if (!suppliers) {
    console.error('❌ Mumbai Electronics Co not found');
    return;
  }
  
  console.log(`✅ Found: ${suppliers.name} (${suppliers.id.slice(0, 8)}...)\n`);
  
  // Generate 20 IoT readings (last 2 hours)
  const readings = [];
  const now = new Date();
  const maxLoad = 500; // Mumbai has 500 kWh max
  
  for (let i = 19; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 6 * 60 * 1000); // Every 6 minutes
    
    // Generate realistic readings (mostly normal, with occasional spikes)
    let energy_kwh;
    if (i === 5) {
      energy_kwh = 520; // One spike over limit
    } else if (i === 10) {
      energy_kwh = 485; // One near limit
    } else {
      energy_kwh = 350 + Math.random() * 100; // Normal: 350-450 kWh
    }
    
    const voltage = 220 + Math.random() * 10;
    const current_amps = (energy_kwh * 1000) / voltage;
    const power_watts = energy_kwh * 1000;
    
    readings.push({
      supplier_id: suppliers.id,
      timestamp: timestamp.toISOString(),
      energy_kwh: Number(energy_kwh.toFixed(2)),
      voltage: Number(voltage.toFixed(1)),
      current_amps: Number(current_amps.toFixed(1)),
      power_watts: Number(power_watts.toFixed(2)),
    });
  }
  
  console.log(`📊 Inserting ${readings.length} IoT readings...`);
  
  const { data, error } = await supabase
    .from('iot_logs')
    .insert(readings)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Inserted ${data?.length} readings`);
    console.log(`\n📈 Energy range: ${Math.min(...readings.map(r => r.energy_kwh)).toFixed(0)} - ${Math.max(...readings.map(r => r.energy_kwh)).toFixed(0)} kWh`);
    console.log(`⚠️  Anomalies: 1 reading over 500 kWh limit`);
  }
}

seedMumbaiData();

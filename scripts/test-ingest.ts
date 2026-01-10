// scripts/test-ingest.ts
// Test script for IoT ingestion API

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testIngestAPI() {
  console.log('🧪 Testing IoT Ingestion API\n');
  console.log('='.repeat(50));

  const API_URL = 'http://localhost:3000/api/ingest-iot';

  // Test data - realistic IoT sensor reading
  const mockIotData = {
    supplierId: '02782453-7f17-4960-9274-9e7d4ce79f55', // Ahmedabad Textiles Ltd
    timestamp: new Date().toISOString(),
    energy_kwh: 380, // Slightly over normal (350 max)
    voltage: 228.5,
    current_amps: 165.7,
    power_watts: 37867.45,
    sensor_id: 'SENSOR_TEST_001',
    firmware_version: '2.4.1',
    signal_strength: 87,
  };

  try {
    console.log('\n📤 Sending POST request to:', API_URL);
    console.log('📊 Test data:', JSON.stringify(mockIotData, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockIotData),
    });

    console.log('\n📥 Response status:', response.status, response.statusText);

    const data = await response.json();
    console.log('📄 Response body:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ SUCCESS! IoT data ingested successfully');
      console.log(`   Log ID: ${data.logId}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('\n❌ FAILED! API returned error');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('\n❌ Request failed with exception:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.log('\n💡 Is the development server running?');
        console.log('   Run: npm run dev');
      }
    }
  }

  console.log('\n' + '='.repeat(50));
}

// Run the test
testIngestAPI();

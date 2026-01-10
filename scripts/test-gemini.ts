// scripts/test-gemini.ts
// Test script for Gemini AI integration

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { analyzeEnergyAnomaly } from '../src/lib/gemini-client';

async function testGeminiAnalysis() {
  console.log('🧪 Testing Gemini AI Energy Analysis\n');
  console.log('='.repeat(50));

  // Test scenario: Energy reading exceeds bill maximum
  const testParams = {
    currentReading: 400, // Over limit!
    billMaxLoad: 350, // Maximum allowed
    gridCarbonIntensity: 820,
    historicalAverage: 280,
    supplierName: 'Ahmedabad Textiles Ltd',
    timestamp: new Date().toISOString(),
  };

  console.log('\n📊 Test Scenario:');
  console.log(`   Current Reading: ${testParams.currentReading} kWh`);
  console.log(`   Bill Max Load: ${testParams.billMaxLoad} kWh`);
  console.log(`   Historical Avg: ${testParams.historicalAverage} kWh`);
  console.log(`   Grid Carbon: ${testParams.gridCarbonIntensity} g/kWh`);
  console.log(`   Expected Result: ANOMALY or WARNING`);

  try {
    console.log('\n🤖 Calling Gemini AI...');
    
    const result = await analyzeEnergyAnomaly(testParams);

    console.log('\n✅ AI Analysis Complete:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Reasoning: ${result.reasoning}`);

    // Verify expected outcome
    if (result.status === 'ANOMALY' || result.status === 'WARNING') {
      console.log('\n✅ TEST PASSED: AI correctly identified the issue');
    } else {
      console.log('\n⚠️  TEST WARNING: Expected ANOMALY/WARNING but got', result.status);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        console.log('\n💡 Setup Required:');
        console.log('   1. Get a Gemini API key from: https://makersuite.google.com/app/apikey');
        console.log('   2. Add to .env.local: GEMINI_API_KEY=your_key_here');
      }
    }
  }

  console.log('\n' + '='.repeat(50));
}

// Run the test
testGeminiAnalysis();

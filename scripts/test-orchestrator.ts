// scripts/test-orchestrator.ts
// Test script for agent orchestrator

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { MockIotGenerator } from '../src/lib/mock-data-generator';
import { insertIotLog } from '../src/lib/db-helpers';
import { agentOrchestrator } from '../src/lib/agent-orchestrator';

async function testOrchestrator() {
  console.log('🧪 Testing Agent Orchestrator\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Create a mock IoT reading that will trigger an anomaly
    console.log('\n📊 Step 1: Creating mock IoT reading...');
    
    const generator = new MockIotGenerator();
    const supplierId = '02782453-7f17-4960-9274-9e7d4ce79f55'; // Ahmedabad Textiles
    const billMaxLoad = 350; // Their max is 350 kWh
    
    // Create an anomalous reading (425 kWh - way over limit)
    const anomalousReading = generator.generateReading(supplierId, 425, 0.05);
    
    console.log(`   Energy: ${anomalousReading.energy_kwh} kWh (Max: ${billMaxLoad} kWh)`);
    console.log(`   Expected: ANOMALY detection`);

    // Step 2: Insert into database
    console.log('\n💾 Step 2: Inserting into database...');
    const { data: insertedLog, error: insertError } = await insertIotLog(anomalousReading);

    if (insertError || !insertedLog) {
      console.error('   ❌ Failed to insert log:', insertError);
      return;
    }

    console.log(`   ✅ Log inserted with ID: ${insertedLog.id.slice(0, 8)}...`);

    // Step 3: Run agent orchestrator
    console.log('\n🤖 Step 3: Running agent pipeline...\n');
    console.log('─'.repeat(50));

    const result = await agentOrchestrator.processIotLog(insertedLog.id);

    // Step 4: Display results
    console.log('─'.repeat(50));
    console.log('\n📋 Agent Logs:');
    console.log('─'.repeat(50));

    result.logs.forEach((log, index) => {
      const icon = log.level === 'success' ? '✅' : 
                   log.level === 'warning' ? '⚠️ ' : 
                   log.level === 'error' ? '❌' : 'ℹ️ ';
      
      console.log(`${index + 1}. ${icon} [${log.agent}] ${log.message}`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log('\n📊 Final Result:');
    console.log('─'.repeat(50));

    if (result.success) {
      console.log(`   ✅ Success: true`);
      console.log(`   🆔 Audit ID: ${result.auditId?.slice(0, 16)}...`);
      console.log(`   📊 Status: ${result.status}`);
      console.log(`   📝 Total Logs: ${result.logs.length}`);
      
      if (result.status === 'ANOMALY' || result.status === 'WARNING') {
        console.log('\n   ✅ TEST PASSED: Anomaly correctly detected!');
      } else {
        console.log('\n   ⚠️  TEST WARNING: Expected ANOMALY but got', result.status);
      }
    } else {
      console.log(`   ❌ Success: false`);
      console.log(`   Error: ${result.error}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 Orchestrator test complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check Supabase audit_events table for the new audit');
    console.log('   2. View the dashboard to see the pending approval');
    console.log('   3. Run: npm run dev (if not running)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testOrchestrator();

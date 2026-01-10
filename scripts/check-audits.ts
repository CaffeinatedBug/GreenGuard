// Check what's in the audit_events table
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function checkAudits() {
  try {
    console.log('🔍 Checking audit_events table...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all PENDING audits with supplier details
    const { data: audits, error } = await supabase
      .from('audit_events')
      .select(`
        id,
        status,
        agent_reasoning,
        confidence_score,
        created_at,
        agent_logs,
        iot_logs (
          energy_kwh,
          suppliers (name)
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📊 Found ${audits?.length || 0} PENDING audits:\n`);
    console.log('─'.repeat(100));

    audits?.forEach((audit: any, i: number) => {
      console.log(`\n${i + 1}. Audit ID: ${audit.id.slice(0, 8)}...`);
      console.log(`   Status: ${audit.status}`);
      console.log(`   Confidence: ${audit.confidence_score}%`);
      console.log(`   Energy: ${(audit.iot_logs as any)?.energy_kwh} kWh`);
      console.log(`   Supplier: ${(audit.iot_logs as any)?.suppliers?.name || 'Unknown'}`);
      console.log(`   Reasoning: ${audit.agent_reasoning?.slice(0, 150)}...`);
      console.log(`   Has agent_logs: ${audit.agent_logs ? 'Yes (' + (Array.isArray(audit.agent_logs) ? audit.agent_logs.length : 0) + ' logs)' : 'No'}`);
      console.log(`   Created: ${new Date(audit.created_at).toLocaleString()}`);
    });

    console.log('\n' + '─'.repeat(100));

    // Now check the specific audits we just created
    const { data: recentAudits, error: recentError } = await supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!recentError && recentAudits) {
      console.log('\n\n🔬 Last 3 audits (all statuses):\n');
      recentAudits.forEach((audit, i) => {
        console.log(`${i + 1}. ${audit.id.slice(0, 8)}... | ${audit.status} | Confidence: ${audit.confidence_score}% | ${new Date(audit.created_at).toLocaleTimeString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAudits();

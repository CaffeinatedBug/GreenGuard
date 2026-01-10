// Check audit distribution per company
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function checkAuditDistribution() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📊 Checking audit distribution by company...\n');

  const { data: audits } = await supabase
    .from('audit_events')
    .select(`
      id,
      status,
      confidence_score,
      iot_logs (
        energy_kwh,
        suppliers (name)
      )
    `)
    .in('status', ['PENDING', 'WARNING', 'ANOMALY'])
    .is('human_action', null);

  const grouped: Record<string, any[]> = {};

  audits?.forEach((audit: any) => {
    const company = (audit.iot_logs as any)?.suppliers?.name || 'Unknown';
    if (!grouped[company]) grouped[company] = [];
    grouped[company].push(audit);
  });

  console.log('═'.repeat(60));
  Object.entries(grouped).forEach(([company, companyAudits]) => {
    console.log(`\n🏭 ${company}: ${companyAudits.length} pending audit(s)`);
    console.log('─'.repeat(60));
    companyAudits.forEach((audit, i) => {
      console.log(`  ${i + 1}. ${audit.iot_logs.energy_kwh} kWh | ${audit.status} | Confidence: ${audit.confidence_score}%`);
    });
  });
  console.log('\n' + '═'.repeat(60));
  console.log(`\n✅ Total: ${audits?.length} pending audits across ${Object.keys(grouped).length} companies`);
}

checkAuditDistribution();

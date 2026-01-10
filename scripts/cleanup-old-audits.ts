// Delete old audits with 0% confidence
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function cleanupOldAudits() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🧹 Cleaning up audits with 0% confidence...\n');
  
  const { data, error } = await supabase
    .from('audit_events')
    .delete()
    .eq('confidence_score', 0)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Deleted ${data?.length || 0} old audits`);
    data?.forEach(audit => {
      console.log(`   - ${audit.id.slice(0, 8)}... (${audit.status})`);
    });
  }
}

cleanupOldAudits();

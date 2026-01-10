// Run database migration
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function runMigration() {
  try {
    console.log('🔧 Running database migration...\n');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '002_add_agent_logs.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration SQL:');
    console.log('─'.repeat(50));
    console.log(sql);
    console.log('─'.repeat(50));
    console.log('\n⚠️  Note: This migration uses features that may require direct database access.');
    console.log('Please run this SQL manually in the Supabase SQL Editor:\n');
    console.log('1. Go to https://supabase.com/dashboard/project/_/sql');
    console.log('2. Copy the SQL above');
    console.log('3. Paste and click "Run"\n');
    
    // Try to check if column exists
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .limit(1);
    
    if (!error && data) {
      console.log('✅ Database connection successful');
      console.log(`📊 Current audit_events table has ${Object.keys(data[0] || {}).length} columns`);
      
      if (data[0] && 'agent_logs' in data[0]) {
        console.log('✅ agent_logs column already exists!');
      } else {
        console.log('⚠️  agent_logs column not found - migration needed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runMigration();

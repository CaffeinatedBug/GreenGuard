// scripts/seed-demo-data.ts
// Script to seed the database with mock IoT data for demonstration

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { MockIotGenerator, insertMockData } from '../src/lib/mock-data-generator';
import { fetchAllSuppliers } from '../src/lib/db-helpers';

async function seedDemoData() {
  console.log('🌱 GreenGuard AI - Mock Data Seeder\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Fetch suppliers
    console.log('\n📡 Step 1: Fetching suppliers from database...');
    const { data: suppliers, error: suppliersError } = await fetchAllSuppliers();
    
    if (suppliersError) {
      console.error('❌ Error fetching suppliers:', suppliersError.message);
      console.log('\n💡 Make sure you have:');
      console.log('1. Created a Supabase project');
      console.log('2. Run the migration SQL (supabase/migrations/001_initial_schema.sql)');
      console.log('3. Set environment variables in .env.local');
      return;
    }
    
    if (!suppliers || suppliers.length === 0) {
      console.log('⚠️  No suppliers found in database');
      console.log('\n💡 Run the migration SQL to create seed suppliers:');
      console.log('   File: supabase/migrations/001_initial_schema.sql');
      return;
    }
    
    console.log(`✅ Found ${suppliers.length} supplier(s)`);
    
    // Step 2: Generate mock data
    console.log('\n📊 Step 2: Generating mock IoT data...');
    const generator = new MockIotGenerator();
    
    // Use the first supplier
    const supplier = suppliers[0];
    console.log(`   Using: ${supplier.name}`);
    console.log(`   Supplier ID: ${supplier.id}`);
    
    // Generate a SPIKE pattern with 15 readings
    const readings = generator.generateSequence(supplier.id, 15, 'SPIKE');
    console.log(`   Generated: ${readings.length} readings with SPIKE pattern`);
    
    // Step 3: Insert data
    console.log('\n💾 Step 3: Inserting data into database...');
    const result = await insertMockData(readings);
    
    if (result.success) {
      console.log(`✅ Successfully inserted ${result.count} readings`);
    } else {
      console.log(`⚠️  Partially successful: ${result.count}/${readings.length} readings inserted`);
      if (result.error) {
        console.error(`   Last error: ${result.error.message}`);
      }
    }
    
    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Seeding complete!\n');
    console.log('📈 What was created:');
    console.log(`   • ${result.count} IoT sensor readings`);
    console.log(`   • Time span: Last ~${Math.floor(readings.length * 5 / 60)} hour(s)`);
    console.log(`   • Pattern: Energy spike in the middle`);
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. View the energy chart with your mock data!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Seeding failed with exception:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Missing environment variable')) {
        console.log('\n💡 Environment Setup:');
        console.log('   Create a .env.local file with:');
        console.log('   NEXT_PUBLIC_SUPABASE_URL=your_url');
        console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
      }
    }
  }
}

// Run the seeder
seedDemoData();

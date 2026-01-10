// src/lib/__test__.ts
// Simple test file to verify Supabase connection and database helpers

import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local FIRST
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

async function runTests() {
  console.log('🧪 GreenGuard AI - Supabase Connection Test\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Supabase client connection
    console.log('\n📡 Test 1: Testing Supabase client connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Environment variables not loaded!');
      console.log('\n💡 Setup Instructions:');
      console.log('1. Check that .env.local exists in the project root');
      console.log('2. Verify it contains:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=your_url');
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
      return;
    }
    
    console.log('✅ Environment variables loaded successfully');
    console.log(`   URL: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 2: Fetch all suppliers
    console.log('\n👥 Test 2: Fetching all suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    
    if (suppliersError) {
      console.error('❌ Error fetching suppliers:', suppliersError.message);
      return;
    }
    
    if (!suppliers || suppliers.length === 0) {
      console.log('⚠️  No suppliers found in database');
      console.log('💡 Tip: Run the migration SQL in Supabase SQL Editor to create seed data');
      return;
    }
    
    console.log(`✅ Successfully fetched ${suppliers.length} supplier(s):\n`);
    
    suppliers.forEach((supplier: any, index: number) => {
      console.log(`${index + 1}. ${supplier.name}`);
      console.log(`   📍 Location: ${supplier.location}`);
      console.log(`   ⚡ Max Load: ${supplier.bill_max_load_kwh} kWh`);
      console.log(`   🌍 Carbon Intensity: ${supplier.grid_carbon_intensity} g CO₂/kWh`);
      console.log(`   🆔 ID: ${supplier.id}`);
      console.log('');
    });
    
    console.log('='.repeat(50));
    console.log('✨ All tests passed! Supabase is connected and working.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error);
  }
}

// Run tests
runTests();

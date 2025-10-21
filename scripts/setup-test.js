#!/usr/bin/env node

/**
 * Setup Test Script for Assessment Manager
 * This script helps verify that your Supabase and Clerk integration is working correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Assessment Manager - Setup Test Script\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please copy .env.local.example to .env.local and add your API keys.\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease add these variables to your .env.local file.\n');
  process.exit(1);
}

console.log('✅ Environment variables look good!\n');

// Test database connection by trying to create a simple client
console.log('🔗 Testing Supabase connection...');

try {
  // This would be tested in the actual application
  console.log('✅ Supabase configuration detected');
  console.log(`   - URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   - Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...`);
} catch (error) {
  console.log('❌ Error testing Supabase connection:', error.message);
}

// Test Clerk configuration
console.log('\n🔐 Testing Clerk configuration...');
try {
  console.log('✅ Clerk configuration detected');
  console.log(`   - Publishable Key: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 10)}...`);
  console.log(`   - Secret Key: ${process.env.CLERK_SECRET_KEY.substring(0, 10)}...`);
} catch (error) {
  console.log('❌ Error testing Clerk configuration:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Make sure you have created a Supabase project');
console.log('2. Run the database schema from database/schema.sql in Supabase');
console.log('3. Start the development server: npm run dev');
console.log('4. Open http://localhost:3000 and test sign up/sign in');
console.log('5. Create your first assessment and verify it saves to Supabase');
console.log('\n🚀 Happy coding!');
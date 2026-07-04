/**
 * Environment Variable Checker
 * 
 * Run this script to verify your .env file is configured correctly
 * Usage: node check-env.js
 * 
 * Note: This script checks environment variables that are already loaded.
 * For Next.js, the .env file is automatically loaded when the dev server runs.
 */

console.log('=== ENVIRONMENT VARIABLE CHECK ===\n');

const requiredVars = [
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'ADMIN_EMAIL'
];

const optionalVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

let allRequiredPresent = true;

console.log('Required Variables:');
console.log('===================');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const maskedValue = exists ? `${value.substring(0, 8)}...` : 'NOT SET';
  
  if (exists) {
    console.log(`✅ ${varName}: ${maskedValue} (length: ${value.length})`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allRequiredPresent = false;
  }
});

console.log('\nOptional Variables:');
console.log('===================');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const maskedValue = exists ? `${value.substring(0, 8)}...` : 'NOT SET';
  
  if (exists) {
    console.log(`✅ ${varName}: ${maskedValue} (length: ${value.length})`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  }
});

console.log('\n=== SUMMARY ===');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set!');
  console.log('\nYour OTP email system should work correctly.');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('\nTo fix this:');
  console.log('1. Check if .env file exists in the project root');
  console.log('2. Add the missing variables to your .env file');
  console.log('\nExample .env file:');
  console.log('=================');
  console.log('RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
  console.log('FROM_EMAIL="onboarding@resend.dev"');
  console.log('ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"');
  console.log('\nGet your API key from: https://resend.com/api-keys');
  console.log('\nAfter updating .env, restart your dev server:');
  console.log('  npm run dev');
}

console.log('\n===================');

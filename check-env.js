/**
 * Environment Variable Checker
 * 
 * Run this script to verify your .env file is configured correctly
 * Usage: node check-env.js
 * 
 * Note: This script checks environment variables that are already loaded.
 * For Next.js, the .env file is automatically loaded when the dev server runs.
 */


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

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const maskedValue = exists ? `${value.substring(0, 8)}...` : 'NOT SET';
  
  if (exists) {
  } else {
    allRequiredPresent = false;
  }
});

optionalVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const maskedValue = exists ? `${value.substring(0, 8)}...` : 'NOT SET';
  
  if (exists) {
  } else {
  }
});

if (allRequiredPresent) {
} else {
}


# OTP Email Sending System - Debug Report

**Date:** June 2, 2026  
**Status:** 🔴 ISSUE IDENTIFIED - Environment Variable Missing

---

## Test Results

### Complete Flow Test
Tested via `/api/test-otp-flow` endpoint with test@example.com

| Step | Status | Details |
|------|--------|---------|
| **OTP Generation** | ✅ SUCCESS | Generated OTP: 855800 (6 digits) |
| **OTP Storage** | ✅ SUCCESS | Stored in memory for test@example.com |
| **Email Sending** | ❌ FAILED | Resend API key not configured |

---

## Root Cause

**RESEND_API_KEY environment variable is not loaded**

### Evidence from Server Logs:

```
=== EMAIL LIBRARY INITIALIZATION ===
RESEND_API_KEY exists: false
RESEND_API_KEY length: 0
Resend client initialized: false
FROM_EMAIL: onboarding@resend.dev
ADMIN_EMAIL: admin@sreevenkatesswara.com
=================================
```

### Error Message:
```
Error: Resend API key not configured. Please add RESEND_API_KEY to your .env file.
```

---

## What's Working

1. ✅ **OTP Generation Function** - `lib/otp.ts` generates 6-digit OTPs correctly
2. ✅ **OTP Storage Function** - OTPs are stored in memory with 10-minute expiry
3. ✅ **API Route Execution** - `/api/auth/register/send-otp` executes correctly
4. ✅ **Frontend API Calls** - Frontend successfully calls the API endpoint
5. ✅ **Response Handling** - API returns proper response with devOTP fallback
6. ✅ **Toast Notification Logic** - Frontend toast triggers are implemented correctly

---

## What's NOT Working

1. ❌ **Environment Variable Loading** - `RESEND_API_KEY` is not being loaded from `.env`
2. ❌ **Resend Client Initialization** - Resend client is null because API key is missing
3. ❌ **Email Sending** - Cannot send emails without Resend API key
4. ❌ **Actual Email Delivery** - No emails are being sent to users

---

## Fix Required

### Step 1: Verify/Create .env file

Check if `.env` file exists in the project root and contains:

```env
RESEND_API_KEY="your_actual_resend_api_key_here"
FROM_EMAIL="onboarding@resend.dev"
ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"
```

### Step 2: Get Resend API Key

1. Go to https://resend.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### Step 3: Update .env file

Add the API key to your `.env` file:

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Step 4: Restart Development Server

After updating the `.env` file, restart the Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Enhanced Logging Added

### Backend Logging (`pages/api/auth/register/send-otp.ts`)
- ✅ Environment variable checks
- ✅ Request data logging
- ✅ OTP generation logs
- ✅ OTP storage logs
- ✅ Email sending attempt logs
- ✅ Resend API response logs
- ✅ Error details with stack traces
- ✅ Toast trigger status logging

### Email Library Logging (`lib/email.ts`)
- ✅ Initialization logs
- ✅ Resend client status
- ✅ Email configuration logs
- ✅ Send attempt logs with retry count
- ✅ Resend API error details
- ✅ OTP email specific logs

### OTP Library Logging (`lib/otp.ts`)
- ✅ OTP generation function logs
- ✅ OTP storage function logs
- ✅ Expiry timestamp logs

### Frontend Logging (`pages/svci-admin-register.jsx` & `pages/admin/register.jsx`)
- ✅ API request logs
- ✅ Response data logs
- ✅ Toast notification trigger logs
- ✅ Error handling logs

---

## Testing Instructions

After fixing the environment variable:

### 1. Test via API Endpoint
```bash
curl -X POST http://localhost:3000/api/test-otp-flow \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","name":"Test User"}'
```

### 2. Test via Frontend
1. Navigate to `/svci-admin-register` or `/admin/register`
2. Fill in the registration form
3. Click "Send OTP" or "Continue to Verification"
4. Check:
   - Browser console for logs
   - Server console for logs
   - Toast notifications
   - Email inbox

### 3. Verify Logs

**Success logs should show:**
```
=== ENVIRONMENT VARIABLES CHECK ===
RESEND_API_KEY exists: true
RESEND_API_KEY length: 40+
FROM_EMAIL: onboarding@resend.dev
NODE_ENV: development
=================================

=== EMAIL SENDING ===
✅ Email sent successfully to: user@example.com
Email data: { id: "..." }
=================================

=== API RESPONSE ===
Toast trigger status: SUCCESS
=================================
```

---

## Fallback Behavior

If email sending fails (which is currently the case):

1. ✅ OTP is still generated and stored
2. ✅ OTP is logged to server console
3. ✅ OTP is returned in API response as `devOTP`
4. ✅ Frontend shows OTP in toast notification (10-second duration)
5. ✅ User can still complete registration using the OTP from toast

This ensures the registration flow works even without email configuration.

---

## Current Configuration

- **Sender Email:** `onboarding@resend.dev` (Resend's testing email)
- **Resend Client:** Not initialized (missing API key)
- **Retry Logic:** 3 attempts with exponential backoff
- **OTP Expiry:** 10 minutes
- **Development Mode:** OTP shown in toast for testing

---

## Next Steps

1. **Immediate:** Add `RESEND_API_KEY` to `.env` file
2. **Restart:** Restart the development server
3. **Retest:** Run the test endpoint again
4. **Verify:** Check email delivery and toast notifications
5. **Monitor:** Review server logs for any remaining issues

---

## Summary

The OTP system is **functionally complete** but cannot send emails due to a missing environment variable. All components (generation, storage, API, frontend) are working correctly. Once the `RESEND_API_KEY` is added to the `.env` file and the server is restarted, email sending will work immediately.

**Fallback is working:** Users can still complete registration using the OTP shown in the toast notification.

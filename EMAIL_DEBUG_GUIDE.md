# Auto-Reply Email Debug Guide

## Issue: Auto mail is not being generated for the inquiry request

I've added comprehensive logging to help diagnose the issue. Please follow these steps:

## Step 1: Check Email Configuration

Visit this URL in your browser or use curl:
```
GET http://localhost:3000/api/debug-email-config
```

This will show you:
- Whether RESEND_API_KEY is configured
- The length and prefix of the API key
- FROM_EMAIL configuration
- Any configuration issues

## Step 2: Check Server Logs

When you submit an enquiry, check the server console for these log messages:

### Initialization Logs (should appear on server startup):
```
[AUTO-REPLY INIT] Checking Resend configuration...
[AUTO-REPLY INIT] RESEND_API_KEY exists: true/false
[AUTO-REPLY INIT] RESEND_API_KEY length: [number]
[AUTO-REPLY INIT] Resend client initialized: true/false
[AUTO-REPLY INIT] FROM_EMAIL: [email address]
[AUTO-REPLY INIT] Configuration check complete
```

### Enquiry Submission Logs (should appear when you submit an enquiry):
```
[ENQUIRY] Sending admin notification email...
[ENQUIRY] Admin notification email sent
[ENQUIRY] Sending intelligent customer acknowledgement email...
[AUTO-REPLY] ==================================
[AUTO-REPLY] Customer: [customer email]
[AUTO-REPLY] Service: [service name]
[AUTO-REPLY] Enquiry ID: [enquiry id]
[AUTO-REPLY] Sending acknowledgement email...
[AUTO-REPLY] Generating email content...
[AUTO-REPLY] Email content generated
[AUTO-REPLY] Subject: Your Enquiry Is Under Review – Sree Venkatesswara Constructions
[AUTO-REPLY] HTML length: [number]
[AUTO-REPLY] Calling sendEmailWithRetry...
[AUTO-REPLY] sendEmailWithRetry called
[AUTO-REPLY] To: [customer email]
[AUTO-REPLY] Subject: Your Enquiry Is Under Review – Sree Venkatesswara Constructions
[AUTO-REPLY] Retry count: 0
```

## Step 3: Common Issues and Solutions

### Issue 1: RESEND_API_KEY not configured
**Symptom:**
```
[AUTO-REPLY INIT] RESEND_API_KEY exists: false
[AUTO-REPLY INIT] Resend client initialized: false
[AUTO-REPLY] ❌ Resend client not initialized
[AUTO-REPLY] ❌ Error: Resend API key not configured
```

**Solution:**
1. Open your `.env` file
2. Add or verify: `RESEND_API_KEY=re_xxxxxxxxxxxxxxxx`
3. Get your API key from: https://resend.com/api-keys
4. Restart the development server

### Issue 2: Invalid RESEND_API_KEY
**Symptom:**
```
[AUTO-REPLY] ❌ Resend API error: [error details]
[AUTO-REPLY] ❌ Error code: [error code]
[AUTO-REPLY] ❌ Error statusCode: 401 or 403
```

**Solution:**
1. Verify your RESEND_API_KEY is correct
2. Check if the API key is active in Resend dashboard
3. Ensure you have the correct permissions

### Issue 3: FROM_EMAIL not verified
**Symptom:**
```
[AUTO-REPLY] ❌ Resend API error: from domain is not verified
```

**Solution:**
1. For development: Use `onboarding@resend.dev` (default, no verification needed)
2. For production: Verify your domain in Resend dashboard
3. Set `FROM_EMAIL=your-verified-email@yourdomain.com` in .env

### Issue 4: Function not being called
**Symptom:**
```
[ENQUIRY] Sending intelligent customer acknowledgement email...
[No AUTO-REPLY logs appear]
```

**Solution:**
1. Check if the enquiry is being created successfully
2. Check if there's an error in the try-catch block
3. Verify the import statement is correct

## Step 4: Test the Configuration

After making changes, restart your server and submit a test enquiry:

```bash
# Restart the server
npm run dev

# Submit a test enquiry via the website or API
```

## Step 5: Check Email Logs

If emails are being sent but not received:

1. Check spam/junk folder
2. Verify the recipient email address is correct
3. Check Resend dashboard for delivery status
4. Check database `EmailLog` table for email status

## Files Modified for Debugging

1. **pages/api/enquiries/index.ts** - Added logging for email sending process
2. **lib/enquiryAutoReply.ts** - Added comprehensive logging throughout the email sending flow
3. **pages/api/debug-email-config.ts** - New debug endpoint to check configuration

## Next Steps

1. Visit `/api/debug-email-config` to check your configuration
2. Submit an enquiry and check the server console logs
3. Share the logs with me if you need further assistance

## Expected Successful Flow

When everything is working correctly, you should see:

```
[ENQUIRY] Sending intelligent customer acknowledgement email...
[AUTO-REPLY] ==================================
[AUTO-REPLY] Customer: customer@example.com
[AUTO-REPLY] Service: House Construction
[AUTO-REPLY] Enquiry ID: cmxxxxxxx
[AUTO-REPLY] Sending acknowledgement email...
[AUTO-REPLY] Generating email content...
[AUTO-REPLY] Email content generated
[AUTO-REPLY] Subject: Your Enquiry Is Under Review – Sree Venkatesswara Constructions
[AUTO-REPLY] HTML length: 5000
[AUTO-REPLY] Calling sendEmailWithRetry...
[AUTO-REPLY] sendEmailWithRetry called
[AUTO-REPLY] To: customer@example.com
[AUTO-REPLY] Subject: Your Enquiry Is Under Review – Sree Venkatesswara Constructions
[AUTO-REPLY] Retry count: 0
[AUTO-REPLY] Email params: { from: 'onboarding@resend.dev', to: 'customer@example.com', ... }
[AUTO-REPLY] Calling resend.emails.send()...
[AUTO-REPLY] ✅ Resend API response: { id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
[AUTO-REPLY] Email sent successfully
[AUTO-REPLY] ==================================
[ENQUIRY] Auto-reply result: { success: true }
```

Please check the logs and let me know what you see!

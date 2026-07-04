# Admin Registration Flow Test Guide

## Quick Test Using curl

### 1. Test OTP Generation
```bash
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "test@example.com",
  "emailSent": true,
  "emailError": null,
  "devOTP": "123456"
}
```

### 2. Test OTP Verification
Replace `123456` with the OTP from step 1:
```bash
curl -X POST http://localhost:3000/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "test@example.com"
}
```

### 3. Test Account Creation
Replace `123456` with the OTP from step 1:
```bash
curl -X POST http://localhost:3000/api/auth/register/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "name":"Test User",
    "password":"Test@123",
    "phone":"1234567890",
    "otp":"123456"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "clxxx...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "SUPER_ADMIN"
  }
}
```

## Test Using Test Endpoint

### Complete OTP Flow Test
```bash
curl -X POST http://localhost:3000/api/test-otp-flow \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

This will test:
1. OTP generation
2. OTP storage
3. Email sending

Expected response:
```json
{
  "success": true,
  "timestamp": "2026-06-02T...",
  "steps": {
    "otpGeneration": {
      "success": true,
      "otp": "123456",
      "otpLength": 6
    },
    "otpStorage": {
      "success": true,
      "email": "test@example.com"
    },
    "emailSending": {
      "success": true,
      "emailSent": true,
      "error": null,
      "data": {...}
    }
  },
  "overallSuccess": true,
  "devOTP": "123456"
}
```

## Manual Browser Test

1. Navigate to http://localhost:3000/admin/register
2. Fill in the form:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: (optional)
3. Click "Send OTP"
4. Check the toast notification for the OTP (development mode)
5. Enter the OTP
6. Set password: Test@123
7. Confirm password: Test@123
8. Click "Create Account"
9. Should redirect to login page

## Terminal Log Monitoring

While testing, monitor the terminal for `[ADMIN REGISTER]` logs:

```
[PRISMA] Initializing Prisma client...
[PRISMA] DATABASE_URL exists: true
[PRISMA] Database connected successfully
[ADMIN REGISTER] === SEND OTP API CALLED ===
[ADMIN REGISTER] === ENVIRONMENT VARIABLES CHECK ===
[ADMIN REGISTER] RESEND_API_KEY exists: true
[ADMIN REGISTER] FROM_EMAIL: noreply@sreevenkatesswaraconstructions.com
[ADMIN REGISTER] === OTP GENERATION ===
[ADMIN REGISTER] Generated OTP: 123456
[ADMIN REGISTER] === EMAIL SENDING ===
[ADMIN REGISTER] ✅ Email sent successfully to: test@example.com
[ADMIN REGISTER] === API RESPONSE ===
```

## Troubleshooting

### If OTP sending fails:
1. Check terminal logs for `[ADMIN REGISTER]` error messages
2. Verify RESEND_API_KEY is valid
3. Check if email domain is verified in Resend dashboard
4. In development mode, OTP will still be returned in `devOTP` field

### If database connection fails:
1. Check `[PRISMA]` logs in terminal
2. Verify DATABASE_URL in .env file
3. Ensure prisma/dev.db file exists
4. Run `npx prisma generate` if needed

### If account creation fails:
1. Check if user already exists in database
2. Verify password meets requirements (8+ chars, uppercase, lowercase, number, special char)
3. Check OTP is valid and not expired
4. Monitor terminal logs for detailed error messages

## Verification Checklist

- [ ] Environment variables are set (RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL)
- [ ] Prisma client initializes successfully
- [ ] Database connection established
- [ ] OTP generation works
- [ ] OTP storage works
- [ ] Email sending works (or fallback in dev mode)
- [ ] OTP verification works
- [ ] Account creation works
- [ ] User is saved in database
- [ ] Frontend receives JSON responses (not HTML)
- [ ] No 500 errors in console
- [ ] Toast notifications appear correctly

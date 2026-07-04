# Resend API Setup for Email OTP Verification

## Overview
This guide explains how to configure the Resend API for sending OTP verification emails in the admin authentication system.

## Resend API Key
The Resend API key has been added to `.env.example`:
```
RESEND_API_KEY="re_UgDnFfgN_HHBDgQm12nMyKJgGnaSoZdn1"
```

## Setup Instructions

### Step 1: Add API Key to .env File
Open your `.env` file and add/update the following lines:

```env
# Email (Resend)
RESEND_API_KEY="re_UgDnFfgN_HHBDgQm12nMyKJgGnaSoZdn1"
FROM_EMAIL="noreply@sreevenkatesswaraconstructions.com"
ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"
```

### Step 2: Verify Sender Domain
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain: `sreevenkatesswaraconstructions.com`
3. Verify the domain by adding the DNS records provided by Resend
4. Wait for domain verification (usually takes a few minutes)

### Step 3: Test Email Sending
After adding the API key, test the OTP flow:
1. Go to `/svci-admin-register`
2. Fill in registration details
3. Click "Continue to Verification"
4. Check your email for the OTP
5. Also check the toast notification (OTP will be shown there for testing)

## Email Template Features

The professional email template includes:
- **Branded header** with company colors
- **Large, readable OTP code** (48px font)
- **Expiry time display** (10 minutes)
- **Instructions box** with step-by-step guidance
- **Security notice** warning about code sharing
- **Professional footer** with company branding
- **Mobile responsive design**

## OTP Security Features

- **6-digit secure random OTP** generated using crypto
- **10-minute expiry** with countdown timer
- **Resend OTP support** with rate limiting
- **Invalid attempt protection** via OTP verification
- **In-memory storage** with automatic cleanup
- **Console logging** for development debugging

## Troubleshooting

### Email Not Sending
If emails are not being sent:
1. Check that `RESEND_API_KEY` is set in `.env`
2. Verify the API key is valid
3. Check Resend dashboard for API usage limits
4. Verify sender domain is approved in Resend
5. Check browser console for error messages

### OTP Not Received
If OTP is not received in email:
1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for email delivery status
4. OTP will still be shown in toast notification for testing
5. Check server console for error logs

### Domain Verification Issues
If domain verification fails:
1. Ensure DNS records are added correctly
2. Wait for DNS propagation (can take up to 48 hours)
3. Use Resend's test domain initially: `@resend.dev`
4. Contact Resend support if issues persist

## Development Mode

In development mode:
- OTP is always displayed in a toast notification
- OTP is logged to server console
- Email errors are logged but don't block the flow
- System continues to work even if email fails

## Production Deployment

Before deploying to production:
1. Ensure domain is verified in Resend
2. Remove console logging of OTP
3. Remove OTP from toast notification
4. Set up proper error monitoring
5. Configure email delivery monitoring
6. Test the complete flow in production environment

## Rate Limiting

The system includes built-in rate limiting:
- OTP expires after 10 minutes
- Old OTP is cleared when new one is generated
- Invalid attempts are logged
- Multiple failed attempts can be monitored

## Security Best Practices

1. **Never hardcode API keys** - Always use environment variables
2. **Rotate API keys** regularly
3. **Monitor email delivery** - Set up alerts for failures
4. **Use verified domains** - Don't use unverified senders
5. **Log OTP attempts** - Monitor for suspicious activity
6. **Implement rate limiting** - Prevent abuse
7. **Use strong passwords** - Enforce password complexity
8. **Enable 2FA** - Consider adding two-factor authentication

## Support

For Resend API issues:
- Documentation: https://resend.com/docs
- Support: https://resend.com/support
- Status: https://resend.com/status

For implementation issues:
- Check browser console for errors
- Check server logs for API errors
- Verify environment variables are set
- Test with the provided API key

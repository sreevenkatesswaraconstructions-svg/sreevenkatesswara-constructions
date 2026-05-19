# Email Automation - Sree Venkatesswara Constructions & Interiors

Professional email automation system using Resend API for automated notifications and confirmations.

## Features

- **Admin Notification Emails** - Automatic alerts when customers submit forms
- **Customer Confirmation Emails** - Instant confirmations with branded design
- **Quote Request Emails** - Detailed quote requests with project specifications
- **Retry Handling** - Automatic retry on failure with exponential backoff
- **Logging** - Comprehensive logging of all email attempts
- **Error Handling** - Graceful error handling with detailed responses
- **HTML Templates** - Professional, branded email templates

## Setup

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in your dashboard
3. Verify your domain (required for sending emails)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
FROM_EMAIL="noreply@sreevenkatesswaraconstructions.com"
ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"
```

**Important:** 
- Replace `RESEND_API_KEY` with your actual Resend API key
- Verify your domain in Resend dashboard before sending emails
- Update `FROM_EMAIL` to match your verified domain
- Update `ADMIN_EMAIL` to receive admin notifications

### 3. Install Dependencies

Resend is already installed in the project. If needed:

```bash
npm install resend
```

## Email Templates

### 1. Admin Notification Email

Sent to admin when:
- Contact form is submitted
- Enquiry is submitted
- Quote request is submitted

**Includes:**
- Customer name, email, phone
- Service requested
- Message/requirements
- Budget (if applicable)
- Reply-to functionality

### 2. Customer Confirmation Email

Sent to customer when:
- Contact form is submitted
- Enquiry is submitted
- Quote request is submitted

**Includes:**
- Thank you message
- Enquiry details
- Reference number
- Contact assurance
- Company branding
- Contact information

### 3. Quote Request Email

Sent to admin when:
- Quote request form is submitted

**Includes:**
- Customer information
- Project type
- Location
- Budget
- Timeline
- Detailed requirements

## API Endpoints

### Contact Form Email

**Endpoint:** `POST /api/email/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "subject": "General Inquiry",
  "message": "I would like to know more about your services."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "adminEmail": { "id": "email_id" },
    "customerEmail": { "id": "email_id" }
  }
}
```

### Enquiry Email

**Endpoint:** `POST /api/email/enquiry`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "service": "Residential Construction",
  "message": "I need a new home construction.",
  "budget": "₹25L - ₹30L"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enquiry submitted successfully",
  "enquiryId": "ENQ123456",
  "data": {
    "adminEmail": { "id": "email_id" },
    "customerEmail": { "id": "email_id" }
  }
}
```

### Quote Request Email

**Endpoint:** `POST /api/email/quote`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "projectType": "Residential Construction",
  "location": "Chennai",
  "budget": "₹25L - ₹30L",
  "timeline": "6-12 months",
  "requirements": "3 bedroom house with modern amenities"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quote request submitted successfully",
  "quoteId": "QT123456",
  "data": {
    "adminEmail": { "id": "email_id" },
    "customerEmail": { "id": "email_id" }
  }
}
```

## Library Functions

### sendAdminNotification

Sends notification email to admin.

```typescript
import { sendAdminNotification } from '@/lib/email';

const result = await sendAdminNotification({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+91 98765 43210',
  serviceRequested: 'Residential Construction',
  message: 'I need a new home construction.',
  budget: '₹25L - ₹30L'
});
```

### sendCustomerConfirmation

Sends confirmation email to customer.

```typescript
import { sendCustomerConfirmation } from '@/lib/email';

const result = await sendCustomerConfirmation({
  customerEmail: 'john@example.com',
  customerName: 'John Doe',
  serviceRequested: 'Residential Construction',
  enquiryId: 'ENQ123456'
});
```

### sendQuoteRequest

Sends quote request email to admin.

```typescript
import { sendQuoteRequest } from '@/lib/email';

const result = await sendQuoteRequest({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+91 98765 43210',
  projectType: 'Residential Construction',
  location: 'Chennai',
  budget: '₹25L - ₹30L',
  timeline: '6-12 months',
  requirements: '3 bedroom house with modern amenities'
});
```

### sendContactFormEmails

Sends both admin notification and customer confirmation for contact form.

```typescript
import { sendContactFormEmails } from '@/lib/email';

const results = await sendContactFormEmails({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  subject: 'General Inquiry',
  message: 'I would like to know more about your services.'
});
```

### sendEnquiryEmails

Sends both admin notification and customer confirmation for enquiry.

```typescript
import { sendEnquiryEmails } from '@/lib/email';

const results = await sendEnquiryEmails({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  service: 'Residential Construction',
  message: 'I need a new home construction.',
  budget: '₹25L - ₹30L',
  enquiryId: 'ENQ123456'
});
```

### sendQuoteRequestEmails

Sends both admin notification and customer confirmation for quote request.

```typescript
import { sendQuoteRequestEmails } from '@/lib/email';

const results = await sendQuoteRequestEmails({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  projectType: 'Residential Construction',
  location: 'Chennai',
  budget: '₹25L - ₹30L',
  timeline: '6-12 months',
  requirements: '3 bedroom house with modern amenities'
});
```

## Features

### Retry Handling

All email functions include automatic retry logic:
- **Max retries:** 3 attempts
- **Retry delay:** Exponential backoff (1s, 2s, 3s)
- **Automatic retry** on failure

### Logging

All email attempts are logged with:
- Timestamp
- Email type
- Recipient
- Success/failure status
- Error details (if failed)

### Error Handling

Comprehensive error handling:
- Validation errors (missing fields, invalid email)
- API errors (Resend API failures)
- Network errors
- Detailed error messages in response

### Branded Design

All email templates feature:
- Company branding
- Professional layout
- Responsive design
- Color scheme matching brand identity
- Contact information
- Social links

## Testing

To test email functionality:

1. Set up your `.env` file with valid Resend API key
2. Verify your domain in Resend dashboard
3. Use the API endpoints or library functions
4. Check your email inbox for sent emails

### Test with cURL

```bash
# Test contact form
curl -X POST http://localhost:3000/api/email/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91 98765 43210",
    "subject": "Test Subject",
    "message": "Test message"
  }'

# Test enquiry
curl -X POST http://localhost:3000/api/email/enquiry \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91 98765 43210",
    "service": "Residential Construction",
    "message": "Test enquiry message"
  }'

# Test quote request
curl -X POST http://localhost:3000/api/email/quote \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91 98765 43210",
    "projectType": "Residential Construction",
    "location": "Chennai",
    "budget": "₹25L",
    "timeline": "6 months",
    "requirements": "Test requirements"
  }'
```

## Security

- **API Keys:** Never commit API keys to version control
- **Environment Variables:** Use `.env` file for sensitive data
- **Validation:** All inputs are validated before processing
- **Error Messages:** Generic error messages to prevent information leakage

## Production Considerations

1. **Domain Verification:** Verify your domain in Resend before production
2. **Rate Limiting:** Implement rate limiting to prevent abuse
3. **Email Queue:** Consider using a queue system for high volume
4. **Monitoring:** Set up monitoring for email delivery failures
5. **Analytics:** Track email open rates and engagement
6. **Unsubscribe:** Add unsubscribe functionality for marketing emails

## Troubleshooting

### Emails not sending

1. Check Resend API key is valid
2. Verify your domain is verified in Resend
3. Check environment variables are set correctly
4. Check server logs for error messages

### Domain verification failed

1. Add DNS records as instructed by Resend
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify records are correct in Resend dashboard

### Rate limiting

Resend has rate limits:
- Free tier: 3,000 emails per day
- Check your plan limits
- Implement retry logic with appropriate delays

## File Structure

```
lib/
  email.ts                    # Email library with templates and functions

pages/api/email/
  contact.ts                  # Contact form email endpoint
  enquiry.ts                  # Enquiry email endpoint
  quote.ts                    # Quote request email endpoint
```

## Support

For issues with Resend API:
- Documentation: https://resend.com/docs
- Support: support@resend.com

For project-specific issues:
- Check server logs
- Verify environment variables
- Test with API endpoints directly

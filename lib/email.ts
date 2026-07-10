import { Resend } from 'resend';
import { prisma } from './prisma';
import { company } from './company';

// Initialize Resend with API key or fallback
console.log('=== EMAIL LIBRARY INITIALIZATION ===');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
console.log('Resend client initialized:', !!resend);

// Email configuration - Use testing sender email
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sreevenkatesswara.com';
const COMPANY_NAME = company.name;
console.log('FROM_EMAIL:', FROM_EMAIL);
console.log('ADMIN_EMAIL:', ADMIN_EMAIL);
console.log('=================================');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Delay function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Log email attempts
const logEmailAttempt = (type: string, to: string, success: boolean, error?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    to,
    success,
    error: error?.message || null,
  };
  
  console.log(`[Email Log] ${JSON.stringify(logEntry)}`);
  
  // In production, you might want to save this to a database
  return logEntry;
};

// Log email activity to database
async function logEmailToDatabase(data: {
  toEmail: string;
  subject: string;
  type: string;
  status: string;
  error?: string;
  enquiryId?: string;
  metadata?: any;
}) {
  try {
    // Check if emailLog model exists (handle case where migration hasn't been run yet)
    if ((prisma as any).emailLog) {
      await prisma.emailLog.create({
        data: {
          toEmail: data.toEmail,
          subject: data.subject,
          type: data.type,
          status: data.status,
          error: data.error,
          enquiryId: data.enquiryId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
      console.log('[Email Log] Successfully logged to database');
    } else {
      console.log('[Email Log] EmailLog model not available yet, skipping database log');
    }
  } catch (dbError) {
    console.error('[Email Log] Failed to log to database:', dbError);
    // Continue even if logging fails
  }
}

// Send email with retry logic
async function sendEmailWithRetry(
  params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    emailType?: string;
    enquiryId?: string;
    metadata?: any;
    attachments?: Array<{ filename: string; content: string | Buffer }>;
  },
  retryCount = 0
): Promise<{ success: boolean; data?: any; error?: any }> {
  console.log('=== SEND EMAIL WITH RETRY ===');
  console.log('Attempt:', retryCount + 1, '/', MAX_RETRIES);
  console.log('To:', Array.isArray(params.to) ? params.to.join(', ') : params.to);
  console.log('From:', params.from || FROM_EMAIL);
  console.log('Subject:', params.subject);
  console.log('HTML length:', params.html.length);
  
  const toEmail = Array.isArray(params.to) ? params.to.join(', ') : params.to;
  const emailType = params.emailType || 'general';
  
  // Check if Resend is configured
  if (!resend) {
    const error = new Error('Resend API key not configured. Please add RESEND_API_KEY to your .env file.');
    console.error('❌ Resend client not initialized');
    logEmailAttempt(emailType, toEmail, false, error);
    
    // Log to database
    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'failed',
      error: error.message,
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });
    
    console.log('=================================');
    return { success: false, error };
  }

  try {
    console.log('Sending email to:', toEmail);
    console.log('Calling resend.emails.send()...');
    const emailParams = {
      from: params.from || FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.attachments?.length ? { attachments: params.attachments } : {}),
    };
    console.log('Email params:', {
      ...emailParams,
      html: '[HTML content omitted]' // Don't log full HTML
    });
    
    const result = await resend.emails.send(emailParams);
    console.log('Resend response:', result);
    
    // Check if Resend returned an error in the response
    if (result.error) {
      console.error('❌ Delivery failed:', result.error);
      console.error('❌ Error name:', result.error.name);
      console.error('❌ Error message:', result.error.message);
      console.error('❌ Error statusCode:', result.error.statusCode);
      
      logEmailAttempt(emailType, toEmail, false, result.error);
      
      // Log to database
      await logEmailToDatabase({
        toEmail,
        subject: params.subject,
        type: emailType,
        status: 'failed',
        error: result.error.message,
        enquiryId: params.enquiryId,
        metadata: params.metadata,
      });
      
      console.log('=================================');
      return { success: false, error: result.error };
    }
    
    console.log('✅ Email sent successfully');
    console.log('✅ Resend data:', result.data);
    
    logEmailAttempt(emailType, toEmail, true);
    
    // Log to database
    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'sent',
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });
    
    console.log('=================================');

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('❌ Resend API error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error statusCode:', error.statusCode);
    
    logEmailAttempt(emailType, toEmail, false, error);

    // Retry on failure
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying email send (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      console.log(`Waiting ${RETRY_DELAY * (retryCount + 1)}ms before retry...`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return sendEmailWithRetry(params, retryCount + 1);
    }

    // Log final failure to database
    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'failed',
      error: error.message,
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });

    console.log('Max retries reached. Giving up.');
    console.log('=================================');
    return { success: false, error };
  }
}

// Admin notification email template
export function getAdminNotificationEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceRequested: string;
  message: string;
  budget?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New ${data.serviceRequested} Enquiry</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          color: #004d40;
          font-size: 18px;
          margin-bottom: 15px;
          border-bottom: 2px solid #cfa84b;
          padding-bottom: 8px;
        }
        .info-row {
          display: flex;
          margin-bottom: 12px;
        }
        .info-label {
          font-weight: 600;
          color: #555;
          width: 140px;
          flex-shrink: 0;
        }
        .info-value {
          color: #333;
          flex: 1;
        }
        .message-box {
          background: #f5f5f5;
          padding: 15px;
          border-left: 4px solid #cfa84b;
          border-radius: 4px;
          margin-top: 10px;
        }
        .message-box p {
          margin: 0;
          font-style: italic;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .footer p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #cfa84b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 15px;
        }
        .button:hover {
          background: #b8963f;
        }
        .urgent {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .urgent p {
          margin: 0;
          color: #856404;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>New Enquiry Received</p>
      </div>
      
      <div class="content">
        <div class="urgent">
          <p>⚠️ New ${data.serviceRequested} enquiry requires your attention</p>
        </div>

        <div class="section">
          <h2>Customer Information</h2>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${data.customerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.customerEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.customerPhone}</span>
          </div>
          ${data.budget ? `
          <div class="info-row">
            <span class="info-label">Budget:</span>
            <span class="info-value">${data.budget}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h2>Service Requested</h2>
          <p style="font-size: 16px; color: #004d40; font-weight: 600;">${data.serviceRequested}</p>
        </div>

        <div class="section">
          <h2>Message</h2>
          <div class="message-box">
            <p>${data.message}</p>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="mailto:${data.customerEmail}" class="button">Reply to Customer</a>
        </div>
      </div>

      <div class="footer">
        <p><strong>${COMPANY_NAME}</strong></p>
        <p>This email was sent from your website contact form</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return {
    to: ADMIN_EMAIL,
    subject: `New ${data.serviceRequested} Enquiry - ${data.customerName}`,
    html,
  };
}

// Customer confirmation email template
export function getCustomerConfirmationEmail(data: {
  customerName: string;
  serviceRequested: string;
  enquiryId?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Your Enquiry</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content {
          background: #fff;
          padding: 40px 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .thank-you {
          text-align: center;
          margin-bottom: 30px;
        }
        .thank-you h2 {
          color: #004d40;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .thank-you p {
          font-size: 16px;
          color: #666;
        }
        .details {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .details h3 {
          color: #004d40;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 10px;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
          width: 120px;
          flex-shrink: 0;
        }
        .detail-value {
          color: #333;
          flex: 1;
        }
        .assurance {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .assurance p {
          margin: 0;
          color: #2e7d32;
        }
        .contact-info {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .contact-info p {
          margin: 5px 0;
          color: #e65100;
        }
        .footer {
          background: #f5f5f5;
          padding: 30px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .footer h3 {
          color: #004d40;
          margin: 0 0 10px 0;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          color: #004d40;
          text-decoration: none;
          margin: 0 10px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>Constructions & Interiors</p>
      </div>
      
      <div class="content">
        <div class="thank-you">
          <h2>Thank You for Your Enquiry!</h2>
          <p>We have received your request and will get back to you shortly.</p>
        </div>

        <div class="details">
          <h3>Enquiry Details</h3>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${data.customerName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${data.serviceRequested}</span>
          </div>
          ${data.enquiryId ? `
          <div class="detail-row">
            <span class="detail-label">Reference:</span>
            <span class="detail-value">#${data.enquiryId}</span>
          </div>
          ` : ''}
        </div>

        <div class="assurance">
          <p>✓ Our team will review your enquiry and contact you within 24-48 hours</p>
          <p>✓ You will receive a detailed response with next steps</p>
        </div>

        <div class="contact-info">
          <p><strong>Need immediate assistance?</strong></p>
          <p>📞 Call us: ${company.primaryPhone}</p>
          <p>📧 Email us: ${company.email}</p>
        </div>

        <div class="footer">
          <h3>${COMPANY_NAME}</h3>
          <p>${company.tagline}</p>
          <div class="social-links">
            <a href="${company.website}">Website</a> | <a href="${company.instagram}">Instagram</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.customerName, // This should be the email, will be passed separately
    subject: `Thank You for Your Enquiry - ${COMPANY_NAME}`,
    html,
  };
}

// Quote request email template
export function getQuoteRequestEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectType: string;
  location: string;
  budget: string;
  timeline: string;
  requirements: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          color: #004d40;
          font-size: 18px;
          margin-bottom: 15px;
          border-bottom: 2px solid #cfa84b;
          padding-bottom: 8px;
        }
        .info-row {
          display: flex;
          margin-bottom: 12px;
        }
        .info-label {
          font-weight: 600;
          color: #555;
          width: 140px;
          flex-shrink: 0;
        }
        .info-value {
          color: #333;
          flex: 1;
        }
        .requirements-box {
          background: #f5f5f5;
          padding: 15px;
          border-left: 4px solid #cfa84b;
          border-radius: 4px;
          margin-top: 10px;
        }
        .requirements-box p {
          margin: 0;
          white-space: pre-wrap;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .footer p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        .urgent {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .urgent p {
          margin: 0;
          color: #856404;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #cfa84b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 15px;
        }
        .button:hover {
          background: #b8963f;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>New Quote Request</p>
      </div>
      
      <div class="content">
        <div class="urgent">
          <p>⚠️ New quote request requires your attention</p>
        </div>

        <div class="section">
          <h2>Customer Information</h2>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${data.customerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.customerEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.customerPhone}</span>
          </div>
        </div>

        <div class="section">
          <h2>Project Details</h2>
          <div class="info-row">
            <span class="info-label">Project Type:</span>
            <span class="info-value">${data.projectType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${data.location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Budget:</span>
            <span class="info-value">${data.budget}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Timeline:</span>
            <span class="info-value">${data.timeline}</span>
          </div>
        </div>

        <div class="section">
          <h2>Requirements</h2>
          <div class="requirements-box">
            <p>${data.requirements}</p>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="mailto:${data.customerEmail}" class="button">Reply to Customer</a>
        </div>
      </div>

      <div class="footer">
        <p><strong>${COMPANY_NAME}</strong></p>
        <p>This email was sent from your website quote request form</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return {
    to: ADMIN_EMAIL,
    subject: `New Quote Request - ${data.projectType} - ${data.customerName}`,
    html,
  };
}

// Send admin notification email
export async function sendAdminNotification(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceRequested: string;
  message: string;
  budget?: string;
}) {
  const emailParams = getAdminNotificationEmail(data);
  const result = await sendEmailWithRetry({
    ...emailParams,
    to: emailParams.to as string,
  });
  return result;
}

// Send customer confirmation email
export async function sendCustomerConfirmation(data: {
  customerEmail: string;
  customerName: string;
  serviceRequested: string;
  enquiryId?: string;
}) {
  const emailParams = getCustomerConfirmationEmail(data);
  const result = await sendEmailWithRetry({
    ...emailParams,
    to: data.customerEmail,
  });
  return result;
}

// Send quote request email
export async function sendQuoteRequest(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectType: string;
  location: string;
  budget: string;
  timeline: string;
  requirements: string;
}) {
  const emailParams = getQuoteRequestEmail(data);
  const result = await sendEmailWithRetry({
    ...emailParams,
    to: emailParams.to as string,
  });
  return result;
}

// Send contact form email (both admin and customer)
export async function sendContactFormEmails(data: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  // Send admin notification
  const adminResult = await sendAdminNotification({
    customerName: data.name,
    customerEmail: data.email,
    customerPhone: data.phone,
    serviceRequested: data.subject,
    message: data.message,
  });

  // Send customer confirmation
  const customerResult = await sendCustomerConfirmation({
    customerEmail: data.email,
    customerName: data.name,
    serviceRequested: data.subject,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Send enquiry submission emails
export async function sendEnquiryEmails(data: {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  budget?: string;
  enquiryId?: string;
}) {
  // Send admin notification
  const adminResult = await sendAdminNotification({
    customerName: data.name,
    customerEmail: data.email,
    customerPhone: data.phone,
    serviceRequested: data.service,
    message: data.message,
    budget: data.budget,
  });

  // Send customer confirmation
  const customerResult = await sendCustomerConfirmation({
    customerEmail: data.email,
    customerName: data.name,
    serviceRequested: data.service,
    enquiryId: data.enquiryId,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Send quote request emails
export async function sendQuoteRequestEmails(data: {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  location: string;
  budget: string;
  timeline: string;
  requirements: string;
}) {
  // Send admin notification
  const adminResult = await sendQuoteRequest({
    customerName: data.name,
    customerEmail: data.email,
    customerPhone: data.phone,
    projectType: data.projectType,
    location: data.location,
    budget: data.budget,
    timeline: data.timeline,
    requirements: data.requirements,
  });

  // Send customer confirmation
  const customerResult = await sendCustomerConfirmation({
    customerEmail: data.email,
    customerName: data.name,
    serviceRequested: data.projectType,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Generic send email function for custom emails
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{ filename: string; content: string | Buffer }>;
}) {
  return await sendEmailWithRetry(params);
}

// OTP verification email template
export function getOTPEmail(data: {
  name: string;
  otp: string;
  expiryMinutes: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Sree Venkatesswara Constructions</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content {
          padding: 40px 30px;
        }
        .otp-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #004d40;
          margin: 10px 0;
          font-family: 'Courier New', monospace;
        }
        .info-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .info-box p {
          margin: 5px 0;
          color: #92400e;
        }
        .footer {
          background: #f5f5f5;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer h3 {
          color: #004d40;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .security-notice {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .security-notice p {
          margin: 5px 0;
          color: #991b1b;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Verification</h1>
          <p>Sree Venkatesswara Constructions & Interiors</p>
        </div>

        <div class="content">
          <p style="font-size: 16px; color: #374151;">
            Hi <strong>${data.name}</strong>,
          </p>

          <p style="font-size: 16px; color: #374151; margin: 20px 0;">
            Thank you for registering for the admin account. Please use the following verification code to complete your registration:
          </p>

          <div class="otp-box">
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">YOUR VERIFICATION CODE</p>
            <div class="otp-code">${data.otp}</div>
            <p style="margin: 10px 0 0 0; color: #166534; font-size: 14px;">
              Valid for ${data.expiryMinutes} minutes
            </p>
          </div>

          <div class="info-box">
            <p><strong>📋 Instructions:</strong></p>
            <p>1. Enter this code on the verification page</p>
            <p>2. The code will expire in ${data.expiryMinutes} minutes</p>
            <p>3. If you didn't request this, please ignore this email</p>
          </div>

          <div class="security-notice">
            <p><strong>🔒 Security Notice:</strong></p>
            <p>Never share this code with anyone. Our team will never ask for your verification code.</p>
          </div>
        </div>

        <div class="footer">
          <h3>Sree Venkatesswara Constructions & Interiors</h3>
          <p>Building Dreams, Creating Spaces</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: 'Verify Your Email - Sree Venkatesswara Constructions',
    html,
  };
}

// Send OTP verification email
export async function sendOTPEmail(params: {
  to: string;
  name: string;
  otp: string;
  expiryMinutes?: number;
}) {
  console.log('=== SEND OTP EMAIL ===');
  console.log('Recipient:', params.to);
  console.log('Name:', params.name);
  console.log('OTP:', params.otp);
  console.log('Expiry minutes:', params.expiryMinutes || 10);
  
  const emailParams = getOTPEmail({
    name: params.name,
    otp: params.otp,
    expiryMinutes: params.expiryMinutes || 10,
  });

  console.log('Email template generated');
  console.log('Subject:', emailParams.subject);
  console.log('HTML length:', emailParams.html.length);

  const result = await sendEmailWithRetry({
    to: params.to,
    subject: emailParams.subject,
    html: emailParams.html,
  });

  console.log('OTP email send result:', result);
  console.log('=================================');

  return result;
}

// AI-Style Email Generation Function
// This function generates personalized email responses based on service type
// Future-ready: Can be extended to use OpenAI API for AI-generated responses
export function generateAIStyleEmailResponse(data: {
  customerName: string;
  service: string;
  location?: string;
  message: string;
}): { subject: string; body: string } {
  const { customerName, service, location, message } = data;
  
  // Service-specific response templates
  const serviceResponses: Record<string, { intro: string; focus: string; nextSteps: string }> = {
    'House Construction': {
      intro: 'Thank you for reaching out to us about your house construction project.',
      focus: 'Our team specializes in residential construction, from foundation to finishing. We understand that building a home is one of the most significant investments you\'ll make, and we\'re committed to delivering quality craftsmanship that stands the test of time.',
      nextSteps: 'We will review your requirements and prepare a detailed estimation including structural planning, material specifications, and timeline projections. Our experts will contact you to discuss your vision in detail.'
    },
    'Construction': {
      intro: 'Thank you for reaching out to us about your construction project.',
      focus: 'Our team specializes in comprehensive construction services, from residential to commercial projects. We bring expertise in structural execution, quality materials, and timely delivery to every project we undertake.',
      nextSteps: 'We will review your requirements and prepare a detailed assessment including planning, estimation, and execution strategy. Our experts will contact you to discuss your project scope.'
    },
    'Interior Design': {
      intro: 'Thank you for your interest in our interior design services.',
      focus: 'Our design team creates modern luxury interiors that blend aesthetics with functionality. From concept development to material selection and final styling, we transform spaces into personalized sanctuaries.',
      nextSteps: 'We will review your design preferences and prepare a consultation plan. Our designers will reach out to understand your style, requirements, and budget to create a tailored proposal.'
    },
    'Interiors': {
      intro: 'Thank you for your interest in our interior design services.',
      focus: 'Our design team creates modern luxury interiors that blend aesthetics with functionality. From concept development to material selection and final styling, we transform spaces into personalized sanctuaries.',
      nextSteps: 'We will review your design preferences and prepare a consultation plan. Our designers will reach out to understand your style, requirements, and budget to create a tailored proposal.'
    },
    'Renovation': {
      intro: 'Thank you for considering us for your renovation project.',
      focus: 'Renovation requires a careful balance of preserving what works and upgrading what needs improvement. Our team excels in home remodeling, space upgrades, and modern redesigning while respecting the existing structure.',
      nextSteps: 'We will conduct a thorough site assessment and prepare a renovation plan that addresses your needs. Our team will contact you to schedule a site visit and discuss the transformation possibilities.'
    },
    'Commercial Construction': {
      intro: 'Thank you for your interest in our commercial construction services.',
      focus: 'Commercial projects demand precision, compliance, and business-focused execution. Our team has extensive experience in delivering commercial spaces that meet business requirements, regulatory standards, and operational efficiency.',
      nextSteps: 'We will evaluate your project requirements and prepare a comprehensive proposal covering project scope, timeline, and business considerations. Our commercial team will reach out to discuss your specific needs.'
    },
    'Civil Works': {
      intro: 'Thank you for your inquiry about our civil works services.',
      focus: 'Our civil engineering team handles foundational work, RCC structures, and site development with technical precision. We ensure robust structural integrity and compliance with engineering standards.',
      nextSteps: 'We will review your technical requirements and prepare an assessment. Our engineers will contact you to discuss the structural specifications and execution plan.'
    },
    'Plumbing': {
      intro: 'Thank you for reaching out about your plumbing requirements.',
      focus: 'Our plumbing services cover comprehensive water systems, fittings, and drainage solutions. We ensure leak-free installations, proper water pressure, and efficient drainage systems for residential and commercial properties.',
      nextSteps: 'We will assess your plumbing needs and prepare a solution plan. Our team will contact you to discuss the system requirements and installation approach.'
    },
    'Electrical': {
      intro: 'Thank you for your inquiry about our electrical services.',
      focus: 'Our electrical team provides safe wiring, lighting systems, and smart electrical solutions. We prioritize safety, energy efficiency, and modern technology integration in all our electrical work.',
      nextSteps: 'We will evaluate your electrical requirements and prepare a comprehensive plan. Our electricians will contact you to discuss load assessment and system design.'
    },
    'Painting': {
      intro: 'Thank you for your interest in our painting services.',
      focus: 'Our painting services deliver premium interior and exterior finishes with texture options and protective coatings. We use quality materials and skilled application to ensure lasting beauty and protection.',
      nextSteps: 'We will review your painting requirements and prepare a finish plan. Our team will contact you to discuss color options, texture preferences, and surface preparation.'
    },
    'Carpentry': {
      intro: 'Thank you for your inquiry about our carpentry services.',
      focus: 'Our carpentry team creates custom woodwork, furniture, and storage solutions tailored to your space. We work with quality materials like teak and hardwoods to deliver durable and beautiful craftsmanship.',
      nextSteps: 'We will assess your carpentry needs and prepare a customization plan. our team will contact you to discuss design preferences and material selection.'
    }
  };

  // Get service-specific response or use default
  const serviceResponse = serviceResponses[service] || {
    intro: 'Thank you for contacting Sree Venkatesswara Constructions.',
    focus: 'Our team is committed to delivering quality construction and interior services. We take pride in our craftsmanship and customer satisfaction.',
    nextSteps: 'We will review your enquiry and prepare the necessary information. Our team will contact you shortly to discuss your requirements.'
  };

  // Generate personalized email body
  const body = `Dear ${customerName},

${serviceResponse.intro}

${serviceResponse.focus}

${location ? `Based on your location (${location}), our team will factor in local requirements and logistics.` : ''}

Summary of your enquiry:
"${message}"

${serviceResponse.nextSteps}

For urgent assistance:
Phone: ${company.primaryPhone}
Email: ${company.email}

Regards,
${company.name}`;

  const subject = `Your Enquiry is Under Review – Sree Venkatesswara Constructions`;

  return { subject, body };
}

// AI-Style Customer Acknowledgement Email Template
export function getAIStyleCustomerEmail(data: {
  customerName: string;
  customerEmail: string;
  service: string;
  location?: string;
  message: string;
  enquiryId?: string;
}) {
  const { subject, body } = generateAIStyleEmailResponse({
    customerName: data.customerName,
    service: data.service,
    location: data.location,
    message: data.message,
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .logo {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .message-body {
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 25px;
        }
        .message-body p {
          margin-bottom: 15px;
        }
        .enquiry-summary {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .enquiry-summary p {
          margin: 0;
          font-style: italic;
          color: #166534;
        }
        .enquiry-summary .label {
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
          font-style: normal;
        }
        .contact-box {
          background: #fff7ed;
          border-left: 4px solid #f97316;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .contact-box p {
          margin: 8px 0;
          color: #9a3412;
        }
        .contact-box strong {
          font-weight: 600;
        }
        .footer {
          background: #f5f5f5;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer h3 {
          color: #004d40;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .reference {
          background: #f3f4f6;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          .header, .content, .footer {
            padding: 25px 20px;
          }
          .header h1 {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏗️</div>
          <h1>Sree Venkatesswara Constructions</h1>
          <p>Constructions & Interiors</p>
        </div>

        <div class="content">
          <div class="greeting">
            Dear ${data.customerName},
          </div>

          <div class="message-body">
            ${body.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
          </div>

          <div class="enquiry-summary">
            <span class="label">Your Enquiry Summary:</span>
            <p>"${data.message}"</p>
            ${data.location ? `<p style="margin-top: 10px; font-style: normal;"><strong>Location:</strong> ${data.location}</p>` : ''}
            ${data.service ? `<p style="margin-top: 5px; font-style: normal;"><strong>Service:</strong> ${data.service}</p>` : ''}
          </div>

          <div class="contact-box">
            <p><strong>For urgent assistance:</strong></p>
            <p>📞 Phone: ${company.primaryPhone}</p>
            <p>📧 Email: <a href="mailto:${company.email}" style="color: #ea580c;">${company.email}</a></p>
          </div>

          ${data.enquiryId ? `
          <div class="reference">
            <strong>Reference ID:</strong> ${data.enquiryId}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <h3>Sree Venkatesswara Constructions</h3>
          <p>Building Dreams, Creating Spaces</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.customerEmail,
    subject,
    html,
  };
}

// Send AI-style customer acknowledgement email
export async function sendAIStyleCustomerEmail(data: {
  customerEmail: string;
  customerName: string;
  service: string;
  location?: string;
  message: string;
  enquiryId?: string;
}) {
  console.log('=== SEND AI-STYLE CUSTOMER EMAIL ===');
  console.log('Recipient:', data.customerEmail);
  console.log('Customer Name:', data.customerName);
  console.log('Service:', data.service);
  console.log('Location:', data.location || 'Not provided');
  console.log('Enquiry ID:', data.enquiryId || 'N/A');
  
  const emailParams = getAIStyleCustomerEmail(data);

  console.log('Email template generated');
  console.log('Subject:', emailParams.subject);
  console.log('HTML length:', emailParams.html.length);

  const result = await sendEmailWithRetry({
    to: emailParams.to,
    subject: emailParams.subject,
    html: emailParams.html,
    emailType: 'customer_acknowledgement',
    enquiryId: data.enquiryId,
    metadata: {
      customerName: data.customerName,
      service: data.service,
      location: data.location,
    },
  });

  console.log('AI-style customer email send result:', result);
  console.log('=================================');

  return result;
}

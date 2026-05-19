import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sreevenkatesswara.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sreevenkatesswara.com';
const COMPANY_NAME = 'Sree Venkatesswara Constructions & Interiors';

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

// Send email with retry logic
async function sendEmailWithRetry(
  params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  },
  retryCount = 0
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const data = await resend.emails.send({
      from: params.from || FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    logEmailAttempt('email', Array.isArray(params.to) ? params.to.join(', ') : params.to, true);
    
    return { success: true, data };
  } catch (error: any) {
    logEmailAttempt(
      'email',
      Array.isArray(params.to) ? params.to.join(', ') : params.to,
      false,
      error
    );

    // Retry on failure
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying email send (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return sendEmailWithRetry(params, retryCount + 1);
    }

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
          <p>📞 Call us: +91 98765 43210</p>
          <p>📧 Email us: info@sreevenkatesswara.com</p>
        </div>

        <div class="footer">
          <h3>${COMPANY_NAME}</h3>
          <p>Building Dreams, Creating Spaces</p>
          <div class="social-links">
            <a href="#">Website</a> | <a href="#">Facebook</a> | <a href="#">Instagram</a>
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

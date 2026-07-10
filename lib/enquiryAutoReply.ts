import { Resend } from 'resend';
import { prisma } from './prisma';
import { company } from './company';

// Initialize Resend with API key or fallback
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const COMPANY_NAME = company.name;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Delay function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const prismaAny = prisma as any;
    if (prismaAny.emailLog) {
      await prismaAny.emailLog.create({
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
    } else {
    }
  } catch (dbError) {
    console.error('[AUTO-REPLY] Failed to log to database:', dbError);
  }
}

// Send email with retry logic
async function sendEmailWithRetry(
  params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    emailType?: string;
    enquiryId?: string;
    metadata?: any;
  },
  retryCount = 0
): Promise<{ success: boolean; data?: any; error?: any }> {
  const toEmail = params.to;
  const emailType = params.emailType || 'customer_acknowledgement';


  if (!resend) {
    const error = new Error('Resend API key not configured. Please add RESEND_API_KEY to your .env file.');
    console.error('[AUTO-REPLY] ❌ Resend client not initialized');
    console.error('[AUTO-REPLY] ❌ Error:', error.message);

    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'failed',
      error: error.message,
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });

    return { success: false, error };
  }

  try {
    const emailParams = {
      from: params.from || FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };

    const result = await resend.emails.send(emailParams);

    // Check if Resend returned an error in the response
    if (result.error) {
      console.error('[AUTO-REPLY] ❌ Resend API returned error:', result.error);
      console.error('[AUTO-REPLY] ❌ Error name:', result.error.name);
      console.error('[AUTO-REPLY] ❌ Error message:', result.error.message);
      console.error('[AUTO-REPLY] ❌ Error statusCode:', result.error.statusCode);

      await logEmailToDatabase({
        toEmail,
        subject: params.subject,
        type: emailType,
        status: 'failed',
        error: result.error.message,
        enquiryId: params.enquiryId,
        metadata: params.metadata,
      });

      return { success: false, error: result.error };
    }


    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'sent',
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[AUTO-REPLY] ❌ Resend API error:', error);
    console.error('[AUTO-REPLY] ❌ Error name:', error?.name);
    console.error('[AUTO-REPLY] ❌ Error message:', error?.message);
    console.error('[AUTO-REPLY] ❌ Error code:', error?.code);
    console.error('[AUTO-REPLY] ❌ Error statusCode:', error?.statusCode);

    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return sendEmailWithRetry(params, retryCount + 1);
    }

    await logEmailToDatabase({
      toEmail,
      subject: params.subject,
      type: emailType,
      status: 'failed',
      error: error.message,
      enquiryId: params.enquiryId,
      metadata: params.metadata,
    });

    return { success: false, error };
  }
}

// Generate intelligent enquiry reply
// This function is OpenAI-ready - can be replaced with OpenAI API calls in the future
// without changing the enquiry workflow
export function generateEnquiryReply(enquiry: {
  customerName: string;
  email: string;
  service: string;
  location?: string | null;
  message?: string | null;
}): { subject: string; body: string } {
  const { customerName, service, location, message } = enquiry;
  
  // Service-specific response templates
  const serviceResponses: Record<string, { intro: string; details: string; nextSteps: string }> = {
    'House Construction': {
      intro: 'Thank you for contacting Sree Venkatesswara Constructions regarding your house construction project.',
      details: 'Our team specializes in comprehensive house construction services including construction planning, detailed estimation, plot review, and professional consultation. We understand that building a home is a significant investment, and we are committed to delivering quality craftsmanship.',
      nextSteps: 'Our team will review your requirements and prepare the necessary information before contacting you. We will discuss construction planning, provide detailed estimation, conduct plot review, and offer professional consultation tailored to your needs.'
    },
    'Interior Design': {
      intro: 'Thank you for contacting Sree Venkatesswara Constructions regarding your interior design project.',
      details: 'Our design team specializes in creating beautiful and functional spaces. We offer comprehensive design consultation, customization options, and expert space planning to transform your vision into reality.',
      nextSteps: 'Our team will review your requirements and prepare the necessary information before contacting you. We will schedule a design consultation, discuss customization options, and provide detailed space planning for your project.'
    },
    'Renovation': {
      intro: 'Thank you for contacting Sree Venkatesswara Constructions regarding your renovation project.',
      details: 'Our renovation team specializes in transforming existing spaces. We provide thorough site assessment, detailed renovation planning, and expert improvement recommendations to enhance your property.',
      nextSteps: 'Our team will review your requirements and prepare the necessary information before contacting you. We will conduct a site assessment, develop a comprehensive renovation plan, and provide improvement recommendations based on your needs.'
    },
    'Commercial Construction': {
      intro: 'Thank you for contacting Sree Venkatesswara Constructions regarding your commercial construction project.',
      details: 'Our commercial construction team specializes in business-focused projects. We carefully analyze business requirements, conduct thorough project evaluation, and develop detailed commercial planning to ensure successful project delivery.',
      nextSteps: 'Our team will review your requirements and prepare the necessary information before contacting you. We will discuss your business requirements, perform project evaluation, and provide comprehensive commercial planning for your venture.'
    }
  };

  // Get service-specific response or use generic professional acknowledgement
  const serviceResponse = serviceResponses[service] || {
    intro: 'Thank you for contacting Sree Venkatesswara Constructions.',
    details: 'Our team is committed to delivering quality construction and interior services. We take pride in our craftsmanship and customer satisfaction.',
    nextSteps: 'Our team is currently reviewing your requirements and will prepare the necessary information before contacting you.'
  };

  // Generate personalized email body
  const body = `Dear ${customerName},

Thank you for contacting Sree Venkatesswara Constructions.

We have successfully received your enquiry regarding ${service}.

Our team is currently reviewing your requirements and will prepare the necessary information before contacting you.

${serviceResponse.details}

${location ? `Based on your location (${location}), our team will factor in local requirements and logistics.` : ''}

Summary of your enquiry:

"${message || 'No message provided'}"

${serviceResponse.nextSteps}

We will contact you shortly.

For urgent assistance:

Phone: ${company.primaryPhone}
Email: ${company.email}

Regards,
${company.name}`;

  const subject = 'Your Enquiry Is Under Review – Sree Venkatesswara Constructions';

  return { subject, body };
}

// Generate professional HTML email
function generateHTMLEmail(data: {
  customerName: string;
  email: string;
  service: string;
  location?: string | null;
  message?: string | null;
  enquiryId?: string;
}): string {
  const { subject, body } = generateEnquiryReply(data);

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
        .contact-box a {
          color: #ea580c;
          text-decoration: none;
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
            <span class="label">Summary of your enquiry:</span>
            <p>"${data.message || 'No message provided'}"</p>
            ${data.location ? `<p style="margin-top: 10px; font-style: normal;"><strong>Location:</strong> ${data.location}</p>` : ''}
            <p style="margin-top: 5px; font-style: normal;"><strong>Service:</strong> ${data.service}</p>
          </div>

          <div class="contact-box">
            <p><strong>For urgent assistance:</strong></p>
            <p>📞 Phone: ${company.primaryPhone}</p>
            <p>📧 Email: <a href="mailto:${company.email}">${company.email}</a></p>
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

  return html;
}

// Send enquiry acknowledgement email
export async function sendEnquiryAcknowledgement(enquiry: {
  id: string;
  customerName: string;
  email: string;
  service: string;
  location?: string | null;
  message?: string | null;
}): Promise<{ success: boolean; error?: any }> {

  try {
    const { subject } = generateEnquiryReply(enquiry);
    const html = generateHTMLEmail({
      ...enquiry,
      enquiryId: enquiry.id,
    });

    const result = await sendEmailWithRetry({
      to: enquiry.email,
      subject,
      html,
      emailType: 'customer_acknowledgement',
      enquiryId: enquiry.id,
      metadata: {
        customerName: enquiry.customerName,
        service: enquiry.service,
        location: enquiry.location,
      },
    });


    if (result.success) {
      return { success: true };
    } else {
      console.error('[AUTO-REPLY] ❌ Delivery failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('[AUTO-REPLY] ❌ Delivery failed with exception:', error);
    console.error('[AUTO-REPLY] ❌ Error message:', error?.message);
    console.error('[AUTO-REPLY] ❌ Error stack:', error?.stack);
    return { success: false, error };
  }
}

// WhatsApp Cloud API integration for Sree Venkatesswara Constructions & Interiors

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

interface WhatsAppMessage {
  to: string;
  templateName?: string;
  templateLanguage?: string;
  components?: any[];
  text?: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// WhatsApp configuration
const config: WhatsAppConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Delay function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Log WhatsApp attempts
const logWhatsAppAttempt = (type: string, to: string, success: boolean, error?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    to,
    success,
    error: error?.message || null,
  };
  
  console.log(`[WhatsApp Log] ${JSON.stringify(logEntry)}`);
  
  // In production, you might want to save this to a database
  return logEntry;
};

// Send WhatsApp message with retry logic
async function sendWhatsAppMessage(
  message: WhatsAppMessage,
  retryCount = 0
): Promise<WhatsAppResponse> {
  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };

    let body: any;

    if (message.templateName) {
      // Send template message
      body = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'template',
        template: {
          name: message.templateName,
          language: {
            code: message.templateLanguage || 'en_US',
          },
          components: message.components || [],
        },
      };
    } else if (message.text) {
      // Send text message
      body = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'text',
        text: {
          body: message.text,
        },
      };
    } else {
      throw new Error('Either templateName or text must be provided');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send WhatsApp message');
    }

    logWhatsAppAttempt('whatsapp', message.to, true);
    
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    logWhatsAppAttempt('whatsapp', message.to, false, error);

    // Retry on failure
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying WhatsApp message (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * (retryCount + 1));
      return sendWhatsAppMessage(message, retryCount + 1);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

// Admin alert message template
export function getAdminAlertMessage(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceRequested: string;
  message: string;
  budget?: string;
}): WhatsAppMessage {
  const text = `
🚨 *NEW ENQUIRY ALERT*

*Customer Details:*
• Name: ${data.customerName}
• Phone: ${data.customerPhone}
• Email: ${data.customerEmail}
${data.budget ? `• Budget: ${data.budget}` : ''}

*Service Requested:*
${data.serviceRequested}

*Message:*
${data.message}

---
*Sree Venkatesswara Constructions & Interiors*
Please respond to the customer promptly.
  `.trim();

  return {
    to: process.env.WHATSAPP_ADMIN_PHONE || '',
    text,
  };
}

// Customer greeting message template
export function getCustomerGreetingMessage(data: {
  customerName: string;
  customerPhone: string;
  serviceRequested: string;
  enquiryId?: string;
}): WhatsAppMessage {
  const text = `
🙏 *Thank You, ${data.customerName}!*

We have received your enquiry for *${data.serviceRequested}*.

${data.enquiryId ? `*Reference ID:* ${data.enquiryId}` : ''}

Our team will review your request and get back to you within 24-48 hours.

*Need immediate assistance?*
📞 Call us: +91 98765 43210
📧 Email: info@sreevenkatesswara.com

---
*Sree Venkatesswara Constructions & Interiors*
Building Dreams, Creating Spaces
  `.trim();

  return {
    to: '', // Will be set by calling function
    text,
  };
}

// Quote follow-up message template
export function getQuoteFollowUpMessage(data: {
  customerName: string;
  customerPhone: string;
  projectType: string;
  quoteId: string;
  estimatedPrice?: string;
  timeline?: string;
}): WhatsAppMessage {
  const text = `
📋 *Quote Update - ${data.quoteId}*

Dear ${data.customerName},

Thank you for your interest in *${data.projectType}*.

${data.estimatedPrice ? `*Estimated Price:* ${data.estimatedPrice}` : ''}
${data.timeline ? `*Timeline:* ${data.timeline}` : ''}

Our team is preparing a detailed quote for you. You will receive it shortly.

*Questions?*
Feel free to reach out to us anytime.

---
*Sree Venkatesswara Constructions & Interiors*
  `.trim();

  return {
    to: '', // Will be set by calling function
    text,
  };
}

// Consultation booking confirmation
export function getConsultationConfirmationMessage(data: {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  location: string;
}): WhatsAppMessage {
  const text = `
✅ *Consultation Confirmed*

Dear ${data.customerName},

Your consultation has been scheduled:

*Date:* ${data.date}
*Time:* ${data.time}
*Location:* ${data.location}

Please arrive 10 minutes before your scheduled time.

*Need to reschedule?*
Call us at +91 98765 43210

---
*Sree Venkatesswara Constructions & Interiors*
  `.trim();

  return {
    to: '', // Will be set by calling function
    text,
  };
}

// Send admin alert for new enquiry
export async function sendAdminAlert(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceRequested: string;
  message: string;
  budget?: string;
}): Promise<WhatsAppResponse> {
  const message = getAdminAlertMessage(data);
  return sendWhatsAppMessage(message);
}

// Send customer greeting
export async function sendCustomerGreeting(data: {
  customerName: string;
  customerPhone: string;
  serviceRequested: string;
  enquiryId?: string;
}): Promise<WhatsAppResponse> {
  const message = getCustomerGreetingMessage({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    serviceRequested: data.serviceRequested,
    enquiryId: data.enquiryId,
  });
  
  return sendWhatsAppMessage(message);
}

// Send quote follow-up
export async function sendQuoteFollowUp(data: {
  customerName: string;
  customerPhone: string;
  projectType: string;
  quoteId: string;
  estimatedPrice?: string;
  timeline?: string;
}): Promise<WhatsAppResponse> {
  const message = getQuoteFollowUpMessage({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    projectType: data.projectType,
    quoteId: data.quoteId,
    estimatedPrice: data.estimatedPrice,
    timeline: data.timeline,
  });
  
  return sendWhatsAppMessage(message);
}

// Send consultation confirmation
export async function sendConsultationConfirmation(data: {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  location: string;
}): Promise<WhatsAppResponse> {
  const message = getConsultationConfirmationMessage({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    date: data.date,
    time: data.time,
    location: data.location,
  });
  
  return sendWhatsAppMessage(message);
}

// Send WhatsApp messages for new enquiry (both admin and customer)
export async function sendEnquiryWhatsAppMessages(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  message: string;
  budget?: string;
  enquiryId?: string;
}): Promise<{ admin: WhatsAppResponse; customer: WhatsAppResponse }> {
  // Send admin alert
  const adminResult = await sendAdminAlert({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    serviceRequested: data.service,
    message: data.message,
    budget: data.budget,
  });

  // Send customer greeting
  const customerResult = await sendCustomerGreeting({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    serviceRequested: data.service,
    enquiryId: data.enquiryId,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Send WhatsApp messages for quote request
export async function sendQuoteWhatsAppMessages(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectType: string;
  location: string;
  budget: string;
  timeline: string;
  requirements: string;
  quoteId?: string;
}): Promise<{ admin: WhatsAppResponse; customer: WhatsAppResponse }> {
  // Send admin alert
  const adminResult = await sendAdminAlert({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    serviceRequested: data.projectType,
    message: data.requirements,
    budget: data.budget,
  });

  // Send customer greeting
  const customerResult = await sendCustomerGreeting({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    serviceRequested: data.projectType,
    enquiryId: data.quoteId,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Send WhatsApp messages for consultation booking
export async function sendConsultationWhatsAppMessages(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  location: string;
}): Promise<{ admin: WhatsAppResponse; customer: WhatsAppResponse }> {
  // Send admin alert
  const adminResult = await sendAdminAlert({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    serviceRequested: 'Consultation',
    message: `Consultation booked for ${data.date} at ${data.time}`,
  });

  // Send customer confirmation
  const customerResult = await sendConsultationConfirmation({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    date: data.date,
    time: data.time,
    location: data.location,
  });

  return {
    admin: adminResult,
    customer: customerResult,
  };
}

// Validate phone number format (basic validation for Indian numbers)
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Indian phone number (10 digits)
  return cleaned.length === 10 && /^\d+$/.test(cleaned);
}

// Format phone number to international format
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit Indian number, add country code
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  // If it already has country code, return as is
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  
  return cleaned;
}

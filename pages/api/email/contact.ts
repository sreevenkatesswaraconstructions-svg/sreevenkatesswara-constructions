import { sendContactFormEmails } from '@/lib/email';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send emails
    const results = await sendContactFormEmails({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Check if both emails were sent successfully
    if (results.admin.success && results.customer.success) {
      return res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: {
          adminEmail: results.admin.data,
          customerEmail: results.customer.data,
        },
      });
    } else {
      // Partial success
      return res.status(207).json({
        success: true,
        message: 'Contact form submitted with warnings',
        warnings: {
          admin: results.admin.success ? null : results.admin.error,
          customer: results.customer.success ? null : results.customer.error,
        },
      });
    }
  } catch (error: any) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'Failed to submit contact form',
      message: error.message,
    });
  }
}

import { sendQuoteRequestEmails } from '@/lib/email';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, projectType, location, budget, timeline, requirements } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !projectType || !location || !budget || !timeline || !requirements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate quote request ID (in production, this would come from the database)
    const quoteId = `QT${Date.now().toString().slice(-6)}`;

    // Send emails
    const results = await sendQuoteRequestEmails({
      name,
      email,
      phone,
      projectType,
      location,
      budget,
      timeline,
      requirements,
    });

    // Check if both emails were sent successfully
    if (results.admin.success && results.customer.success) {
      return res.status(200).json({
        success: true,
        message: 'Quote request submitted successfully',
        quoteId,
        data: {
          adminEmail: results.admin.data,
          customerEmail: results.customer.data,
        },
      });
    } else {
      // Partial success
      return res.status(207).json({
        success: true,
        message: 'Quote request submitted with warnings',
        quoteId,
        warnings: {
          admin: results.admin.success ? null : results.admin.error,
          customer: results.customer.success ? null : results.customer.error,
        },
      });
    }
  } catch (error: any) {
    console.error('Quote request error:', error);
    return res.status(500).json({
      error: 'Failed to submit quote request',
      message: error.message,
    });
  }
}

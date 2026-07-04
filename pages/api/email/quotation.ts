import type { NextApiRequest, NextApiResponse } from 'next'
import { sendEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { to, subject, html, attachmentBase64, attachmentFileName } = req.body || {}

    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, message: 'Missing required email fields' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(to))) {
      return res.status(400).json({ success: false, message: 'Invalid recipient email' })
    }

    const attachments = attachmentBase64
      ? [{
          filename: String(attachmentFileName || 'quotation.pdf'),
          content: Buffer.from(String(attachmentBase64), 'base64'),
        }]
      : undefined

    const result = await sendEmail({
      to: String(to),
      subject: String(subject),
      html: String(html),
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      attachments,
    })

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.success ? 'Quotation email sent successfully' : result.error?.message || 'Failed to send email',
      data: result.data,
    })
  } catch (error: any) {
    console.error('Quotation email API error:', error)
    return res.status(500).json({ success: false, message: error.message || 'Failed to send quotation email' })
  }
}

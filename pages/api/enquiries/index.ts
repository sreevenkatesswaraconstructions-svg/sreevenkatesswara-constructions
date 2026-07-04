import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { sendEnquiryEmails } from '../../../lib/email'
import { sendEnquiryAcknowledgement } from '../../../lib/enquiryAutoReply'
import { sendEnquiryWhatsAppMessages } from '../../../lib/whatsapp'
import { createNotification } from '../../../lib/notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, search, startDate, endDate } = req.query

      const where: any = {}
      
      if (status) {
        where.status = status as string
      }
      
      if (search) {
        where.OR = [
          { customerName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
          { service: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate as string)
        if (endDate) where.createdAt.lte = new Date(endDate as string)
      }

      const enquiries = await prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
      return res.status(200).json(enquiries)
    } catch (error) {
      console.error('Error fetching enquiries:', error)
      return res.status(500).json({ error: 'Failed to fetch enquiries' })
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[ENQUIRY] Received payload:', req.body)
      const { customerName, phone, email, service, budget, location, message } = req.body

      if (!customerName || !phone || !email || !service) {
        console.log('[ENQUIRY] Missing required fields:', { customerName, phone, email, service })
        return res.status(400).json({ error: 'Missing required fields' })
      }

      console.log('[ENQUIRY] Creating enquiry...')
      const enquiry = await prisma.enquiry.create({
        data: {
          customerName,
          phone,
          email,
          service,
          budget: budget || null,
          location: location || null,
          message: message || null
        }
      })
      console.log('[ENQUIRY] Enquiry created:', enquiry.id)

      // Create notification
      await createNotification({
        title: 'New Enquiry Received',
        message: `${customerName} has submitted an enquiry for ${service}`,
        type: 'info',
        link: '/admin/enquiries'
      })

      // Send email notifications
      let adminEmailSent = false
      let customerEmailSent = false
      let emailErrorReason: string | null = null

      try {
        console.log('[ENQUIRY] Sending admin notification email...')
        // Send admin notification
        const emailResult = await sendEnquiryEmails({
          name: customerName,
          email: email,
          phone: phone,
          service: service,
          message: message || '',
          budget: budget || '',
          enquiryId: enquiry.id
        })
        
        if (emailResult.admin && emailResult.admin.success) {
          adminEmailSent = true
          console.log('[ENQUIRY] ✅ Admin notification email sent successfully')
        } else {
          console.error('[ENQUIRY] ❌ Admin notification email failed:', emailResult.admin?.error)
        }
      } catch (adminEmailError) {
        console.error('[ENQUIRY] ❌ Admin email sending failed with exception:', adminEmailError)
      }

      try {
        console.log('[ENQUIRY] Sending intelligent customer acknowledgement email...')
        console.log('[ENQUIRY] Customer email:', email)
        // Send intelligent customer acknowledgement email
        const autoReplyResult = await sendEnquiryAcknowledgement({
          id: enquiry.id,
          customerName: customerName,
          email: email,
          service: service,
          location: location || null,
          message: message || null
        })
        
        if (autoReplyResult.success) {
          customerEmailSent = true
          console.log('[ENQUIRY] ✅ Customer acknowledgement email sent successfully')
        } else {
          customerEmailSent = false
          emailErrorReason = autoReplyResult.error?.message || 'Unknown error'
          console.error('[ENQUIRY] ❌ Customer acknowledgement email failed:', autoReplyResult.error)
          console.error('[ENQUIRY] ❌ Error reason:', emailErrorReason)
        }
      } catch (customerEmailError) {
        customerEmailSent = false
        emailErrorReason = customerEmailError instanceof Error ? customerEmailError.message : 'Unknown error'
        console.error('[ENQUIRY] ❌ Customer email sending failed with exception:', customerEmailError)
      }

      // Send WhatsApp notification
      try {
        await sendEnquiryWhatsAppMessages({
          customerName,
          customerPhone: phone,
          customerEmail: email,
          service: service,
          message: message || '',
          budget: budget || '',
          enquiryId: enquiry.id
        })
      } catch (whatsappError) {
        console.error('[ENQUIRY] WhatsApp sending failed:', whatsappError)
        // Continue even if WhatsApp fails
      }

      // Return enquiry with email delivery status
      const response = {
        ...enquiry,
        emailDeliveryStatus: {
          adminEmailSent,
          customerEmailSent,
          errorReason: emailErrorReason
        }
      }

      console.log('[ENQUIRY] ==================================')
      console.log('[ENQUIRY] Enquiry creation summary:')
      console.log('[ENQUIRY] - Enquiry ID:', enquiry.id)
      console.log('[ENQUIRY] - Admin email sent:', adminEmailSent)
      console.log('[ENQUIRY] - Customer email sent:', customerEmailSent)
      if (emailErrorReason) {
        console.log('[ENQUIRY] - Email error reason:', emailErrorReason)
      }
      console.log('[ENQUIRY] ==================================')

      return res.status(201).json(response)
    } catch (error) {
      console.error('[ENQUIRY] Error:', error)
      return res.status(500).json({ error: 'Failed to create enquiry' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

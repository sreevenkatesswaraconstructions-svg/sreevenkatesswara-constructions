import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { sendAdminNotification } from '../../../lib/email'
import { sendEnquiryAcknowledgement } from '../../../lib/enquiryAutoReply'
import { sendEnquiryWhatsAppMessages } from '../../../lib/whatsapp'
import { createNotification } from '../../../lib/notifications'
import { normalizeEnquiryStatus, normalizeEnquirySource, normalizeEnquiryCreatedBy } from '../../../lib/enquiryUtils'
import { addEnquiryActivity } from '../../../lib/enquiryTimeline'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, search, startDate, endDate } = req.query

      const where: any = {}
      
      if (status) {
        const requestedStatus = status as string
        const normalizedStatus = normalizeEnquiryStatus(requestedStatus)
        const variants = [requestedStatus, normalizedStatus]

        if (normalizedStatus === 'New') {
          variants.push('NEW', 'PENDING')
        } else if (normalizedStatus === 'Follow-up') {
          variants.push('IN_PROGRESS', 'FOLLOW-UP')
        } else if (normalizedStatus === 'Quotation Requested') {
          variants.push('QUOTATION_REQUESTED')
        } else if (normalizedStatus === 'Won') {
          variants.push('COMPLETED')
        } else if (normalizedStatus === 'Lost') {
          variants.push('CLOSED')
        }

        where.status = { in: variants }
      }
      
      if (search) {
        where.OR = [
          { customerName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
          { service: { contains: search as string, mode: 'insensitive' } },
          { source: { contains: search as string, mode: 'insensitive' } },
          { createdBy: { contains: search as string, mode: 'insensitive' } },
          { status: { contains: search as string, mode: 'insensitive' } }
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
      const rawBody = typeof req.body === 'string'
        ? (() => {
            try {
              return JSON.parse(req.body)
            } catch {
              return {}
            }
          })()
        : req.body || {}

      const {
        customerName,
        phone,
        email,
        service,
        budget,
        location,
        message,
        notes,
        status,
        source,
        createdBy,
        performedBy,
        followUpDate,
        followUpTime,
        followUpNotes,
      } = rawBody

      const trimmedCustomerName = typeof customerName === 'string' ? customerName.trim() : ''
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : ''
      const trimmedEmail = typeof email === 'string' ? email.trim() : ''
      const trimmedService = typeof service === 'string' ? service.trim() : ''
      const trimmedMessage = typeof message === 'string' ? message : typeof notes === 'string' ? notes : ''

      if (!trimmedCustomerName || !trimmedPhone || !trimmedService) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const normalizedStatus = normalizeEnquiryStatus(status)
      const normalizedSource = normalizeEnquirySource(source)
      const normalizedCreatedBy = normalizeEnquiryCreatedBy(createdBy)
      const isManualEnquiry = normalizedCreatedBy === 'Admin'
      const shouldSendExternalNotifications = !isManualEnquiry && normalizedCreatedBy === 'Website' && normalizedSource === 'Website'

      const enquiry = await prisma.enquiry.create({
        data: {
          customerName: trimmedCustomerName,
          phone: trimmedPhone,
          email: trimmedEmail || null,
          service: trimmedService,
          budget: typeof budget === 'string' && budget.trim() ? budget.trim() : null,
          location: typeof location === 'string' && location.trim() ? location.trim() : null,
          message: trimmedMessage || null,
          status: normalizedStatus,
          source: normalizedSource,
          createdBy: normalizedCreatedBy,
          followUpDate: followUpDate ? new Date(followUpDate as string) : null,
          followUpTime: typeof followUpTime === 'string' && followUpTime.trim() ? followUpTime.trim() : null,
          followUpNotes: typeof followUpNotes === 'string' && followUpNotes.trim() ? followUpNotes.trim() : null
        }
      })

      await addEnquiryActivity({
        enquiryId: enquiry.id,
        activity: 'Enquiry Created',
        performedBy: typeof performedBy === 'string' && performedBy.trim() ? performedBy.trim() : (normalizedCreatedBy === 'Admin' ? 'Admin' : 'System')
      })

      if (isManualEnquiry) {
        return res.status(201).json(enquiry)
      }

      // Create notification
      await createNotification({
        title: 'New Enquiry Received',
        message: `${trimmedCustomerName} has submitted an enquiry for ${trimmedService}`,
        type: 'info',
        link: '/admin/enquiries'
      })

      // Send email notifications
      let adminEmailSent = false
      let customerEmailSent = false
      let emailErrorReason: string | null = null

      if (shouldSendExternalNotifications) {
        try {
          const emailResult = await sendAdminNotification({
            customerName: trimmedCustomerName,
            customerEmail: trimmedEmail,
            customerPhone: trimmedPhone,
            serviceRequested: trimmedService,
            message: trimmedMessage || '',
            budget: typeof budget === 'string' ? budget : '',
          })
          
          if (emailResult.success) {
            adminEmailSent = true
          } else {
            console.error('[ENQUIRY] ❌ Admin notification email failed:', emailResult.error)
          }
        } catch (adminEmailError) {
          console.error('[ENQUIRY] ❌ Admin email sending failed with exception:', adminEmailError)
        }

        if (trimmedEmail) {
          try {
            const autoReplyResult = await sendEnquiryAcknowledgement({
              id: enquiry.id,
              customerName: trimmedCustomerName,
              email: trimmedEmail,
              service: trimmedService,
              location: typeof location === 'string' ? location : null,
              message: trimmedMessage || null
            })
            
            if (autoReplyResult.success) {
              customerEmailSent = true
            } else {
              customerEmailSent = false
              emailErrorReason = autoReplyResult.error?.message || 'Unknown error'
              console.error('[ENQUIRY] ❌ Customer confirmation email failed:', autoReplyResult.error)
              console.error('[ENQUIRY] ❌ Error reason:', emailErrorReason)
            }
          } catch (customerEmailError) {
            customerEmailSent = false
            emailErrorReason = customerEmailError instanceof Error ? customerEmailError.message : 'Unknown error'
            console.error('[ENQUIRY] ❌ Customer confirmation email sending failed with exception:', customerEmailError)
          }
        } else {
        }

        try {
          await sendEnquiryWhatsAppMessages({
            customerName: trimmedCustomerName,
            customerPhone: trimmedPhone,
            customerEmail: trimmedEmail,
            service: trimmedService,
            message: trimmedMessage || '',
            budget: typeof budget === 'string' ? budget : '',
            enquiryId: enquiry.id
          })
        } catch (whatsappError) {
          console.error('[ENQUIRY] WhatsApp sending failed:', whatsappError)
        }
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

      if (emailErrorReason) {
      }

      return res.status(201).json(response)
    } catch (error) {
      console.error('[ENQUIRY] Error:', error)
      return res.status(500).json({ error: 'Failed to create enquiry' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

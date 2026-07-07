import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'
import { normalizeQuotationRecord } from '../../../../lib/quotations'
import { addEnquiryActivity } from '../../../../lib/enquiryTimeline'

const response = (success: boolean, data: any = null, message: string = '') => ({ success, data, message })

const normalizePhone = (phone: string) => {
  return String(phone || '').replace(/[^0-9]/g, '').trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) return res.status(401).json(response(false, null, 'Unauthorized'))

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json(response(false, null, 'Method not allowed'))
  }

  const { id } = req.query as any
  if (!id) return res.status(400).json(response(false, null, 'Quotation ID is required'))

  try {
    const quotation = await prisma.quotation.findUnique({ where: { id } })
    if (!quotation) return res.status(404).json(response(false, null, 'Quotation not found'))
    const normalized = normalizeQuotationRecord(quotation)
    if (String(normalized.status || '').trim() !== 'Accepted') {
      return res.status(400).json(response(false, null, 'Only accepted quotations can be converted to customers'))
    }

    const phone = normalizePhone(quotation.customerPhone)
    if (!phone) {
      return res.status(400).json(response(false, null, 'Quotation customer phone is required'))
    }

    const customer = await prisma.$transaction(async (tx) => {
      // Try exact match first (normalized phone)
      let customerRecord = await tx.customer.findUnique({ where: { phone } })

      // Fallback: try to find a customer whose phone contains the digits (handles formatting differences)
      if (!customerRecord) {
        customerRecord = await tx.customer.findFirst({ where: { phone: { contains: phone } } })
      }

      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            name: quotation.customerName,
            phone,
            email: quotation.customerEmail || undefined,
            location: quotation.siteAddress || undefined,
          }
        })
      }

      const updates: any = {}
      if (quotation.customerId !== customerRecord.id) {
        updates.customerId = customerRecord.id
      }
      if (Object.keys(updates).length > 0) {
        await tx.quotation.update({ where: { id }, data: updates })
      }

      await tx.quotationHistory.create({
        data: {
          quotationId: quotation.id,
          action: 'CUSTOMER_CREATED',
          adminName: session.user?.name || session.user?.email || 'Admin',
          meta: JSON.stringify({ customerId: customerRecord.id }),
        },
      })

      if (quotation.enquiryId) {
        const enquiry = await tx.enquiry.findUnique({ where: { id: quotation.enquiryId } })
        if (enquiry && enquiry.customerId !== customerRecord.id) {
          await tx.enquiry.update({ where: { id: enquiry.id }, data: { customerId: customerRecord.id } })
        }
        await tx.enquiryActivity.create({
          data: {
            enquiryId: quotation.enquiryId,
            activity: 'Customer Created',
            performedBy: session.user?.name || session.user?.email || 'Admin',
          }
        })
      }

      return customerRecord
    })

    const updatedQuotation = await prisma.quotation.findUnique({ where: { id }, include: { customer: true } })
    return res.status(200).json(response(true, normalizeQuotationRecord(updatedQuotation), 'Customer conversion completed'))
  } catch (err: any) {
    console.error('POST /api/quotations/:id/convert', err)
    return res.status(500).json(response(false, null, 'Failed to convert quotation to customer'))
  }
}

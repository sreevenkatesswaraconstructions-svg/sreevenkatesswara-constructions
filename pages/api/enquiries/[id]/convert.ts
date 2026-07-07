import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'
import { addEnquiryActivity } from '../../../../lib/enquiryTimeline'

const response = (success: boolean, data: any = null, message: string = '') => ({ success, data, message })

const normalizePhone = (phone: string) => String(phone || '').replace(/[^0-9]/g, '').trim()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) return res.status(401).json(response(false, null, 'Unauthorized'))

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json(response(false, null, 'Method not allowed'))
  }

  const { id } = req.query as any
  if (!id) return res.status(400).json(response(false, null, 'Enquiry ID is required'))

  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } })
    if (!enquiry) return res.status(404).json(response(false, null, 'Enquiry not found'))

    const phone = normalizePhone(enquiry.phone)
    if (!phone) return res.status(400).json(response(false, null, 'Enquiry phone is required'))

    const customer = await prisma.$transaction(async (tx) => {
      let customerRecord = await tx.customer.findUnique({ where: { phone } })

      if (!customerRecord) {
        customerRecord = await tx.customer.findFirst({ where: { phone: { contains: phone } } })
      }

      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            name: enquiry.customerName,
            phone,
            email: enquiry.email || undefined,
            location: enquiry.location || undefined,
            status: 'Active',
            enquiryId: enquiry.id,
          },
        })
      }

      const updates: any = {}
      if (enquiry.customerId !== customerRecord.id) {
        updates.customerId = customerRecord.id
      }
      if (customerRecord.enquiryId !== enquiry.id) {
        updates.enquiryId = enquiry.id
      }

      if (Object.keys(updates).length > 0) {
        await tx.enquiry.update({ where: { id }, data: updates })
      }

      const customerUpdates: any = {}
      if (String(customerRecord.status || '').trim() !== 'Active') {
        customerUpdates.status = 'Active'
      }
      if (customerRecord.enquiryId !== enquiry.id) {
        customerUpdates.enquiryId = enquiry.id
      }

      if (Object.keys(customerUpdates).length > 0) {
        await tx.customer.update({ where: { id: customerRecord.id }, data: customerUpdates })
      }

      await tx.enquiryActivity.create({
        data: {
          enquiryId: enquiry.id,
          activity: 'Customer Created',
          performedBy: session.user?.name || session.user?.email || 'Admin',
        },
      })

      return customerRecord
    })

    return res.status(200).json(response(true, customer, 'Enquiry converted to customer'))
  } catch (error: any) {
    console.error('POST /api/enquiries/:id/convert', error)
    return res.status(500).json(response(false, null, 'Failed to convert enquiry to customer'))
  }
}

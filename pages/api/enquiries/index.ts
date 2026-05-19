import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const enquiries = await prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return res.status(200).json(enquiries)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch enquiries' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { customerName, phone, email, service, budget, location, message } = req.body

      if (!customerName || !phone || !email || !service) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

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

      // TODO: Send email notification to admin
      // TODO: Send WhatsApp notification
      // TODO: Send auto-response email to customer

      return res.status(201).json(enquiry)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create enquiry' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

import { prisma } from '../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Customer ID is required' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        status: true,
        createdAt: true,
      },
    })

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    return res.status(200).json({ success: true, data: customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch customer' })
  }
}

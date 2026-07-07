import { prisma } from '../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enquiries: true,
            quotations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const normalized = customers.map((customer) => {
      const totalProjects = customer._count?.quotations ?? 0
      const status = String(customer.status || 'Active').trim() || 'Active'

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '-',
        location: customer.location || '-',
        totalProjects,
        status,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
    })

    return res.status(200).json({ success: true, data: normalized })
  } catch (error) {
    console.error('Error loading customers:', error)
    return res.status(500).json({ success: false, message: 'Failed to load customers' })
  }
}

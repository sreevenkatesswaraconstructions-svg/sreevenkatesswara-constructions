import { prisma } from '../../../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Customer ID is required' })
  }

  if (req.method === 'GET') {
    return handleGet(id, res)
  }

  if (req.method === 'POST') {
    return handlePost(id, req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

async function handleGet(customerId: string, res: NextApiResponse) {
  try {
    const exists = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } })
    if (!exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const items = await prisma.customerContactHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json(items)
  } catch (error) {
    console.error('Error fetching contact history:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch contact history' })
  }
}

async function handlePost(customerId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const exists = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } })
    if (!exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const { type, title, description, createdBy } = req.body || {}
    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'type and title are required' })
    }

    const created = await prisma.customerContactHistory.create({
      data: {
        customerId,
        type: String(type),
        title: String(title),
        description: description ? String(description) : null,
        createdBy: createdBy ? String(createdBy) : null,
      },
    })

    return res.status(201).json(created)
  } catch (error) {
    console.error('Error creating contact history entry:', error)
    return res.status(500).json({ success: false, message: 'Failed to create contact history entry' })
  }
}

import { prisma } from '../../../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Customer ID is required' })
  }

  try {
    // Verify customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    if (req.method === 'GET') {
      return handleGetTimeline(id, res)
    } else if (req.method === 'POST') {
      return handlePostTimeline(id, req, res)
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ success: false, message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in timeline handler:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

async function handleGetTimeline(customerId: string, res: NextApiResponse) {
  try {
    const timeline = await prisma.customerTimeline.findMany({
      where: { customerId },
      select: {
        id: true,
        eventType: true,
        title: true,
        description: true,
        source: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({ success: true, data: timeline })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch timeline' })
  }
}

async function handlePostTimeline(
  customerId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { eventType, title, description, source, createdBy } = req.body

    // Validation
    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ success: false, message: 'eventType is required and must be a string' })
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, message: 'title is required and must be a string' })
    }

    // Create timeline entry
    const timelineEntry = await prisma.customerTimeline.create({
      data: {
        customerId,
        eventType,
        title,
        description: description || null,
        source: source || 'SYSTEM',
        createdBy: createdBy || null,
      },
      select: {
        id: true,
        eventType: true,
        title: true,
        description: true,
        source: true,
        createdBy: true,
        createdAt: true,
      },
    })

    return res.status(201).json({ success: true, data: timelineEntry })
  } catch (error) {
    console.error('Error creating timeline entry:', error)
    return res.status(500).json({ success: false, message: 'Failed to create timeline entry' })
  }
}

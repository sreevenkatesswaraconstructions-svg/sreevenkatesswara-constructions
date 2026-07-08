import { prisma } from '../../../../../lib/prisma'
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

  return handleGetProjects(id, res)
}

async function handleGetProjects(customerId: string, res: NextApiResponse) {
  try {
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const projects = await prisma.project.findMany({
      where: { customerId },
      select: {
        id: true,
        title: true,
        status: true,
        projectType: true,
        startDate: true,
        estimatedBudget: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json(projects)
  } catch (error) {
    console.error('Error fetching customer projects:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch projects' })
  }
}

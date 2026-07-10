import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const [happyClients, completedProjects, ongoingProjects] = await prisma.$transaction([
      prisma.customer.count(),
      prisma.project.count({
        where: {
          status: {
            equals: 'Completed',
            mode: 'insensitive',
          },
        },
      }),
      prisma.project.count({
        where: {
          NOT: {
            status: {
              equals: 'Completed',
              mode: 'insensitive',
            },
          },
        },
      }),
    ])

    return res.status(200).json({
      happyClients,
      completedProjects,
      ongoingProjects,
    })
  } catch (error) {
    console.error('[ABOUT_STATS] Failed to load counters:', error)
    return res.status(500).json({
      message: 'Unable to load about page statistics right now.',
    })
  }
}

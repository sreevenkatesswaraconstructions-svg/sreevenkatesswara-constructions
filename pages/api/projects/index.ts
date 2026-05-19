import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { featured, status, category } = req.query

      const where: any = {}
      if (featured === 'true') where.featured = true
      if (status) where.status = status
      if (category) where.category = category

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json(projects)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch projects' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, category, status, images, videos, location, completionDate, clientName, featured } = req.body

      if (!title || !description || !category) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const project = await prisma.project.create({
        data: {
          title,
          description,
          category,
          status: status || 'ONGOING',
          images: images || [],
          videos: videos || [],
          location: location || null,
          completionDate: completionDate ? new Date(completionDate) : null,
          clientName: clientName || null,
          featured: featured || false
        }
      })

      return res.status(201).json(project)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create project' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

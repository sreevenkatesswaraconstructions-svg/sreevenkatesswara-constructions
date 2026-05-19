import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      return res.status(200).json(project)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch project' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { title, description, category, status, images, videos, location, completionDate, clientName, featured } = req.body

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(category && { category }),
          ...(status && { status }),
          ...(images && { images }),
          ...(videos && { videos }),
          ...(location !== undefined && { location }),
          ...(completionDate && { completionDate: new Date(completionDate) }),
          ...(clientName !== undefined && { clientName }),
          ...(featured !== undefined && { featured })
        }
      })

      return res.status(200).json(project)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update project' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.project.delete({
        where: { id }
      })

      return res.status(204).end()
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete project' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}

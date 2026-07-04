import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      console.log('[PROJECT API] Fetching project:', id);
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (!project) {
        console.error('[PROJECT API] Project not found:', id);
        return res.status(404).json({ error: 'Project not found' })
      }

      console.log('[PROJECT API] Project fetched:', id);
      return res.status(200).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error fetching project:', error);
      return res.status(500).json({ error: 'Failed to fetch project' })
    }
  }

  if (req.method === 'PUT') {
    try {
      console.log('[PROJECT API] Updating project:', id);
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

      console.log('[PROJECT API] Project updated:', id);
      return res.status(200).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      console.log('[PROJECT API] Deleting project:', id);
      await prisma.project.delete({
        where: { id }
      })

      console.log('[PROJECT API] Project deleted:', id);
      return res.status(204).end()
    } catch (error) {
      console.error('[PROJECT API] Error deleting project:', error);
      return res.status(500).json({ error: 'Failed to delete project' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}

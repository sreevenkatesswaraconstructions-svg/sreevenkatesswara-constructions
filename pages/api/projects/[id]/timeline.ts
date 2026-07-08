import { prisma } from '../../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizeOptionalText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  try {
    if (req.method === 'GET') {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const events = await prisma.projectTimeline.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(events)
    }

    if (req.method === 'POST') {
      const body = req.body ?? {}
      const title = normalizeText(body.title)
      const type = normalizeText(body.type)
      const description = body.description === undefined ? undefined : normalizeOptionalText(body.description)
      const createdBy = normalizeText(body.createdBy)
      const projectId = normalizeText(body.projectId) || id

      if (!title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      if (!type) {
        return res.status(400).json({ error: 'Type is required' })
      }

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const event = await prisma.projectTimeline.create({
        data: {
          projectId,
          title,
          description,
          type,
          createdBy: createdBy || 'Admin',
        },
      })

      return res.status(201).json(event)
    }

    const { eventId } = req.query
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Missing eventId query parameter' })
    }

    if (req.method === 'PUT') {
      const body = req.body ?? {}
      const title = body.title === undefined ? undefined : normalizeText(body.title)
      const type = body.type === undefined ? undefined : normalizeText(body.type)
      const description = body.description === undefined ? undefined : normalizeOptionalText(body.description)

      if (title !== undefined && !title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      if (type !== undefined && !type) {
        return res.status(400).json({ error: 'Type is required' })
      }

      const existingEvent = await prisma.projectTimeline.findUnique({ where: { id: eventId } })
      if (!existingEvent) {
        return res.status(404).json({ error: 'Timeline event not found' })
      }

      // Verify the event belongs to this project
      if (existingEvent.projectId !== id) {
        return res.status(403).json({ error: 'Unauthorized: Event does not belong to this project' })
      }

      const updated = await prisma.projectTimeline.update({
        where: { id: eventId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type }),
        },
      })

      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const existingEvent = await prisma.projectTimeline.findUnique({ where: { id: eventId } })
      if (!existingEvent) {
        return res.status(404).json({ error: 'Timeline event not found' })
      }

      // Verify the event belongs to this project
      if (existingEvent.projectId !== id) {
        return res.status(403).json({ error: 'Unauthorized: Event does not belong to this project' })
      }

      await prisma.projectTimeline.delete({ where: { id: eventId } })
      return res.status(200).json({ message: 'Timeline event deleted', eventId })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('[TIMELINE API] Error:', error)

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2025') {
        return res.status(404).json({ error: 'Timeline event not found' })
      }
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}

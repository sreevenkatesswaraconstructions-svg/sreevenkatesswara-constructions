import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  return req.body ?? {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = getParam(req.query.id)

  if (!projectId) {
    return res.status(400).json({ error: 'Invalid project id' })
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const progressHistory = await prisma.projectProgress.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(progressHistory)
    } catch (error) {
      console.error('[PROJECT PROGRESS API] Error fetching progress history:', error)
      return res.status(500).json({ error: 'Failed to fetch project progress history' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = parseBody(req)
      const stage = typeof body.stage === 'string' ? body.stage.trim() : ''
      const notes = typeof body.notes === 'string' ? body.notes.trim() : null
      const percentage = Number(body.percentage)

      if (!stage) {
        return res.status(400).json({ error: 'Stage is required' })
      }

      if (!Number.isFinite(percentage)) {
        return res.status(400).json({ error: 'Percentage is required' })
      }

      if (percentage < 0 || percentage > 100) {
        return res.status(400).json({ error: 'Percentage must be between 0 and 100' })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const progressEntry = await prisma.projectProgress.create({
        data: {
          projectId,
          stage,
          percentage,
          notes: notes || null,
          updatedBy: typeof body.updatedBy === 'string' ? body.updatedBy : null,
        },
      })

      return res.status(201).json(progressEntry)
    } catch (error) {
      console.error('[PROJECT PROGRESS API] Error creating progress entry:', error)
      return res.status(500).json({ error: 'Failed to create project progress entry' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

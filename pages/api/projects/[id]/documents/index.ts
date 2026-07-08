import { prisma } from '../../../../../lib/prisma'
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
  const { id } = req.query

  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  const projectId = id

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (req.method === 'GET') {
      const documents = await prisma.projectDocument.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(documents)
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const fileName = normalizeText(body.fileName)
      const originalName = normalizeText(body.originalName)
      const fileUrl = normalizeText(body.fileUrl)
      const fileType = normalizeOptionalText(body.fileType)
      const uploadedBy = normalizeOptionalText(body.uploadedBy)

      const fileSizeValue = body.fileSize
      let fileSize: number | undefined

      if (fileSizeValue !== undefined && fileSizeValue !== null && fileSizeValue !== '') {
        const parsedSize = Number(fileSizeValue)
        if (!Number.isNaN(parsedSize)) {
          fileSize = parsedSize
        }
      }

      if (!fileName || !originalName || !fileUrl) {
        return res.status(400).json({ error: 'fileName, originalName, and fileUrl are required' })
      }

      const document = await prisma.projectDocument.create({
        data: {
          projectId,
          fileName,
          originalName,
          fileUrl,
          fileType: fileType ?? undefined,
          fileSize,
          uploadedBy: uploadedBy ?? undefined,
        },
      })

      return res.status(201).json(document)
    }

    if (req.method === 'DELETE') {
      const body = parseBody(req)
      const documentId = normalizeText(req.query.documentId) ?? normalizeText(body?.id)

      if (!documentId) {
        return res.status(400).json({ error: 'Document id is required' })
      }

      const existingDocument = await prisma.projectDocument.findUnique({ where: { id: documentId } })
      if (!existingDocument) {
        return res.status(404).json({ error: 'Document not found' })
      }

      if (existingDocument.projectId !== projectId) {
        return res.status(403).json({ error: 'Document does not belong to this project' })
      }

      await prisma.projectDocument.delete({ where: { id: documentId } })

      return res.status(200).json({ message: 'Document deleted', documentId })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('[PROJECT DOCUMENTS API] Error:', error)

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2025') {
        return res.status(404).json({ error: 'Document not found' })
      }
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}

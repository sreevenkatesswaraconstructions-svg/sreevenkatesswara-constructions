import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type } = req.query

    // Fetch media from database
    const media = await prisma.media.findMany({
      where: type ? { fileType: type as string } : undefined,
      orderBy: { uploadedAt: 'desc' },
    })

    const files = media.map((item) => ({
      id: item.id,
      name: item.originalName,
      url: item.fileUrl,
      thumbnailUrl: item.fileUrl,
      type: item.fileType,
      mimeType: item.mimeType,
      size: item.fileSize,
      createdAt: item.uploadedAt,
    }))

    return res.status(200).json({
      success: true,
      files,
      total: files.length,
    })
  } catch (error: any) {
    console.error('Error fetching files:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    })
  }
}

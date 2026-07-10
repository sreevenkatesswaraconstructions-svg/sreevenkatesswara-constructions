import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' })
    }

    // Fetch media record
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return res.status(404).json({ error: 'Media not found' })
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', media.fileUrl)
    try {
      await fs.unlink(filePath)
    } catch (error) {
    }

    // Delete database record
    await prisma.media.delete({
      where: { id },
    })

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete error:', error)
    return res.status(500).json({ 
      error: 'Failed to delete file',
      message: error.message 
    })
  }
}

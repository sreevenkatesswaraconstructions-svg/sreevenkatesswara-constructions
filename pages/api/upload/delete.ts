import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'
import { createNotification } from '../../../lib/notifications'
import { logActivity } from '../../../lib/activityLog'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'No media ID provided' })
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

    // Create notification
    await createNotification({
      title: 'Image Deleted',
      message: `File "${media.originalName}" has been deleted`,
      type: 'warning',
      link: '/admin/uploads'
    })

    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
    const browser = req.headers['user-agent'] || null
    await logActivity({
      adminName: 'Admin',
      action: 'Deleted Image',
      module: 'Upload',
      ipAddress: ipAddress as string,
      browser: browser as string
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

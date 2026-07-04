import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method

  try {
    if (method === 'GET') {
      const { unreadOnly, limit } = req.query

      const where = unreadOnly === 'true' ? { isRead: false } : undefined
      const take = limit ? parseInt(limit as string) : undefined

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      })

      const unreadCount = await prisma.notification.count({
        where: { isRead: false }
      })

      return res.status(200).json({
        success: true,
        notifications,
        unreadCount
      })
    }

    if (method === 'POST') {
      const { title, message, type, link } = req.body

      if (!title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: 'Title, message, and type are required'
        })
      }

      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          type,
          link: link || null
        }
      })

      return res.status(201).json({
        success: true,
        notification
      })
    }

    if (method === 'PUT') {
      const { ids, markAsRead } = req.body

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Ids array is required'
        })
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: ids }
        },
        data: {
          isRead: markAsRead !== undefined ? markAsRead : true
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Notifications updated successfully'
      })
    }

    if (method === 'DELETE') {
      const { clearRead } = req.body

      if (clearRead) {
        await prisma.notification.deleteMany({
          where: { isRead: true }
        })
        return res.status(200).json({
          success: true,
          message: 'Read notifications cleared successfully'
        })
      }

      return res.status(400).json({
        success: false,
        message: 'clearRead flag is required for delete'
      })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })

  } catch (error: any) {
    console.error('[NOTIFICATIONS API] Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
}

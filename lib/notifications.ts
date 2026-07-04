import { prisma } from './prisma'

export async function createNotification(data: {
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  link?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

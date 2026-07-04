import { prisma } from './prisma'

export async function logActivity(data: {
  adminName: string
  action: string
  module: string
  ipAddress?: string
  browser?: string
}) {
  try {
    await prisma.activityLog.create({
      data: {
        adminName: data.adminName,
        action: data.action,
        module: data.module,
        ipAddress: data.ipAddress || null,
        browser: data.browser || null
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

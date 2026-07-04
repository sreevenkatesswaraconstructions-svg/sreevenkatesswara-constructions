import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { createNotification } from '../../../lib/notifications'
import { logActivity } from '../../../lib/activityLog'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json(response(false, null, 'Invalid ID'))
  }

  if (req.method === 'GET') {
    try {
      const service = await prisma.service.findUnique({
        where: { id }
      })

      if (!service) {
        return res.status(404).json(response(false, null, 'Service not found'))
      }

      return res.status(200).json(response(true, service))
    } catch (error) {
      console.error('[SERVICES API] Error fetching service:', error)
      return res.status(500).json(response(false, null, 'Failed to fetch service'))
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        serviceName,
        slug,
        shortDescription,
        detailedDescription,
        image,
        status,
        featured,
        seoTitle,
        seoDescription
      } = req.body

      const existingService = await prisma.service.findUnique({
        where: { id }
      })

      if (!existingService) {
        return res.status(404).json(response(false, null, 'Service not found'))
      }

      if (serviceName !== undefined && (typeof serviceName !== 'string' || serviceName.trim().length === 0)) {
        return res.status(400).json(response(false, null, 'Service name is required'))
      }

      if (slug !== undefined && (typeof slug !== 'string' || slug.trim().length === 0)) {
        return res.status(400).json(response(false, null, 'Slug is required'))
      }

      if (slug && slug.trim() !== existingService.slug) {
        const slugConflict = await prisma.service.findFirst({
          where: {
            slug: slug.trim(),
            id: { not: id }
          }
        })

        if (slugConflict) {
          return res.status(409).json(response(false, null, 'Service with this slug already exists'))
        }
      }

      const updateData: any = {}
      if (serviceName !== undefined) updateData.serviceName = serviceName.trim()
      if (slug !== undefined) updateData.slug = slug.trim()
      if (shortDescription !== undefined) updateData.shortDescription = shortDescription || null
      if (detailedDescription !== undefined) updateData.detailedDescription = detailedDescription || null
      if (image !== undefined) updateData.image = image || null
      if (status !== undefined) updateData.status = status
      if (featured !== undefined) updateData.featured = featured
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null

      const service = await prisma.service.update({
        where: { id },
        data: updateData
      })

      // Create notification
      await createNotification({
        title: 'Service Updated',
        message: `Service "${service.serviceName}" has been updated`,
        type: 'info',
        link: '/admin/services'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Updated Service',
        module: 'Service',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, service, 'Service updated successfully'))
    } catch (error) {
      console.error('[SERVICES API] Error updating service:', error)
      return res.status(500).json(response(false, null, 'Failed to update service'))
    }
  }

  if (req.method === 'DELETE') {
    try {
      const service = await prisma.service.findUnique({
        where: { id }
      })

      if (!service) {
        return res.status(404).json(response(false, null, 'Service not found'))
      }

      await prisma.service.delete({
        where: { id }
      })

      // Create notification
      await createNotification({
        title: 'Service Deleted',
        message: `Service "${service.serviceName}" has been deleted`,
        type: 'warning',
        link: '/admin/services'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Deleted Service',
        module: 'Service',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, null, 'Service deleted successfully'))
    } catch (error) {
      console.error('[SERVICES API] Error deleting service:', error)
      return res.status(500).json(response(false, null, 'Failed to delete service'))
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}

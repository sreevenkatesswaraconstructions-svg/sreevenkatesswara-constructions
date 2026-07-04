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
  const method = req.method

  try {
    if (method === 'GET') {
      const { status, featured, search, sort } = req.query

      const where: any = {}
      
      if (status) where.status = status as string
      if (featured === 'true') where.featured = true
      
      if (search) {
        where.OR = [
          { serviceName: { contains: search as string, mode: 'insensitive' } },
          { shortDescription: { contains: search as string, mode: 'insensitive' } },
          { detailedDescription: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      let orderBy: any = { createdAt: 'desc' }
      
      if (sort === 'oldest') orderBy = { createdAt: 'asc' }
      if (sort === 'name') orderBy = { serviceName: 'asc' }
      if (sort === 'name-desc') orderBy = { serviceName: 'desc' }

      const services = await prisma.service.findMany({
        where,
        orderBy
      })

      return res.status(200).json(response(true, services))
    }

    if (method === 'POST') {
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

      if (!serviceName || !slug) {
        return res.status(400).json(
          response(false, null, 'Missing required fields: serviceName, slug')
        )
      }

      const existingSlug = await prisma.service.findUnique({
        where: { slug }
      })

      if (existingSlug) {
        return res.status(409).json(
          response(false, null, 'Service with this slug already exists')
        )
      }

      const service = await prisma.service.create({
        data: {
          serviceName,
          slug,
          shortDescription: shortDescription || null,
          detailedDescription: detailedDescription || null,
          image: image || null,
          status: status || 'ACTIVE',
          featured: featured || false,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null
        }
      })

      // Create notification
      await createNotification({
        title: 'New Service Added',
        message: `Service "${serviceName}" has been added`,
        type: 'success',
        link: '/admin/services'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Added Service',
        module: 'Service',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(201).json(response(true, service, 'Service created successfully'))
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json(response(false, null, 'Method not allowed'))

  } catch (error: any) {
    console.error('[SERVICES API] Error:', error)
    
    if (error.code === 'P2002') {
      return res.status(409).json(
        response(false, null, 'Service with this slug already exists')
      )
    }
    
    return res.status(500).json(
      response(false, null, error.message || 'Internal server error')
    )
  }
}

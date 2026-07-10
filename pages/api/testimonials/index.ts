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
      if (featured === 'true') where.isFeatured = true

      if (search) {
        where.OR = [
          { customerName: { contains: search as string, mode: 'insensitive' } },
          { customerEmail: { contains: search as string, mode: 'insensitive' } },
          { customerRole: { contains: search as string, mode: 'insensitive' } },
          { reviewMessage: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      let orderBy: any = { displayOrder: 'asc' }

      if (sort === 'newest') orderBy = { createdAt: 'desc' }
      if (sort === 'oldest') orderBy = { createdAt: 'asc' }
      if (sort === 'rating') orderBy = { rating: 'desc' }
      if (sort === 'name') orderBy = { customerName: 'asc' }

      const testimonials = await prisma.testimonial.findMany({
        where,
        orderBy
      })

      return res.status(200).json(response(true, testimonials))
    }

    if (method === 'POST') {
      const {
        customerName,
        customerEmail,
        customerPhone,
        customerLocation,
        customerRole,
        projectType,
        reviewMessage,
        rating,
        customerPhoto,
        status,
        isFeatured,
        displayOrder,
        adminNotes,
        projectId
      } = req.body

      // Public form requirements: customerName, customerLocation, rating, reviewMessage
      if (!customerName || !customerLocation || !reviewMessage || (rating === undefined || rating === null)) {
        return res.status(400).json(
          response(false, null, 'Missing required fields: customerName, customerLocation, rating, reviewMessage')
        )
      }

      const testimonial = await prisma.testimonial.create({
        data: {
          customerName: customerName.trim(),
          customerEmail: customerEmail?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          customerLocation: customerLocation.trim(),
          // Accept either admin's `customerRole` or public `projectType` and store into customerRole
          customerRole: (projectType?.trim() || customerRole?.trim()) || null,
          reviewMessage: reviewMessage.trim(),
          rating: Number(rating) || 5,
          customerPhoto: customerPhoto || null,
          status: status || 'Pending',
          isFeatured: Boolean(isFeatured),
          displayOrder: Number(displayOrder) || 0,
          adminNotes: [adminNotes?.trim(), projectId ? `Project reference: ${String(projectId)}` : null]
            .filter(Boolean)
            .join(' | ') || null
        }
      })

      await createNotification({
        title: 'New Testimonial Added',
        message: `Testimonial from "${customerName}" has been added`,
        type: 'success',
        link: '/admin/testimonials'
      })

      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Added Testimonial',
        module: 'Testimonial',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(201).json(response(true, testimonial, 'Testimonial created successfully'))
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json(response(false, null, 'Method not allowed'))
  } catch (error: any) {
    console.error('[TESTIMONIALS API] Error:', error)
    return res.status(500).json(response(false, null, error.message || 'Internal server error'))
  }
}

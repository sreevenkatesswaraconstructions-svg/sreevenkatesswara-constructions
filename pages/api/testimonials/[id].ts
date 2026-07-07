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
      const testimonial = await prisma.testimonial.findUnique({
        where: { id }
      })

      if (!testimonial) {
        return res.status(404).json(response(false, null, 'Testimonial not found'))
      }

      return res.status(200).json(response(true, testimonial))
    } catch (error) {
      console.error('[TESTIMONIALS API] Error fetching testimonial:', error)
      return res.status(500).json(response(false, null, 'Failed to fetch testimonial'))
    }
  }

  if (req.method === 'PUT') {
    try {
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
        adminNotes
      } = req.body

      const existingTestimonial = await prisma.testimonial.findUnique({
        where: { id }
      })

      if (!existingTestimonial) {
        return res.status(404).json(response(false, null, 'Testimonial not found'))
      }

      const updateData: any = {}
      if (customerName !== undefined) updateData.customerName = customerName.trim()
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail?.trim() || null
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone?.trim() || null
      if (customerLocation !== undefined) updateData.customerLocation = customerLocation.trim()
      if (customerRole !== undefined) updateData.customerRole = customerRole.trim()
      if (projectType !== undefined) updateData.customerRole = projectType?.trim() || null
      if (reviewMessage !== undefined) updateData.reviewMessage = reviewMessage.trim()
      if (rating !== undefined) updateData.rating = Number(rating) || 5
      if (customerPhoto !== undefined) updateData.customerPhoto = customerPhoto || null
      if (status !== undefined) updateData.status = status
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured)
      if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder) || 0
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes?.trim() || null

      const testimonial = await prisma.testimonial.update({
        where: { id },
        data: updateData
      })

      await createNotification({
        title: 'Testimonial Updated',
        message: `Testimonial from "${testimonial.customerName}" has been updated`,
        type: 'info',
        link: '/admin/testimonials'
      })

      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Updated Testimonial',
        module: 'Testimonial',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, testimonial, 'Testimonial updated successfully'))
    } catch (error) {
      console.error('[TESTIMONIALS API] Error updating testimonial:', error)
      return res.status(500).json(response(false, null, 'Failed to update testimonial'))
    }
  }

  if (req.method === 'DELETE') {
    try {
      const testimonial = await prisma.testimonial.findUnique({
        where: { id }
      })

      if (!testimonial) {
        return res.status(404).json(response(false, null, 'Testimonial not found'))
      }

      await prisma.testimonial.delete({
        where: { id }
      })

      await createNotification({
        title: 'Testimonial Deleted',
        message: `Testimonial from "${testimonial.customerName}" has been deleted`,
        type: 'warning',
        link: '/admin/testimonials'
      })

      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Deleted Testimonial',
        module: 'Testimonial',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, null, 'Testimonial deleted successfully'))
    } catch (error) {
      console.error('[TESTIMONIALS API] Error deleting testimonial:', error)
      return res.status(500).json(response(false, null, 'Failed to delete testimonial'))
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}

import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { normalizeEnquiryStatus, normalizeEnquirySource } from '../../../lib/enquiryUtils'
import { addEnquiryActivity, getEnquiryActivities } from '../../../lib/enquiryTimeline'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      const [enquiry, activities] = await Promise.all([
        prisma.enquiry.findUnique({ where: { id } }),
        getEnquiryActivities(id)
      ])

      if (!enquiry) {
        return res.status(404).json({ error: 'Enquiry not found' })
      }

      return res.status(200).json({
        ...enquiry,
        activities: activities || []
      })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch enquiry' })
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const rawBody = typeof req.body === 'string'
        ? (() => {
            try {
              return JSON.parse(req.body)
            } catch {
              return {}
            }
          })()
        : req.body || {}

      const {
        customerName,
        phone,
        email,
        location,
        service,
        budget,
        notes,
        message,
        source,
        status,
        isContacted,
        followUpDate,
        followUpTime,
        followUpNotes,
        performedBy
      } = rawBody

      const updateData: Record<string, unknown> = {}
      const activityEntries: string[] = []

      if (customerName !== undefined) updateData.customerName = customerName
      if (phone !== undefined) updateData.phone = phone
      if (email !== undefined) updateData.email = email
      if (location !== undefined) updateData.location = location
      if (service !== undefined) updateData.service = service
      if (budget !== undefined) updateData.budget = budget
      if (notes !== undefined) updateData.message = notes
      if (message !== undefined) updateData.message = message
      if (source !== undefined) updateData.source = normalizeEnquirySource(source)
      if (status !== undefined) updateData.status = normalizeEnquiryStatus(status)
      if (isContacted !== undefined) updateData.isContacted = isContacted
      if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate as string) : null
      if (followUpTime !== undefined) updateData.followUpTime = typeof followUpTime === 'string' && followUpTime.trim() ? followUpTime.trim() : null
      if (followUpNotes !== undefined) updateData.followUpNotes = typeof followUpNotes === 'string' && followUpNotes.trim() ? followUpNotes.trim() : null

      const existingEnquiry = await prisma.enquiry.findUnique({ where: { id } })
      if (existingEnquiry) {
        if (notes !== undefined || message !== undefined) activityEntries.push('Notes Updated')
        if (status !== undefined && existingEnquiry.status !== normalizeEnquiryStatus(status)) activityEntries.push('Status Changed')
        if (followUpDate !== undefined || followUpTime !== undefined || followUpNotes !== undefined) activityEntries.push('Follow-up Updated')
        if (Object.keys(updateData).some((key) => ['customerName','phone','email','location','service','budget','source'].includes(key))) activityEntries.push('Enquiry Edited')
      }

      const enquiry = await prisma.enquiry.update({
        where: { id },
        data: updateData
      })

      for (const entry of activityEntries) {
        await addEnquiryActivity({
          enquiryId: enquiry.id,
          activity: entry,
          performedBy: typeof performedBy === 'string' && performedBy.trim() ? performedBy.trim() : 'Admin'
        })
      }

      const activities = await getEnquiryActivities(id)

      return res.status(200).json({
        ...enquiry,
        activities
      })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update enquiry' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.enquiry.delete({
        where: { id }
      })

      return res.status(204).end()
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete enquiry' })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}

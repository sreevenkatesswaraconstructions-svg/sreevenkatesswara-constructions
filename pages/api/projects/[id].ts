import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { sendTestimonialRequestEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (!project) {
        console.error('[PROJECT API] Project not found:', id);
        return res.status(404).json({ error: 'Project not found' })
      }

      return res.status(200).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error fetching project:', error);
      return res.status(500).json({ error: 'Failed to fetch project' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        title,
        description,
        category,
        projectType,
        status,
        images,
        videos,
        location,
        siteAddress,
        completionDate,
        clientName,
        featured,
        startDate,
        expectedEndDate,
        estimatedBudget,
        projectManager,
        customerId,
      } = req.body

      const previousProject = await prisma.project.findUnique({
        where: { id },
        select: { status: true }
      })

      const normalizedPreviousStatus = previousProject?.status?.toString().trim().toLowerCase()
      const normalizedNewStatus = status !== undefined ? String(status).trim().toLowerCase() : undefined
      const shouldSendTestimonialRequest = normalizedNewStatus === 'completed' && normalizedPreviousStatus !== 'completed'

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(projectType !== undefined && { projectType }),
          ...(status !== undefined && { status }),
          ...(images !== undefined && { images }),
          ...(videos !== undefined && { videos }),
          ...(location !== undefined && { location }),
          ...(siteAddress !== undefined && { siteAddress }),
          ...(completionDate !== undefined && { completionDate: completionDate ? new Date(completionDate) : null }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(expectedEndDate !== undefined && { expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null }),
          ...(estimatedBudget !== undefined && { estimatedBudget: estimatedBudget ? String(estimatedBudget) : null }),
          ...(projectManager !== undefined && { projectManager }),
          ...(customerId !== undefined && { customerId: customerId ? String(customerId) : null }),
          ...(clientName !== undefined && { clientName }),
          ...(featured !== undefined && { featured })
        }
      })

      if (shouldSendTestimonialRequest) {
        try {
          const enrichedProject = await prisma.project.findUnique({
            where: { id },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          })

          const customerEmail = enrichedProject?.customer?.email?.trim()

          if (!customerEmail) {
          } else {

            try {
              const existingRequestLog = await prisma.emailLog.findFirst({
                where: {
                  type: 'testimonial_request',
                  metadata: {
                    contains: `"projectId":"${id}"`
                  }
                }
              })

              if (!existingRequestLog) {
                const result = await sendTestimonialRequestEmail({
                  to: customerEmail,
                  customerName: enrichedProject?.customer?.name || 'Valued Customer',
                  projectName: project.title || 'your project',
                  projectId: id,
                })


                if (!result?.success) {
                  console.error('[TESTIMONIAL] Resend error:', result?.error || 'Unknown error')
                }
              } else {
              }
            } catch (sendErr) {
              console.error('[TESTIMONIAL] Error sending testimonial email:', sendErr)
              // Do not interrupt project update flow on email errors
            }
          }
        } catch (emailError) {
          console.error('[PROJECT API] Failed to prepare/send testimonial request email:', emailError)
        }
      }

      return res.status(200).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.project.delete({
        where: { id }
      })

      return res.status(204).end()
    } catch (error) {
      console.error('[PROJECT API] Error deleting project:', error);
      return res.status(500).json({ error: 'Failed to delete project' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}

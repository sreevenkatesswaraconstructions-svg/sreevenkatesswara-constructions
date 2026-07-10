import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { createNotification } from '../../../lib/notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { featured, status, category, customerId } = req.query

      const where: any = {}
      if (featured === 'true') where.featured = true
      if (status) where.status = status
      if (category) where.category = category
      if (customerId) where.customerId = String(customerId)

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(projects)
    } catch (error) {
      console.error('[PROJECT API] Error fetching projects:', error)
      return res.status(500).json({ error: 'Failed to fetch projects' })
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        projectName,
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
        customerName,
        featured,
        customerId,
        startDate,
        expectedEndDate,
        estimatedBudget,
        projectManager,
      } = req.body

      const finalTitle = String(projectName || title || '').trim()
      const finalProjectType = String(projectType || category || '').trim()
      const finalSiteAddress = String(siteAddress || location || '').trim()

      if (!finalTitle) {
        console.error('[PROJECT API] Missing required fields')
        return res.status(400).json({ error: 'Project name is required' })
      }

      const project = await prisma.project.create({
        data: {
          title: finalTitle,
          description: description ? String(description) : '',
          category: finalProjectType || '',
          status: status ? String(status) : 'Planning',
          projectType: finalProjectType || '',
          siteAddress: finalSiteAddress || '',
          startDate: startDate ? new Date(startDate) : null,
          expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
          estimatedBudget: estimatedBudget ? String(estimatedBudget) : '',
          projectManager: projectManager ? String(projectManager) : '',
          customerId: customerId ? String(customerId) : null,
          images: typeof images === 'string' ? images : images?.length ? images.join(',') : '',
          videos: typeof videos === 'string' ? videos : videos?.length ? videos.join(',') : '',
          location: finalSiteAddress || '',
          completionDate: completionDate ? new Date(completionDate) : null,
          clientName: customerName ? String(customerName) : clientName ? String(clientName) : '',
          featured: Boolean(featured),
        },
      })


      await createNotification({
        title: 'New Project Added',
        message: `Project "${finalTitle}" has been added`,
        type: 'success',
        link: '/admin/projects',
      })

      return res.status(201).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error creating project:', error)
      return res.status(500).json({ error: 'Failed to create project' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

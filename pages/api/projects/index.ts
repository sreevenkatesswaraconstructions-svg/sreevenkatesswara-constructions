import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { createNotification } from '../../../lib/notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('[PROJECT API] Fetching projects with query:', req.query);
      const { featured, status, category } = req.query

      const where: any = {}
      if (featured === 'true') where.featured = true
      if (status) where.status = status
      if (category) where.category = category

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      console.log('[PROJECT API] Fetched', projects.length, 'projects');
      return res.status(200).json(projects)
    } catch (error) {
      console.error('[PROJECT API] Error fetching projects:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' })
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[PROJECT API] Creating project...');
      const { title, description, category, status, images, videos, location, completionDate, clientName, featured } = req.body

      if (!title || !description || !category) {
        console.error('[PROJECT API] Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' })
      }
      console.log('[PROJECT API] Request Body:', req.body);

      console.log('[PROJECT API] Data being saved:', {
      title,
      description,
      category,
      status,
      images,
      videos,
      location,
     completionDate,
  clientName,
  featured
 });
const project = await prisma.project.create({
  data: {
    title,
    description,
    category,
    status: status || 'ONGOING',

    images:
      typeof images === 'string'
        ? images
        : images?.length
        ? images.join(',')
        : 'https://via.placeholder.com/600x400',

    videos:
      typeof videos === 'string'
        ? videos
        : videos?.length
        ? videos.join(',')
        : '',

    location: location || 'Visakhapatnam',

    completionDate: completionDate
      ? new Date(completionDate)
      : null,

    clientName: clientName || '',

    featured: featured || false,
  },
});

      console.log('[PROJECT API] Project created:', project.id);

      // Create notification
      await createNotification({
        title: 'New Project Added',
        message: `Project "${title}" has been added`,
        type: 'success',
        link: '/admin/projects'
      })

      return res.status(201).json(project)
    } catch (error) {
      console.error('[PROJECT API] Error creating project:', error);
      return res.status(500).json({ error: 'Failed to create project' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

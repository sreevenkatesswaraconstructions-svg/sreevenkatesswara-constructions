import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { published, category, slug } = req.query

      const where: any = {}
      if (published === 'true') where.published = true
      if (category) where.category = category
      if (slug) where.slug = slug

      const blogs = await prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json(blogs)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch blogs' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, slug, content, category, tags, featuredImage, metaTitle, metaDescription, published, scheduledAt } = req.body

      if (!title || !slug || !content) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const blog = await prisma.blog.create({
        data: {
          title,
          slug,
          content,
          category: category || 'General',
          tags: tags || [],
          featuredImage: featuredImage || '',
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          published: published || false,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        }
      })

      return res.status(201).json(blog)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create blog' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

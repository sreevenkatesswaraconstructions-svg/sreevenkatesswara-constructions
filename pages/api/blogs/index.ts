import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { createNotification } from '../../../lib/notifications'
import { logActivity } from '../../../lib/activityLog'

// Helper function for consistent API responses
const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method

  try {
    // GET - Fetch blogs
    if (method === 'GET') {
      const { published, category, slug, id, featured } = req.query

      const where: any = {}
      if (published === 'true') where.published = true
      if (category) where.category = category
      if (slug) where.slug = slug
      if (id) where.id = id
      if (featured === 'true') where.featured = true

      const blogs = await prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json(response(true, blogs))
    }

    // POST - Create blog
    if (method === 'POST') {
      const {
        title,
        slug,
        content,
        excerpt,
        author,
        category,
        tags,
        featuredImage,
        metaTitle,
        metaDescription,
        published,
        featured,
        publishedAt
      } = req.body

      // Validation
      if (!title || !slug || !content || !author) {
        return res.status(400).json(
          response(false, null, 'Missing required fields: title, slug, content, author')
        )
      }

      const blog = await prisma.blog.create({
        data: {
          title,
          slug,
          content,
          excerpt: excerpt || null,
          author,
          category: category || 'General',
          tags: tags || null,
          featuredImage: featuredImage || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          published: published || false,
          featured: featured || false,
          publishedAt: published && publishedAt ? new Date(publishedAt) : (published ? new Date() : null)
        }
      })

      // Create notification
      await createNotification({
        title: published ? 'New Blog Published' : 'New Blog Created',
        message: `Blog "${title}" has been ${published ? 'published' : 'created'}`,
        type: 'success',
        link: '/admin/blogs'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: author || 'Admin',
        action: published ? 'Added Blog' : 'Created Blog',
        module: 'Blog',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(201).json(response(true, blog, 'Blog created successfully'))
    }

    // PUT - Update blog
    if (method === 'PUT') {
      const {
        id,
        title,
        slug,
        content,
        excerpt,
        author,
        category,
        tags,
        featuredImage,
        metaTitle,
        metaDescription,
        published,
        featured,
        publishedAt
      } = req.body

      if (!id) {
        return res.status(400).json(response(false, null, 'Blog ID is required'))
      }

      const blog = await prisma.blog.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          excerpt,
          author,
          category,
          tags,
          featuredImage,
          metaTitle,
          metaDescription,
          published,
          featured,
          publishedAt: published && publishedAt ? new Date(publishedAt) : (published ? new Date() : null)
        }
      })

      // Create notification
      await createNotification({
        title: 'Blog Updated',
        message: `Blog "${title}" has been updated`,
        type: 'info',
        link: '/admin/blogs'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: author || 'Admin',
        action: 'Updated Blog',
        module: 'Blog',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, blog, 'Blog updated successfully'))
    }

    // DELETE - Delete blog
    if (method === 'DELETE') {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json(response(false, null, 'Blog ID is required'))
      }

      const deletedBlog = await prisma.blog.findUnique({ where: { id } })
      await prisma.blog.delete({
        where: { id }
      })

      // Create notification
      await createNotification({
        title: 'Blog Deleted',
        message: `Blog "${deletedBlog?.title}" has been deleted`,
        type: 'warning',
        link: '/admin/blogs'
      })

      // Log activity
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      await logActivity({
        adminName: 'Admin',
        action: 'Deleted Blog',
        module: 'Blog',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, null, 'Blog deleted successfully'))
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json(response(false, null, 'Method not allowed'))

  } catch (error: any) {
    console.error('[BLOG API] Error:', error)
    return res.status(500).json(
      response(false, null, error.message || 'Internal server error')
    )
  }
}

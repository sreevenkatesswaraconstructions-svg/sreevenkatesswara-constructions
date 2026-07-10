import services from '../../data/services'
import projects from '../../data/projects'
import blogPosts from '../../data/blogPosts'
import { company } from '../../lib/company'

export default function handler(req, res) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || company.website)
  const pages = ['', 'about', 'services', 'projects', 'why-us', 'blog', 'contact']
  const pageUrls = pages.map(p => `  <url><loc>${baseUrl}/${p}</loc></url>`)
  const serviceUrls = services.map(s => `  <url><loc>${baseUrl}/services/${s.slug}</loc></url>`)
  const projectUrls = projects.map(p => `  <url><loc>${baseUrl}/projects/${p.id}</loc></url>`)
  const blogUrls = blogPosts.map(post => `  <url><loc>${baseUrl}/blog/${post.slug}</loc></url>`)
  const urls = [...pageUrls, ...serviceUrls, ...projectUrls, ...blogUrls].join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(xml)
}

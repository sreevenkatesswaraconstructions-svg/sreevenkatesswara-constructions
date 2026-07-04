import Link from 'next/link'
import { useState, useEffect } from 'react'
import SEO from '../../components/SEO'
import ClickableImage from '../../components/ClickableImage'
import { Loader2, Calendar, User, FileText } from 'lucide-react'

export default function Blog(){
  const [blogPosts, setBlogPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/blogs?published=true')
      const result = await response.json()
      
      if (result.success) {
        setBlogPosts(result.data || [])
      } else {
        setError(result.message || 'Failed to fetch blogs')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[PUBLIC BLOG] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-12">
      <SEO title="Blog — Sree Venkatesswara Constructions & Interiors" description="Read insights on luxury construction, interior ideas, home trends and architecture inspiration." />

      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Thought Leadership</p>
        <h1 className="text-5xl font-serif text-emerald">Insights for premium construction and interiors.</h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-700">Explore our articles on construction tips, luxury interior ideas, material guides and modern architecture inspiration.</p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchBlogs} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No published blogs yet.</p>
        </div>
      ) : (
        <section className="grid gap-8 lg:grid-cols-3">
          {blogPosts.map(post => (
            <article key={post.id} className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl hover:-translate-y-1 transition-transform">
              {post.featuredImage && (
                <ClickableImage
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full mb-4"
                  aspectRatio="aspect-video"
                  rounded="rounded-lg"
                />
              )}
              <p className="text-xs uppercase tracking-[0.35em] text-gold mb-4">{post.category}</p>
              <h2 className="text-2xl font-serif text-emerald mb-3">{post.title}</h2>
              <p className="text-gray-700 mb-6 line-clamp-3">{post.excerpt || 'No excerpt available'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Link 
                href={`/blog/${post.slug}`} 
                className="inline-flex items-center gap-2 text-emerald font-semibold hover:text-emerald-700 transition-colors"
              >
                Read More →
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import SEO from '../../components/SEO'
import ClickableImage from '../../components/ClickableImage'
import { Loader2, Calendar, User, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BlogPost(){
  const router = useRouter()
  const { slug } = router.query
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [relatedBlogs, setRelatedBlogs] = useState([])

  useEffect(() => {
    if (slug) {
      fetchBlog()
    }
  }, [slug])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/blogs?slug=${slug}&published=true`)
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        const blogPost = result.data[0]
        setPost(blogPost)
        
        // Fetch related blogs from same category
        if (blogPost.category) {
          const relatedResponse = await fetch(`/api/blogs?published=true&category=${blogPost.category}`)
          const relatedResult = await relatedResponse.json()
          if (relatedResult.success) {
            setRelatedBlogs(relatedResult.data.filter(b => b.id !== blogPost.id).slice(0, 3))
          }
        }
      } else {
        setError('Blog not found')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[PUBLIC BLOG POST] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center px-6 py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="min-h-screen grid place-items-center px-6 py-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Blog not found'}</p>
          <Link href="/blog" className="px-4 py-2 bg-emerald-600 text-white rounded-lg inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-10">
      <SEO 
        title={`${post.title} — Sree Venkatesswara Constructions & Interiors`} 
        description={post.metaDescription || post.excerpt} 
      />
      
      {/* Back Button */}
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-2 text-emerald hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blogs
      </Link>

      {/* Hero Image */}
      {post.featuredImage && (
        <ClickableImage
          src={post.featuredImage}
          alt={post.title}
          className="w-full"
          aspectRatio="aspect-video"
          rounded="rounded-2xl"
        />
      )}

      {/* Blog Header */}
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">{post.category}</p>
        <h1 className="text-5xl font-serif text-emerald">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>By {post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Published {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-emerald hover:text-emerald-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </section>

      {/* Blog Content */}
      <article className="glass-panel rounded-[2rem] border border-emerald/10 p-10 shadow-2xl text-gray-700 leading-relaxed">
        {post.excerpt && (
          <p className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">{post.excerpt}</p>
        )}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="pt-10 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-serif text-emerald mb-6">Related Articles</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedBlogs.map(related => (
              <Link 
                key={related.id} 
                href={`/blog/${related.slug}`}
                className="group"
              >
                {related.featuredImage && (
                  <ClickableImage
                    src={related.featuredImage}
                    alt={related.title}
                    className="w-full mb-3"
                    aspectRatio="aspect-video"
                    rounded="rounded-lg"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald transition-colors">
                  {related.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {new Date(related.publishedAt || related.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

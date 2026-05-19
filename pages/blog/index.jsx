import Link from 'next/link'
import SEO from '../../components/SEO'
import blogPosts from '../../data/blogPosts'

export default function Blog(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-12">
      <SEO title="Blog — Sree Venkatesswara Constructions & Interiors" description="Read insights on luxury construction, interior ideas, home trends and architecture inspiration." />

      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Thought Leadership</p>
        <h1 className="text-5xl font-serif text-emerald">Insights for premium construction and interiors.</h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-700">Explore our articles on construction tips, luxury interior ideas, material guides and modern architecture inspiration.</p>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        {blogPosts.map(post => (
          <article key={post.slug} className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl hover:-translate-y-1 transition-transform">
            <p className="text-xs uppercase tracking-[0.35em] text-gold mb-4">{post.category}</p>
            <h2 className="text-2xl font-serif text-emerald mb-3">{post.title}</h2>
            <p className="text-gray-700 mb-6">{post.excerpt}</p>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{post.date}</span>
              <Link href={`/blog/${post.slug}`} className="text-emerald font-semibold">Read More →</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

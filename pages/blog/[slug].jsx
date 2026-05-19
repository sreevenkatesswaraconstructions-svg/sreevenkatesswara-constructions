import { useRouter } from 'next/router'
import SEO from '../../components/SEO'
import blogPosts from '../../data/blogPosts'

export default function BlogPost(){
  const router = useRouter()
  const { slug } = router.query
  const post = blogPosts.find(item => item.slug === slug)

  if (!post) return <main className="min-h-screen grid place-items-center px-6 py-20">Loading...</main>

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-10">
      <SEO title={`${post.title} — Sree Venkatesswara Constructions & Interiors`} description={post.excerpt} />
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">{post.category}</p>
        <h1 className="text-5xl font-serif text-emerald">{post.title}</h1>
        <p className="text-sm text-gray-600">Published {post.date}</p>
      </section>
      <article className="glass-panel rounded-[2rem] border border-emerald/10 p-10 shadow-2xl text-gray-700 leading-relaxed">
        <p className="mb-6">{post.excerpt}</p>
        <p className="mb-6">This article explores premium approaches to construction, interiors and modern design that align with high-end South Indian aesthetics. Our focus is on trust, quality and elegance in every client experience.</p>
        <h2 className="mt-10 mb-4 text-2xl font-serif text-emerald">Key insights</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>Choose materials that balance luxury and longevity.</li>
          <li>Create interiors that are calm, functional and richly textured.</li>
          <li>Ensure transparent communication and detailed planning from day one.</li>
        </ul>
      </article>
    </main>
  )
}

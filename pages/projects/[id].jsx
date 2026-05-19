import { useRouter } from 'next/router'
import Link from 'next/link'
import SEO from '../../components/SEO'
import projects from '../../data/projects'

export default function ProjectDetail(){
  const router = useRouter()
  const { id } = router.query
  if(!id) return <div className="min-h-screen grid place-items-center px-6 py-20">Loading...</div>
  const project = projects.find(p=> p.id === id)
  if(!project) return <div className="min-h-screen grid place-items-center px-6 py-20">Project not found</div>

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">
      <SEO title={`${project.title} — Sree Venkatesswara`} description={project.overview} />

      <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">{project.category}</p>
          <h1 className="text-5xl font-serif text-emerald">{project.title}</h1>
          <p className="mt-6 text-gray-700 leading-relaxed">{project.overview} This project showcases premium finishes, elegant lighting and a refined spatial composition.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-emerald px-6 py-3 text-white font-semibold">Discuss your project</Link>
            <Link href="/projects" className="rounded-full border border-emerald px-6 py-3 text-emerald">View all projects</Link>
          </div>
        </div>
        <div className="rounded-[2rem] overflow-hidden border border-emerald/10 shadow-2xl">
          <img src={project.gallery?.[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'} alt={project.title} className="w-full h-[420px] object-cover" />
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
        <h2 className="text-3xl font-serif text-emerald mb-6">Materials & Finishes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {project.materials.map(material => (
            <div key={material} className="rounded-3xl border border-emerald/10 bg-white p-6 text-gray-700 shadow-sm">{material}</div>
          ))}
        </div>
      </section>

      {project.gallery && project.gallery.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-serif text-emerald">Gallery</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {project.gallery.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-[2rem] shadow-2xl border border-emerald/10">
                <img src={image} alt={`${project.title} gallery ${index + 1}`} className="w-full h-72 object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

import { useMemo, useState } from 'react'
import SEO from '../../components/SEO'
import ProjectCard from '../../components/ProjectCard'
import { prisma } from '../../lib/prisma'

const categories = ['All', 'Residential', 'Commercial', 'Interiors', 'Villas']

export default function Projects({ projects }) {
  const [active, setActive] = useState('All')
  const filtered = useMemo(() => active === 'All' ? projects : projects.filter(project => project.category === active), [active, projects])

  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-16">
      <SEO title="Projects — Sree Venkatesswara Constructions & Interiors" description="Explore our luxury residential, commercial, interiors and villa projects." />

      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Our Portfolio</p>
        <h1 className="text-5xl font-serif text-emerald">Featured Projects That Define Premium Living.</h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-700">Browse curated project categories with large visuals, elegant details and premium craftsmanship showcased across residential, commercial and luxury interiors.</p>
      </section>

      <section className="flex flex-wrap gap-3 justify-center">
        {categories.map(category => (
          <button key={category} onClick={() => setActive(category)} className={`rounded-full px-5 py-3 text-sm font-semibold transition ${active === category ? 'bg-emerald text-white' : 'bg-white text-emerald border border-emerald/10 hover:bg-emerald/5'}`}>
            {category}
          </button>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(project => <ProjectCard key={project.id} project={project} />)}
      </section>
    </main>
  )
}

export async function getServerSideProps() {
  try {
    console.log('[PUBLIC PROJECTS] Fetching projects from database...');
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log('[PUBLIC PROJECTS] Fetched', projects.length, 'projects');
    return {
      props: {
        projects: JSON.parse(JSON.stringify(projects)),
      },
    };
  } catch (error) {
    console.error('[PUBLIC PROJECTS] Error fetching projects:', error);
    return {
      props: {
        projects: [],
      },
    };
  }
}

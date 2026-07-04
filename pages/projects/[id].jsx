import { useRouter } from 'next/router'
import Link from 'next/link'
import SEO from '../../components/SEO'
import ImageGallery from '../../components/ImageGallery'
import { prisma } from '../../lib/prisma'

export default function ProjectDetail({ project }) {
  if (!project) return <div className="min-h-screen grid place-items-center px-6 py-20">Project not found</div>

  // Parse images and videos from comma-separated strings
  const images = project.images ? (Array.isArray(project.images) ? project.images : project.images.split(',').map(img => img.trim())) : [];
  const videos = project.videos ? (Array.isArray(project.videos) ? project.videos : project.videos.split(',').map(vid => vid.trim())) : [];

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">
      <SEO title={`${project.title} — Sree Venkatesswara`} description={project.description} />

      <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">{project.category}</p>
          <h1 className="text-5xl font-serif text-emerald">{project.title}</h1>
          <p className="mt-6 text-gray-700 leading-relaxed">{project.description}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-emerald px-6 py-3 text-white font-semibold">Discuss your project</Link>
            <Link href="/projects" className="rounded-full border border-emerald px-6 py-3 text-emerald">View all projects</Link>
          </div>
        </div>
        <div className="rounded-[2rem] overflow-hidden border border-emerald/10 shadow-2xl">
          {images.length > 0 ? (
            <ImageGallery images={images} />
          ) : (
            <img src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80" alt={project.title} className="w-full h-[420px] object-cover" />
          )}
        </div>
      </section>

      {project.location && (
        <section className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
          <h2 className="text-3xl font-serif text-emerald mb-6">Location</h2>
          <p className="text-gray-700">{project.location}</p>
        </section>
      )}

      {project.clientName && (
        <section className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
          <h2 className="text-3xl font-serif text-emerald mb-6">Client</h2>
          <p className="text-gray-700">{project.clientName}</p>
        </section>
      )}


      {videos.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-serif text-emerald">Videos</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((video, index) => (
              <div key={index} className="overflow-hidden rounded-[2rem] shadow-2xl border border-emerald/10">
                <video
                  src={video.trim()}
                  controls
                  className="w-full h-72 object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.params;
    console.log('[PUBLIC PROJECT DETAIL] Fetching project:', id);
    
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      console.error('[PUBLIC PROJECT DETAIL] Project not found:', id);
      return { props: { project: null } };
    }

    console.log('[PUBLIC PROJECT DETAIL] Project fetched:', id);
    return {
      props: {
        project: JSON.parse(JSON.stringify(project)),
      },
    };
  } catch (error) {
    console.error('[PUBLIC PROJECT DETAIL] Error fetching project:', error);
    return {
      props: {
        project: null,
      },
    };
  }
}

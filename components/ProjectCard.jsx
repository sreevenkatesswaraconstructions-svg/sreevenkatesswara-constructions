import Link from 'next/link'

export default function ProjectCard({ project }){
  // Parse images from comma-separated string
  const images = project.images ? project.images.split(',').map(url => url.trim()) : [];
  const firstImage = images[0] || 'https://images.unsplash.com/photo-1505691723518-36a6f6af4a2f?w=1200';

  return (
    <Link href={`/projects/${project.id}`} className="group block overflow-hidden rounded-[2rem] border border-emerald/10 bg-white/90 shadow-lg transition-transform transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-72 overflow-hidden bg-gray-100">
        <img src={firstImage} alt={project.title} className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold/90 mb-3">{project.category}</p>
        <h3 className="font-serif text-2xl text-emerald mb-3">{project.title}</h3>
        <p className="text-sm text-gray-700">{project.description || project.overview}</p>
      </div>
    </Link>
  )
}

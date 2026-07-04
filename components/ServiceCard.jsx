import Image from 'next/image'

export default function ServiceCard({ title, description, href, image }){
  return (
    <a href={href || '/services'} className="group block bg-white/90 border border-emerald/10 rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 w-full bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald/10 to-emerald/5">
            <span className="text-4xl">⭐</span>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <h3 className="font-serif text-2xl text-emerald mb-3 group-hover:text-emerald/90">{title}</h3>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {description || `Premium ${title.toLowerCase()} services designed for modern luxury living.`}
        </p>
        <span className="mt-6 inline-flex items-center text-sm font-semibold text-emerald group-hover:text-emerald/90">
          View Details →
        </span>
      </div>
    </a>
  )
}

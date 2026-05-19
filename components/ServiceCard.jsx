const iconMap = {
  Construction: '🏗️',
  Interiors: '🛋️',
  Renovation: '🔧',
  'Civil Works': '🏛️',
  Plumbing: '🚰',
  Electrical: '💡',
  Painting: '🎨',
  Carpentry: '🪚'
}

export default function ServiceCard({ title, description, href }){
  return (
    <a href={href || '/services'} className="group block p-6 bg-white/90 border border-emerald/10 rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1">
      <div className="h-14 w-14 rounded-2xl bg-emerald/10 text-2xl flex items-center justify-center text-gold mb-5">{iconMap[title] || '⭐'}</div>
      <h3 className="font-serif text-2xl text-emerald mb-3 group-hover:text-emerald/90">{title}</h3>
      <p className="text-sm text-gray-700 leading-relaxed">{description || `Premium ${title.toLowerCase()} services designed for modern luxury living.`}</p>
      <span className="mt-6 inline-flex items-center text-sm font-semibold text-emerald group-hover:text-emerald/90">View Details →</span>
    </a>
  )
}

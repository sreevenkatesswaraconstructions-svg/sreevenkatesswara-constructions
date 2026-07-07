export default function TestimonialCard({ quote, name, projectType, location, photo, rating, role, company }){
  const initials = (name || 'Client')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'C'

  const displayProjectType = (projectType || role || '').toString().trim()
  const displayLocation = (location || company || '').toString().trim()
  const metadata = [displayProjectType, displayLocation].filter(Boolean).join(' • ')
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0))

  return (
    <div className="glass-panel p-8 rounded-[1.75rem] border border-emerald/10 shadow-xl">
      <div className="text-6xl leading-none text-gold mb-6">“</div>
      <p className="text-gray-700 leading-relaxed">{quote}</p>
      <div className="mt-6 border-t border-emerald/10 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-emerald/10 text-sm font-semibold text-emerald">
            {photo ? (
              <img src={photo} alt={name || 'Customer'} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="font-semibold text-emerald">{name}</p>
            {metadata ? <p className="text-sm text-gray-600">{metadata}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1" aria-label={`${safeRating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < safeRating ? 'text-amber-400' : 'text-gray-300'}>
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

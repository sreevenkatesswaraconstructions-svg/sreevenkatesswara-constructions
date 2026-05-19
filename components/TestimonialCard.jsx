export default function TestimonialCard({ quote, name, role, company }){
  return (
    <div className="glass-panel p-8 rounded-[1.75rem] border border-emerald/10 shadow-xl">
      <div className="text-6xl leading-none text-gold mb-6">“</div>
      <p className="text-gray-700 leading-relaxed">{quote}</p>
      <div className="mt-6 border-t border-emerald/10 pt-5 text-sm text-gray-600">
        <p className="font-semibold text-emerald">{name}</p>
        <p>{role} · {company}</p>
      </div>
    </div>
  )
}

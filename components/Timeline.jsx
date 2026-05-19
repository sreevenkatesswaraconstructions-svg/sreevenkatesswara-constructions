export default function Timeline({ items=[] }){
  return (
    <div className="relative">
      <div className="border-l-2 border-beige pl-16 space-y-8">
        {items.map((it,i)=> (
          <div key={i} className="relative">
            <div className="absolute -left-[2.1rem] top-1 w-8 h-8 bg-ivory rounded-full border-2 border-beige flex items-center justify-center text-gold font-semibold text-sm shadow-sm">{i+1}</div>
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald text-lg">{it.title}</h4>
              <p className="text-gray-700 leading-relaxed">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

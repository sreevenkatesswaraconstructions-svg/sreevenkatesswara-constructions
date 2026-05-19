import { useRouter } from 'next/router'
import Link from 'next/link'
import SEO from '../../components/SEO'
import services from '../../data/services'

export default function ServiceDetail(){
  const router = useRouter()
  const { slug } = router.query
  if(!slug) return <div className="min-h-screen grid place-items-center px-6 py-20">Loading...</div>
  const svc = services.find(s=> s.slug === slug)
  if(!svc) return <div className="min-h-screen grid place-items-center px-6 py-20">Service not found</div>

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">
      <SEO title={`${svc.title} Services — Sree Venkatesswara`} description={svc.short} />
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Service</p>
          <h1 className="text-5xl font-serif text-emerald">{svc.title}</h1>
          <p className="text-gray-700 leading-relaxed">{svc.short} Experience a premium blend of modern functionality and elegant design from concept to completion.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-emerald px-6 py-3 text-white font-semibold">Request Quote</Link>
            <Link href="/services" className="rounded-full border border-emerald px-6 py-3 text-emerald">All Services</Link>
          </div>
        </div>
        <div className="rounded-[2rem] overflow-hidden border border-emerald/10 shadow-2xl">
          <img src={svc.gallery?.[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'} alt={svc.title} className="w-full h-[420px] object-cover" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
          <h2 className="text-3xl font-serif text-emerald mb-5">What We Deliver</h2>
          <ul className="space-y-4 text-gray-700">
            {svc.details.map(detail => (
              <li key={detail} className="flex gap-3 items-start">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gold/15 text-gold">✓</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
          <h2 className="text-3xl font-serif text-emerald mb-5">How We Work</h2>
          <div className="space-y-4">
            {svc.process.map((step, index) => (
              <div key={step} className="rounded-3xl bg-white p-5 shadow-sm border border-emerald/10">
                <p className="text-sm uppercase tracking-[0.35em] text-gold mb-2">Step {index + 1}</p>
                <h3 className="font-semibold text-emerald text-xl">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="rounded-[2rem] bg-emerald/5 p-8 border border-emerald/10">
          <h2 className="text-3xl font-serif text-emerald mb-4">Materials Used</h2>
          <div className="flex flex-wrap gap-3">
            {svc.materials.map(material => (
              <span key={material} className="rounded-full border border-emerald/20 bg-white/90 px-4 py-2 text-sm text-gray-700">{material}</span>
            ))}
          </div>
        </div>

        {svc.gallery && svc.gallery.length > 0 && (
          <div>
            <h2 className="text-3xl font-serif text-emerald mb-6">Service Gallery</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {svc.gallery.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-[2rem] shadow-xl border border-emerald/10">
                  <img src={image} alt={`${svc.title} gallery ${index + 1}`} className="w-full h-64 object-cover transition-transform duration-700 hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

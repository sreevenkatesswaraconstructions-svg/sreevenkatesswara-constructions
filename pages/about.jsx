import SEO from '../components/SEO'
import Timeline from '../components/Timeline'

const journey = [
  { title: 'Rooted in Tradition', desc: 'Founded to merge modern architecture with timeless cultural elegance.' },
  { title: 'Signature Villa Launch', desc: 'Delivered the first luxury villa with premium craftsmanship and serene design.' },
  { title: 'Design & Build Growth', desc: 'Expanded our team to include architects, interior designers and project specialists.' },
  { title: 'Trusted Excellence', desc: 'Recognized for transparent delivery, quality materials and professional service.' }
]

const values = [
  'Quality Materials',
  'Clear Communication',
  'Timely Delivery',
  'Trusted Craftsmanship',
  'Customized Luxury',
  'Future-Ready Design'
]

export default function About(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-16 lg:space-y-20">
      <SEO title="About Us — Sree Venkatesswara Constructions & Interiors" description="Discover our premium construction and interior story, vision and values." />

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">About Us</p>
          <h1 className="text-5xl font-serif text-emerald">A legacy of trust, luxury and modern craft.</h1>
          <p className="text-gray-700 leading-relaxed">Sree Venkatesswara Constructions & Interiors combines spiritual warmth with architectural precision to create homes, villas and commercial spaces that feel elevated, timeless and deeply personal.</p>
          <blockquote className="glass-panel p-8 rounded-[2rem] border border-emerald/10 text-gray-700 shadow-xl">
            “Every project is an expression of our commitment to premium design, cultural elegance and reliable delivery.”
          </blockquote>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-emerald/5 p-6">
              <h2 className="font-serif text-2xl text-emerald mb-3">Vision</h2>
              <p className="text-gray-700">To be the preferred luxury build partner, shaping homes that feel sacred, modern and enduring.</p>
            </div>
            <div className="rounded-[1.75rem] bg-emerald/5 p-6">
              <h2 className="font-serif text-2xl text-emerald mb-3">Mission</h2>
              <p className="text-gray-700">To deliver premium construction and interior solutions with trust, transparency and architectural excellence.</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-[2rem] overflow-hidden border border-emerald/10 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" alt="Premium exterior" className="w-full object-cover h-[420px]" />
          </div>
          <div className="rounded-[2rem] overflow-hidden border border-emerald/10 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80" alt="Premium interior" className="w-full object-cover h-[320px]" />
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Founder Message</p>
          <h2 className="text-4xl font-serif text-emerald">Built on a promise of premium service and sacred design.</h2>
          <p className="text-gray-700 leading-relaxed">Our founder envisioned a brand that would honour timeless heritage while setting a new standard for luxury construction and interiors. We craft every project with warmth, precision and a commitment to lasting quality.</p>
        </div>
        <div className="rounded-[2rem] bg-beige p-8 glass-panel border border-emerald/10 shadow-xl">
          <h3 className="font-serif text-2xl text-emerald mb-4">Core Values</h3>
          <ul className="grid gap-3 text-gray-700">
            {values.map(value => <li key={value} className="rounded-xl bg-white p-4 shadow-sm">{value}</li>)}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-4xl font-serif text-emerald mb-8">Our Journey</h2>
        <Timeline items={journey} />
      </section>
    </main>
  )
}

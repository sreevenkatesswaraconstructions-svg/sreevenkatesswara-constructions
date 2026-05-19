import SEO from '../components/SEO'

const reasons = [
  { title: 'Quality Assurance', description: 'We use premium materials and maintain strict quality control through every stage.' },
  { title: 'Transparent Pricing', description: 'Detailed estimates and clear communication eliminate surprises.' },
  { title: 'Skilled Professionals', description: 'Experienced architects, engineers and artisans deliver reliable luxury results.' },
  { title: 'Premium Materials', description: 'Selected finishes and construction materials ensure lasting elegance.' },
  { title: 'Modern Designs', description: 'Contemporary aesthetics balanced with South Indian cultural warmth.' },
  { title: 'On-time Completion', description: 'A disciplined workflow keeps your project on time and on budget.' }
]

const workflow = [
  { step: 'Consultation', detail: 'Understand your vision, scope and site context.' },
  { step: 'Planning', detail: 'Create a clear timeline, budget and project strategy.' },
  { step: 'Design', detail: 'Develop architecture and interior concepts with premium detailing.' },
  { step: 'Execution', detail: 'Deliver construction and interiors with craftsmanship and care.' },
  { step: 'Handover', detail: 'Complete final walkthroughs, quality checks and client support.' }
]

export default function WhyUs(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-16">
      <SEO title="Why Us — Sree Venkatesswara Constructions & Interiors" description="Discover why our construction and interiors company is trusted for premium projects." />

      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Why Us</p>
        <h1 className="text-5xl font-serif text-emerald">Trusted, premium, and future-ready construction services.</h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-700">We combine architectural precision, cultural elegance and a transparent process to deliver projects that feel luxurious, modern and enduring.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reasons.map(reason => (
          <div key={reason.title} className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-xl">
            <h2 className="font-serif text-2xl text-emerald mb-4">{reason.title}</h2>
            <p className="text-gray-700">{reason.description}</p>
          </div>
        ))}
      </section>

      <section className="glass-panel rounded-[2rem] border border-emerald/10 p-10 shadow-2xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Workflow</p>
            <h2 className="text-4xl font-serif text-emerald">How We Work</h2>
            <p className="mt-4 text-gray-700 leading-relaxed">A premium process from consultation to handover that keeps every stage clear and every result refined.</p>
          </div>
          <div className="space-y-4">
            {workflow.map((item, index) => (
              <div key={item.step} className="rounded-[1.75rem] bg-white p-6 shadow-sm border border-emerald/10">
                <div className="text-sm uppercase tracking-[0.35em] text-gold mb-2">Step {index + 1}</div>
                <h3 className="font-semibold text-emerald text-xl mb-2">{item.step}</h3>
                <p className="text-gray-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

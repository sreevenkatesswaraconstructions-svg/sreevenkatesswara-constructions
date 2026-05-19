import Link from 'next/link'
import ServiceCard from '../../components/ServiceCard'

const services = [
  { title: 'Construction', description: 'Residential, commercial and villa builds with structural excellence.', slug: 'construction' },
  { title: 'Interiors', description: 'Modern living spaces with elegant finishes and luxury comfort.', slug: 'interiors' },
  { title: 'Renovation', description: 'Home remodeling and restoration with refined design updates.', slug: 'renovation' },
  { title: 'Civil Works', description: 'Foundations, RCC structures and site development delivered with strength.', slug: 'civil-works' },
  { title: 'Plumbing', description: 'Water systems, bathroom fittings and drainage solutions for premium projects.', slug: 'plumbing' },
  { title: 'Electrical', description: 'Wiring, lighting and smart electrical systems for luxury homes.', slug: 'electrical' },
  { title: 'Painting', description: 'Interior and exterior painting with texture finishes and premium coatings.', slug: 'painting' },
  { title: 'Carpentry', description: 'Custom woodwork, doors, furniture and storage that elevate every room.', slug: 'carpentry' }
]

export default function Services(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-12">
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Our Services</p>
        <h1 className="text-5xl font-serif text-emerald">Premium service experiences for every stage of your build.</h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-700">Explore our dedicated service offerings for construction, interiors, renovation and more. Each service is designed to provide transparent delivery, luxury finishes and scalable project value.</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {services.map(service => (
          <ServiceCard key={service.title} title={service.title} description={service.description} href={`/services/${service.slug}`} />
        ))}
      </section>
    </main>
  )
}

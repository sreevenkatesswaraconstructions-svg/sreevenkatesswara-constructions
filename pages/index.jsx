import { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import Hero from '../components/Hero'
import ServiceCard from '../components/ServiceCard'
import ProjectCard from '../components/ProjectCard'
import TestimonialCard from '../components/TestimonialCard'
import ClickableImage from '../components/ClickableImage'
import projects from '../data/projects'
import Link from 'next/link'

const services = [
  { title: 'Construction', description: 'Luxury residential, commercial and villa construction with structural precision.', slug: 'construction' },
  { title: 'Interiors', description: 'Bespoke interior design with premium finishes and modern comfort.', slug: 'interiors' },
  { title: 'Renovation', description: 'Transformative home upgrades with elegant space planning.', slug: 'renovation' },
  { title: 'Civil Works', description: 'Robust foundation and RCC structures for long-lasting projects.', slug: 'civil-works' },
  { title: 'Plumbing', description: 'Water systems, bathroom fittings and smart drainage expertise.', slug: 'plumbing' },
  { title: 'Electrical', description: 'Safe wiring, lighting and power solutions for premium spaces.', slug: 'electrical' },
  { title: 'Painting', description: 'Interior and exterior finishes with rich textures and premium coatings.', slug: 'painting' },
  { title: 'Carpentry', description: 'Custom joinery, furniture and storage crafted in luxury wood tones.', slug: 'carpentry' }
]

const reasons = [
  { title: 'Quality Workmanship', description: 'Every project is finished with premium materials and careful detailing.' },
  { title: 'On-time Delivery', description: 'Our process is designed for punctual completion at every milestone.' },
  { title: 'Transparent Process', description: 'Clear communication and accurate estimates keep clients informed.' },
  { title: 'Skilled Professionals', description: 'Experienced architects, designers and artisans deliver exceptional results.' }
]

export default function Home(){
  const [featuredTestimonials, setFeaturedTestimonials] = useState([])
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials?status=Approved&featured=true')
        const result = await response.json()

        if (!isMounted) return

        if (result.success) {
          const visibleTestimonials = [...(result.data || [])]
            .filter((item) => String(item.status || '').toLowerCase() === 'approved' && Boolean(item.isFeatured))
            .sort((a, b) => {
              const orderDifference = (a.displayOrder ?? 0) - (b.displayOrder ?? 0)

              if (orderDifference !== 0) return orderDifference

              return new Date(b.createdAt) - new Date(a.createdAt)
            })

          setFeaturedTestimonials(visibleTestimonials)
        } else {
          setFeaturedTestimonials([])
        }
      } catch (error) {
        console.error('[HOME TESTIMONIALS] Error fetching testimonials:', error)
        if (isMounted) setFeaturedTestimonials([])
      } finally {
        if (isMounted) setIsLoadingTestimonials(false)
      }
    }

    fetchTestimonials()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <SEO title="Sree Venkatesswara Constructions & Interiors" description="Building dreams and creating luxury spaces with premium construction and interiors." />
      <Hero />

      <main className="max-w-7xl mx-auto px-6 pb-24 pt-12 space-y-20">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">Premium Services</p>
            <h2 className="text-4xl font-serif text-emerald">Designed for a luxurious build experience.</h2>
            <p className="max-w-2xl text-gray-700">Explore our curated service offerings, each crafted to deliver premium construction and interior excellence with a modern South Indian signature.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reasons.map(reason => (
              <div key={reason.title} className="glass-panel p-6 rounded-[1.75rem] border border-emerald/10 shadow-xl">
                <h3 className="font-serif text-2xl text-emerald mb-3">{reason.title}</h3>
                <p className="text-gray-700">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-gold">Services Preview</p>
              <h2 className="text-4xl font-serif text-emerald">Crafted services for every dimension of your project.</h2>
            </div>
            <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-emerald px-5 py-3 text-sm text-emerald hover:bg-emerald/5">View all services</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {services.map(service => (
              <ServiceCard key={service.title} title={service.title} description={service.description} href={`/services/${service.slug}`} />
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center glass-panel p-8 rounded-[2rem] border border-emerald/10 shadow-2xl bg-white/80">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">About Preview</p>
            <h2 className="text-4xl font-serif text-emerald">Your Vision, Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed">Sree Venkatesswara Constructions & Interiors blends spiritual elegance with modern luxury to craft spaces rooted in trust, quality and cultural warmth. Our attention to detail ensures each project feels premium and timeless.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-beige p-6 shadow-inner border border-emerald/10">
                <h3 className="font-semibold text-emerald mb-2">Quality commitment</h3>
                <p className="text-sm text-gray-700">Premium finishes, superior materials and strict workmanship standards.</p>
              </div>
              <div className="rounded-3xl bg-beige p-6 shadow-inner border border-emerald/10">
                <h3 className="font-semibold text-emerald mb-2">Trust & transparency</h3>
                <p className="text-sm text-gray-700">Clear budgets, honest timelines and communication at every step.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <ClickableImage
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
              alt="Architecture"
              className="h-[360px]"
              aspectRatio="aspect-video"
              rounded="rounded-[2rem]"
            />
            <div className="grid grid-cols-2 gap-4">
              <ClickableImage
                src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80"
                alt="Interior design"
                className="h-40"
                aspectRatio="aspect-video"
                rounded="rounded-[1.75rem]"
              />
              <ClickableImage
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80"
                alt="Construction"
                className="h-40"
                aspectRatio="aspect-video"
                rounded="rounded-[1.75rem]"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-gold">Featured Projects</p>
              <h2 className="text-4xl font-serif text-emerald">A portfolio of residential, interiors, commercial and villa excellence.</h2>
            </div>
            <Link href="/projects" className="inline-flex items-center justify-center rounded-full border border-emerald px-5 py-3 text-sm text-emerald hover:bg-emerald/5">View project gallery</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 3).map(project => <ProjectCard key={project.id} project={project} />)}
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">Testimonials</p>
            <h2 className="text-4xl font-serif text-emerald">Trusted by clients who value luxury and reliability.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {!isLoadingTestimonials && featuredTestimonials.length === 0 ? (
              <div className="md:col-span-3 glass-panel p-8 rounded-[1.75rem] border border-emerald/10 shadow-xl text-center">
                <p className="text-lg font-semibold text-emerald">Customer testimonials will be available soon.</p>
                <p className="mt-2 text-sm text-gray-600">Approved featured reviews from our clients will appear here.</p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-base font-semibold text-emerald">Have you worked with us?</p>
                  <p className="text-sm text-gray-600">We'd love to hear about your experience.</p>
                  <Link href="/share-your-experience" className="inline-flex items-center justify-center rounded-full bg-emerald px-6 py-3 text-white font-semibold">⭐ Share Your Experience</Link>
                </div>
              </div>
            ) : (
              featuredTestimonials.map((item) => (
                <TestimonialCard
                  key={item.id}
                  quote={item.reviewMessage}
                  name={item.customerName}
                  projectType={item.customerRole}
                  location={item.customerLocation}
                  photo={item.customerPhoto}
                  rating={item.rating}
                />
              ))
            )}
          </div>
          {!isLoadingTestimonials && featuredTestimonials.length > 0 && (
            <div className="flex justify-center mt-8">
              <Link href="/share-your-experience" className="inline-flex items-center justify-center rounded-full bg-emerald px-6 py-3 text-white font-semibold">⭐ Share Your Experience</Link>
            </div>
          )}
        </section>

        <section className="glass-panel rounded-[2rem] border border-emerald/10 p-10 text-center bg-white/85 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-gold mb-4">Ready to begin</p>
          <h2 className="text-4xl font-serif text-emerald mb-6">Let’s Build Something Amazing Together</h2>
          <p className="max-w-3xl mx-auto text-gray-700 mb-8">Begin your next project with a trusted construction and interiors partner that blends premium craftsmanship, spiritual elegance and modern design.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-emerald px-6 py-3 text-white font-semibold">Contact Us</Link>
            <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-emerald px-6 py-3 text-emerald">Get Free Quote</Link>
          </div>
        </section>
      </main>
    </>
  )
}

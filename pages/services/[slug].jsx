import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import SEO from '../../components/SEO'
import ClickableImage from '../../components/ClickableImage'
import { Loader2, Layers } from 'lucide-react'
import { company, getCallUrl, getWhatsAppUrl } from '../../lib/company'

export default function ServiceDetail() {
  const router = useRouter()
  const { slug } = router.query
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchService()
    }
  }, [slug])

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/services?slug=${slug}`)
      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        setService(result.data[0])
      } else {
        setService(null)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      setService(null)
    } finally {
      setLoading(false)
    }
  }

  if (!slug || loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      </main>
    )
  }

  if (!service) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Service not found</p>
        </div>
      </main>
    )
  }

  const seoTitle = service.seoTitle || `${service.serviceName} — Sree Venkatesswara`
  const seoDescription = service.seoDescription || service.shortDescription || service.detailedDescription?.substring(0, 160)

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">
      <SEO title={seoTitle} description={seoDescription} />
      
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-600">Service</p>
          <h1 className="text-5xl font-serif text-gray-900 dark:text-white">{service.serviceName}</h1>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {service.shortDescription || service.detailedDescription?.substring(0, 200) + '...'}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition-colors">
              Get Quote
            </Link>
            <a href={getCallUrl(company.primaryPhone)} className="rounded-full border border-emerald-600 px-6 py-3 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              Call Now
            </a>
            <a 
              href={getWhatsAppUrl(company.whatsapp)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="rounded-full bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
          </div>

          {service.featured && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              ⭐ Featured Service
            </div>
          )}
        </div>
        <div className="rounded-[2rem] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
          {service.image ? (
            <ClickableImage
              src={service.image}
              alt={service.serviceName}
              className="w-full h-[420px]"
              aspectRatio="aspect-video"
              rounded="rounded-[2rem]"
            />
          ) : (
            <div className="w-full h-[420px] bg-gray-200 dark:bg-gray-700 rounded-[2rem] flex items-center justify-center">
              <Layers className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 p-8 shadow-xl">
        <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-5">About This Service</h2>
        <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300">
          {service.detailedDescription ? (
            <p className="whitespace-pre-wrap">{service.detailedDescription}</p>
          ) : (
            <p>{service.shortDescription}</p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 p-8 border border-emerald-200 dark:border-emerald-800">
        <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-6">Interested in this service?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Contact us today to discuss your project requirements and get a personalized quote.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="rounded-full bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition-colors">
            Get Quote
          </Link>
          <a href={getCallUrl(company.primaryPhone)} className="rounded-full border border-emerald-600 px-6 py-3 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            Call Now
          </a>
          <a 
            href={getWhatsAppUrl(company.whatsapp)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="rounded-full bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </section>
    </main>
  )
}

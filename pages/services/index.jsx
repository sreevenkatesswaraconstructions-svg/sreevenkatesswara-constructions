import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Loader2, Layers } from 'lucide-react'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?status=ACTIVE')
      const result = await response.json()
      if (result.success) {
        setServices(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-12">
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-600 mb-4">Our Services</p>
        <h1 className="text-5xl font-serif text-gray-900 dark:text-white mb-6">
          Premium service experiences for every stage of your build.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
          Explore our dedicated service offerings for construction, interiors, renovation and more. 
          Each service is designed to provide transparent delivery, luxury finishes and scalable project value.
        </p>
      </section>

      {services.length === 0 ? (
        <section className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No services available at the moment.</p>
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                {service.image ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.serviceName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Layers className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {service.serviceName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {service.shortDescription || service.detailedDescription?.substring(0, 150) + '...'}
                  </p>
                  <span className="inline-flex items-center mt-4 text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline">
                    Read More
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

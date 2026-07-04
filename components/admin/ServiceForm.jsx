import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import ServiceImagePicker from './ServiceImagePicker'

export default function ServiceForm({ initialData, onSubmit, submitText = 'Create Service' }) {
  const [formData, setFormData] = useState(initialData || {
    serviceName: '',
    slug: '',
    shortDescription: '',
    detailedDescription: '',
    image: '',
    status: 'ACTIVE',
    featured: false,
    seoTitle: '',
    seoDescription: '',
  })
  const [selectedMedia, setSelectedMedia] = useState(
    initialData?.image ? [{ url: initialData.image, id: 'existing', name: 'Service Image' }] : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateSlug = (serviceName) => {
    return serviceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const imageUrl = formData.image || selectedMedia.length > 0 ? selectedMedia[0].url : null
      const slug = formData.slug || generateSlug(formData.serviceName)

      await onSubmit({
        ...formData,
        image: imageUrl,
        slug,
      })
    } catch (error) {
      console.error('[SERVICE FORM] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'serviceName' && (!formData.slug || formData.slug === generateSlug(formData.serviceName))) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Featured Image
        </label>
        <ServiceImagePicker
          selected={selectedMedia}
          onChange={(media) => {
            setSelectedMedia(media)
            if (media.length > 0) {
              handleChange('image', media[0].url)
            } else {
              handleChange('image', '')
            }
          }}
          maxSelect={1}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Service Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceName}
          onChange={(e) => handleChange('serviceName', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">URL-friendly identifier. Auto-generated from service name.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Short Description
        </label>
        <textarea
          value={formData.shortDescription}
          onChange={(e) => handleChange('shortDescription', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="Brief description (150 chars max)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Detailed Description
        </label>
        <textarea
          value={formData.detailedDescription}
          onChange={(e) => handleChange('detailedDescription', e.target.value)}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="Full service description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="featured"
          checked={formData.featured}
          onChange={(e) => handleChange('featured', e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Featured Service
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SEO Title
          </label>
          <input
            type="text"
            value={formData.seoTitle}
            onChange={(e) => handleChange('seoTitle', e.target.value)}
            placeholder="Meta title for SEO"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SEO Description
          </label>
          <textarea
            value={formData.seoDescription}
            onChange={(e) => handleChange('seoDescription', e.target.value)}
            rows={2}
            placeholder="Meta description for SEO"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          submitText
        )}
      </button>
    </form>
  )
}

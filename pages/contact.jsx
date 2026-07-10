import { useState } from 'react'
import SEO from '../components/SEO'

export default function Contact(){
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)


    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: 'General Enquiry',
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        setSubmitStatus('error')
        console.error('[CONTACT FORM] Error:', data)
      }
    } catch (error) {
      setSubmitStatus('error')
      console.error('[CONTACT FORM] Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <SEO title="Contact — Sree Venkatesswara Constructions & Interiors" description="Reach out for luxury construction, interior design and project consultations." />

      <section className="mx-auto max-w-3xl">
        <div className="mb-8 text-center lg:text-left">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Contact</p>
          <h1 className="mt-3 text-4xl font-serif text-emerald sm:text-5xl">Let&apos;s start your next premium project together.</h1>
          <p className="mt-4 text-gray-700 leading-relaxed">Send us a message to discuss your construction, renovation or interior requirements. Our team is ready to guide you through every step.</p>
        </div>

        <div className="glass-panel rounded-[2rem] border border-emerald/10 p-8 shadow-2xl sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" 
                placeholder="Your name" 
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" 
                placeholder="you@example.com" 
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Phone</label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" 
                placeholder="9052468789" 
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Message</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full min-h-[160px] rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" 
                placeholder="Tell us about your project"
                required
              />
            </div>
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-100 text-green-700 rounded-xl">
                Thank you! Your enquiry has been submitted successfully.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-4 bg-red-100 text-red-700 rounded-xl">
                Sorry, there was an error submitting your enquiry. Please try again.
              </div>
            )}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-emerald px-6 py-4 text-white font-semibold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

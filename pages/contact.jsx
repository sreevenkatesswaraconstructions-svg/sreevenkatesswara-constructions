import { useState } from 'react'
import SEO from '../components/SEO'
import { company, getCallUrl, getEmailUrl, getMapsUrl } from '../lib/company'

const contactMethods = [
  { title: 'Phone', detail: `${company.primaryPhone}, ${company.secondaryPhone}`, href: getCallUrl(company.primaryPhone) },
  { title: 'Email', detail: company.email, href: getEmailUrl(company.email) },
  { title: 'Office', detail: company.address, href: getMapsUrl(company.address) }
]

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

    console.log('[CONTACT FORM] Submitting enquiry:', formData)

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
      console.log('[CONTACT FORM] Response:', data)

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
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-16">
      <SEO title="Contact — Sree Venkatesswara Constructions & Interiors" description="Reach out for luxury construction, interior design and project consultations." />

      <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Contact</p>
          <h1 className="text-5xl font-serif text-emerald">Let's start your next premium project together.</h1>
          <p className="text-gray-700 leading-relaxed">Send us a message or connect directly by phone or WhatsApp to discuss your construction, renovation or interior requirements. Our team is ready to guide you through every step.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {contactMethods.map(item => (
              <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="glass-panel rounded-[1.75rem] border border-emerald/10 p-6 text-gray-700 hover:border-emerald hover:text-emerald transition">
                <p className="text-sm uppercase tracking-[0.35em] text-gold mb-2">{item.title}</p>
                <p className="font-semibold break-all">{item.detail}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] border border-emerald/10 p-10 shadow-2xl">
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

      <section className="mt-8 grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-[0.35em] text-gold">Business Card</h3>
          <p className="text-gray-700">Download or view the business card for quick contact details.</p>
          <a href="/images/business card.jpeg" target="_blank" rel="noreferrer" className="inline-block mt-3 rounded-lg overflow-hidden border border-emerald/10 shadow-lg">
            <img src="/images/business card.jpeg" alt="Business card" className="w-full max-w-sm object-cover" />
          </a>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.35em] text-gold">Personal Contact</h3>
          <p className="text-gray-700 mt-3"><strong>SREE VENKATESSWARA</strong></p>
          <p className="text-gray-700">CONSTRUCTIONS & INTERIORS</p>
          <p className="text-gray-700">[{company.tagline.toUpperCase()}]</p>
          <p className="text-gray-700">Phone: <a href={getCallUrl(company.primaryPhone)} className="text-emerald">{company.primaryPhone}</a> &nbsp;|&nbsp; <a href={getCallUrl(company.secondaryPhone)} className="text-emerald">{company.secondaryPhone}</a></p>
          <p className="text-gray-700">Email: <a href={getEmailUrl(company.email)} className="text-emerald">{company.email}</a></p>
          <p className="text-gray-700">Website: <a href={company.website} className="text-emerald">{company.website.replace('https://www.', '')}</a></p>
          <p className="text-gray-700">Address: {company.address}</p>
        </div>
      </section> 

      <section className="rounded-[2rem] border border-emerald/10 bg-white/80 p-8 shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-gold">Branch</p>
            <h2 className="text-3xl font-serif text-emerald mb-4">Office & Appointment</h2>
            <p className="text-gray-700 leading-relaxed">Visit our studio or request an on-site appointment for your residential, commercial or villa project.</p>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-emerald/10">
            <iframe src="https://www.google.com/maps?q=50-58-8+Rajendranagar+Vishakhapatnam&output=embed" width="100%" height="280" loading="lazy" className="border-0"></iframe>
          </div>
        </div>
      </section>
    </main>
  )
}

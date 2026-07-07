import React, { useState } from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'

export default function ShareYourExperience(){
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [projectType, setProjectType] = useState('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const e = {}
    if (!customerName.trim()) e.customerName = 'Please enter your name.'
    if (!location.trim()) e.location = 'Please enter your location.'
    if (!rating || rating < 1) e.rating = 'Please select a rating.'
    if (!message.trim()) e.message = 'Please enter your review.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const uploadPhoto = async () => {
    if (!photoFile) return null
    try {
      const fd = new FormData()
      fd.append('file', photoFile)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) return null
      const data = await res.json()
      return data?.media?.fileUrl || null
    } catch (err) {
      console.error('Photo upload failed', err)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const photoUrl = await uploadPhoto()

      const payload = {
        customerName: customerName.trim(),
        customerEmail: email.trim() || null,
        customerPhone: phone.trim() || null,
        customerLocation: location.trim(),
        projectType: projectType || null,
        reviewMessage: message.trim(),
        rating: Number(rating) || 5,
        customerPhoto: photoUrl || null,
        // Do not expose admin-only fields; let API defaults handle status/isFeatured/displayOrder
      }

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Submission failed')
      }

      setSuccess(true)
      setCustomerName('')
      setEmail('')
      setPhone('')
      setLocation('')
      setProjectType('')
      setRating(0)
      setMessage('')
      setPhotoFile(null)
      setErrors({})
    } catch (err) {
      console.error(err)
      alert('Failed to submit review. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <SEO title="Share Your Experience" description="Share your experience with Sree Venkatesswara Constructions & Interiors" />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-6 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Share Your Experience</p>
          <h1 className="text-4xl font-serif text-emerald">Share Your Experience</h1>
          <div className="prose max-w-none text-gray-700">
            <p>We truly value your feedback.</p>
            <p>If we had the opportunity to work with you, we'd love to hear about your experience.</p>
            <p>Your review helps us improve our services and helps future customers make informed decisions.</p>
          </div>
        </div>

        <div className="mt-10 glass-panel p-8 rounded-[1.5rem] border border-emerald/10 shadow-2xl bg-white/80">
          {success ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-emerald">Thank you for sharing your experience!</h2>
              <p className="mt-4 text-gray-700">We appreciate your valuable feedback.</p>
              <p className="mt-2 text-gray-700">Your review has been submitted successfully and is currently under review.</p>
              <p className="mt-2 text-gray-700">It will appear on our website after approval by our team.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                <input value={customerName} onChange={e=>setCustomerName(e.target.value)} className="mt-1 block w-full rounded-md border border-emerald/20 p-3" />
                {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="mt-1 block w-full rounded-md border border-emerald/20 p-3" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 block w-full rounded-md border border-emerald/20 p-3" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input value={location} onChange={e=>setLocation(e.target.value)} className="mt-1 block w-full rounded-md border border-emerald/20 p-3" />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Project Type (Optional)</label>
                <select value={projectType} onChange={e=>setProjectType(e.target.value)} className="mt-1 block w-full rounded-md border border-emerald/20 p-3 bg-white">
                  <option value="">Select project type</option>
                  <option>Individual House</option>
                  <option>Villa</option>
                  <option>Apartment</option>
                  <option>Commercial Building</option>
                  <option>Interior Design</option>
                  <option>Renovation</option>
                  <option>Office Interior</option>
                  <option>Modular Kitchen</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Rating *</label>
                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map(st => (
                    <button key={st} type="button" onClick={()=>setRating(st)} className={`px-3 py-2 rounded-md border ${rating>=st? 'bg-emerald text-white border-emerald':'border-emerald/20 text-gray-700'} `}>
                      {st} ★
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-red-600 text-sm mt-1">{errors.rating}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Review Message *</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} className="mt-1 block w-full rounded-md border border-emerald/20 p-3" />
                {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Customer Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={e=>setPhotoFile(e.target.files?.[0]||null)} className="mt-1 block w-full" />
              </div>

              <div className="md:col-span-2 flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Fields marked * are required.</div>
                <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-full bg-emerald px-6 py-3 text-white font-semibold">
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </Layout>
  )
}

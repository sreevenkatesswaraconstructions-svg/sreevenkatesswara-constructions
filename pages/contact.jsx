import SEO from '../components/SEO'

const contactMethods = [
  { title: 'Phone', detail: '9052468789, 8977068789', href: 'tel:+919052468789' },
  { title: 'Email', detail: 'sreevenkatesswaraconstructions@gmail.com', href: 'mailto:sreevenkatesswaraconstructions@gmail.com' },
  { title: 'Office', detail: '50-58-8, Rajendranagar, Backside of Prism College, Seethammapeta, Vishakhapatnam - 530016', href: 'https://www.google.com/maps?q=50-58-8+Rajendranagar+Vishakhapatnam' }
]

export default function Contact(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-16">
      <SEO title="Contact — Sree Venkatesswara Constructions & Interiors" description="Reach out for luxury construction, interior design and project consultations." />

      <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">Contact</p>
          <h1 className="text-5xl font-serif text-emerald">Let’s start your next premium project together.</h1>
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
          <form className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Name</label>
              <input className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Phone</label>
              <input className="w-full rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" placeholder="9052468789" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Message</label>
              <textarea className="w-full min-h-[160px] rounded-2xl border border-emerald/10 bg-white p-4 text-gray-700 outline-none focus:border-emerald" placeholder="Tell us about your project"></textarea>
            </div>
            <button className="w-full rounded-full bg-emerald px-6 py-4 text-white font-semibold shadow-xl">Send Inquiry</button>
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
          <p className="text-gray-700">[BUILDING DREAMS, CREATING SPACES.]</p>
          <p className="text-gray-700">Phone: <a href="tel:+919052468789" className="text-emerald">9052468789</a> &nbsp;|&nbsp; <a href="tel:+918977068789" className="text-emerald">8977068789</a></p>
          <p className="text-gray-700">Email: <a href="mailto:sreevenkatesswaraconstructions@gmail.com" className="text-emerald">sreevenkatesswaraconstructions@gmail.com</a></p>
          <p className="text-gray-700">Website: <a href="https://www.sreevenkatesswaraconstructions.com" className="text-emerald">www.sreevenkatesswaraconstructions.com</a></p>
          <p className="text-gray-700">Address: 50-58-8, Rajendranagar, Backside of Prism College, Seethammapeta, Vishakhapatnam - 530016</p>
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

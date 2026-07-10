import { company, getCallUrl, getEmailUrl, getMapsUrl, getWhatsAppUrl } from '../lib/company'

export default function Footer(){
  return (
    <footer className="bg-emerald text-ivory mt-20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald/30 to-transparent pointer-events-none"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-16 grid gap-10 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo.jpeg" alt="Sree Venkatesswara logo" className="w-20 h-20 object-contain border border-gold/30 bg-white p-2" />
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-beige/80">Sree Venkatesswara</p>
            </div>
          </div>
          <p className="text-sm text-beige/80">Luxury construction and interior design for homes, villas and commercial spaces, anywhere.</p>
          <div className="mt-3 bg-white/5 p-3 rounded-lg inline-block">
            <p className="text-sm text-beige/90"><strong>SREE VENKATESSWARA</strong></p>
            <p className="text-sm text-beige/90">CONSTRUCTIONS & INTERIORS</p>
            <p className="text-sm text-beige/90">Phone: <a href={getCallUrl(company.primaryPhone)} className="hover:text-white">{company.primaryPhone}</a> &nbsp;|&nbsp; <a href={getCallUrl(company.secondaryPhone)} className="hover:text-white">{company.secondaryPhone}</a></p>
            <p className="text-sm text-beige/90">Email: <a href={getEmailUrl(company.email)} className="hover:text-white">{company.email}</a></p>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-beige/80 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm text-beige/90">
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="/about" className="hover:text-white">About Us</a></li>
            <li><a href="/services" className="hover:text-white">Services</a></li>
            <li><a href="/projects" className="hover:text-white">Projects</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-beige/80 mb-4">Services</h3>
          <ul className="space-y-3 text-sm text-beige/90">
            <li><a href="/services#construction" className="hover:text-white">Construction</a></li>
            <li><a href="/services#interiors" className="hover:text-white">Interiors</a></li>
            <li><a href="/services#renovation" className="hover:text-white">Renovation</a></li>
            <li><a href="/services#civil-works" className="hover:text-white">Civil Works</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-beige/80 mb-4">Contact</h3>
          <p className="text-sm text-beige/90">Phone: <a href={getCallUrl(company.primaryPhone)} className="hover:text-white">{company.primaryPhone}</a> &nbsp;|&nbsp; <a href={getCallUrl(company.secondaryPhone)} className="hover:text-white">{company.secondaryPhone}</a></p>
          <p className="text-sm text-beige/90">Email: <a href={getEmailUrl(company.email)} className="hover:text-white">{company.email}</a></p>
          <p className="text-sm text-beige/90">Address: {company.address}</p>
          <p className="text-sm text-beige/90 mt-2">Website: <a href={company.website} className="hover:text-white">{company.website.replace('https://www.', '')}</a></p>
          <div className="mt-4 flex items-center gap-3">
            <a href={company.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald/20 py-6 text-center text-sm text-beige/80">© {new Date().getFullYear()} Sree Venkatesswara Constructions & Interiors. All rights reserved.</div>
    </footer>
  )
}

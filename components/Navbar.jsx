import { useEffect, useState } from 'react'
import Link from 'next/link'
import { company, getCallUrl, getWhatsAppUrl } from '../lib/company'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/why-us', label: 'Why Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' }
]

export default function Navbar(){
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-ivory/90 shadow-xl border-b border-emerald/10 backdrop-blur' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/logo.jpeg" alt="Sree Venkatesswara logo" className="w-12 h-12 object-contain border border-gold/30 bg-white p-1" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600">Sree Venkatesswara</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500 mt-1">Constructions & Interiors</p>
          </div>
          </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="relative transition text-gray-800 hover:text-emerald after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href={getCallUrl(company.primaryPhone)} className="px-4 py-2 border border-emerald text-emerald rounded-xl text-sm">Call</a>
          <a href={getWhatsAppUrl(company.whatsapp)} target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald text-white rounded-xl text-sm">WhatsApp</a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-3 bg-ivory/90 rounded-full border border-emerald/20 text-emerald shadow-sm">
          <span className="sr-only">Toggle menu</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={open ? 'M18 6L6 18M6 6l12 12' : 'M3 12h18M3 6h18M3 18h18'} />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ivory/95 border-t border-emerald/10 px-6 pb-6">
          <div className="flex flex-col gap-4 py-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-gray-800 font-medium" onClick={() => setOpen(false)}>{link.label}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <a href={getCallUrl(company.primaryPhone)} className="px-4 py-3 border border-emerald text-emerald rounded-xl text-center">Call</a>
            <a href={getWhatsAppUrl(company.whatsapp)} target="_blank" rel="noreferrer" className="px-4 py-3 bg-emerald text-white rounded-xl text-center">WhatsApp</a>
          </div>
        </div>
      )}
    </header>
  )
}

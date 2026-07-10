import Link from 'next/link'
import { motion } from 'framer-motion'

const icons = [
  { label: 'Lord Venkateswara', position: 'left', symbol: 'ॐ' },
  { label: 'Vinayaka', position: 'center', symbol: '𑀯' },
  { label: 'Lakshmi Devi', position: 'right', symbol: 'ॐ' }
]

export default function Hero(){
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(207,168,75,0.16),_transparent_35%),linear-gradient(180deg,#fffaf0_0%,#efe6dd_35%,#004d40_100%)]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80')] bg-center bg-cover opacity-30"></div>
      <div className="absolute inset-0 bg-emerald/10 backdrop-blur-sm"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-8 text-center lg:text-left">
            <p className="inline-flex items-center gap-3 rounded-full border border-gold/40 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.35em] text-gold shadow-sm">Building Dreams. Creating Spaces.</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-emerald leading-tight">We Build More Than Structures — We Build Trust.</h1>
            <p className="max-w-2xl text-lg text-gray-700/90">Sree Venkatesswara Constructions & Interiors blends modern luxury architecture with South Indian elegance to deliver premium spaces, from villas to interiors, with craftsmanship that reflects trust and timeless design.</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link href="/services" className="inline-flex items-center justify-center px-6 py-3 border border-gold text-emerald bg-white/90 rounded-full font-semibold shadow-sm hover:-translate-y-0.5 transition">Our Services</Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-emerald text-white rounded-full font-semibold shadow-sm hover:-translate-y-0.5 transition">Get A Quote</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="relative rounded-[2rem] border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(207,168,75,0.18),_transparent_30%)]"></div>
            <div className="relative overflow-hidden rounded-[1.75rem] bg-emerald/5 p-6 flex items-center justify-center">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-xl p-4 flex items-center justify-center">
                <img src="/images/logo.jpeg" alt="Sree Venkatesswara logo" className="max-w-full max-h-[320px] object-contain" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

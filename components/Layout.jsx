import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import Watermark from './Watermark'

export default function Layout({ children }){
  return (
    <div className="site-watermark bg-ivory min-h-screen text-gray-900 relative overflow-hidden">
      <Watermark />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

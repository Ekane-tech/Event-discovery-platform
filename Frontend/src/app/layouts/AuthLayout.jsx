import Navbar from '../../shared/components/layout/Navbar.jsx'
import Footer from '../../shared/components/layout/Footer.jsx'
import PageOutlet from '../../shared/components/motion/PageOutlet.jsx'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageOutlet />
      <Footer />
    </div>
  )
}

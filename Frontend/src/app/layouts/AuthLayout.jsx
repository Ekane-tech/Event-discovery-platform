import { Outlet } from 'react-router-dom'
import Navbar from '../../shared/components/layout/Navbar.jsx'
import Footer from '../../shared/components/layout/Footer.jsx'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

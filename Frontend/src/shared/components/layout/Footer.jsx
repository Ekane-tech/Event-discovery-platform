import { Mail, MapPin, Phone } from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from 'react-icons/fa6'
import { Link } from 'react-router-dom'

import { APP_NAME } from '../../constants/app.js'
import LanguageSwitcher from '../language/LanguageSwitcher.jsx'

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Browse events', to: '/events' },
      { label: 'Public announcements', to: '/public-notifications' },
      { label: 'Feedback', to: '/feedback' },
    ],
  },
  {
    title: 'Events',
    links: [
      { label: 'Create account', to: '/register' },
      { label: 'Find events', to: '/events' },
      { label: 'My tickets', to: '/registrations' },
      { label: 'Categories', to: '/events' },
    ],
  },
  {
    title: 'For providers',
    links: [
      { label: 'Become a service provider', to: '/register' },
      { label: 'Organizer dashboard', to: '/organizer/dashboard' },
      { label: 'Create event', to: '/organizer/events/create' },
      { label: 'Statistics', to: '/organizer/statistics' },
    ],
  },
]

const socialLinks = [
  {
    label: 'Facebook',
    icon: FaFacebookF,
    href: '#',
  },
  {
    label: 'Instagram',
    icon: FaInstagram,
    href: '#',
  },
  {
    label: 'LinkedIn',
    icon: FaLinkedinIn,
    href: '#',
  },
  {
    label: 'X',
    icon: FaXTwitter,
    href: '#',
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <Link to="/" className="text-xl font-black text-white">
              {APP_NAME}
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Discover events, receive smart notifications, register with
              digital tickets, and manage event activity across Cameroon.
            </p>

            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-teal-600"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-white">{section.title}</h3>

                <div className="mt-4 grid gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="text-sm text-slate-300 transition hover:text-teal-300"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-bold text-white">Contact us</h3>

            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p className="flex gap-2">
                <MapPin className="h-4 w-4 text-teal-300" />
                Cameroon
              </p>

              <p className="flex gap-2">
                <Mail className="h-4 w-4 text-teal-300" />
                support@eventdiscovery.local
              </p>

              <p className="flex gap-2">
                <Phone className="h-4 w-4 text-teal-300" />
                +237 6XX XXX XXX
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <p className="mb-2 text-sm font-bold text-white">Language</p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="#" className="hover:text-teal-300">
              Terms
            </Link>
            <Link to="#" className="hover:text-teal-300">
              Privacy
            </Link>
            <Link to="#" className="hover:text-teal-300">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
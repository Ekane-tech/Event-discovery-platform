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
import { useTranslation } from '../../i18n/useTranslation.js'

export default function Footer() {
  const { t } = useTranslation()

  const footerSections = [
    {
      title: t('footer.platformTitle'),
      links: [
        { label: t('footer.aboutUs'), to: '/about' },
        { label: t('footer.browseEvents'), to: '/events' },
        { label: t('footer.publicAnnouncements'), to: '/public-notifications' },
        { label: t('footer.feedback'), to: '/feedback' },
      ],
    },
    {
      title: t('footer.eventsTitle'),
      links: [
        { label: t('footer.createAccount'), to: '/register' },
        { label: t('footer.findEvents'), to: '/events' },
        { label: t('footer.myTickets'), to: '/registrations' },
        { label: t('footer.categories'), to: '/events' },
      ],
    },
    {
      title: t('footer.providersTitle'),
      links: [
        { label: t('footer.becomeProvider'), to: '/register' },
        { label: t('footer.organizerDashboard'), to: '/organizer/dashboard' },
        { label: t('footer.createEvent'), to: '/organizer/events/create' },
        { label: t('footer.statistics'), to: '/organizer/statistics' },
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

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <Link to="/" className="text-xl font-black text-white">
              {APP_NAME}
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              {t('footer.description')}
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
            <h3 className="font-bold text-white">{t('footer.contactUs')}</h3>

            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p className="flex gap-2">
                <MapPin className="h-4 w-4 text-teal-300" />
                {t('footer.country')}
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
              <p className="mb-2 text-sm font-bold text-white">{t('language')}</p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. {t('footer.allRightsReserved')}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="#" className="hover:text-teal-300">
              {t('footer.terms')}
            </Link>
            <Link to="#" className="hover:text-teal-300">
              {t('footer.privacy')}
            </Link>
            <Link to="#" className="hover:text-teal-300">
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

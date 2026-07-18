import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { APP_NAME, APP_TAGLINE } from '../../constants/app.js'
import LanguageSwitcher from '../language/LanguageSwitcher.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'

export default function Footer() {
  const { t } = useTranslation()
  const socials = [FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter]

  const sections = [
    { title: t('footer.platformTitle'), links: [[t('footer.browseEvents'), '/events'], [t('about.badge', 'About'), '/about'], [t('publicNotifications.badge', 'Public Updates'), '/public-notifications']] },
    { title: t('footer.platformTitle', 'Account'), links: [[t('footer.createAccount'), '/register'], [t('auth.signIn'), '/login'], [t('footer.feedback', 'Feedback'), '/feedback']] },
    { title: t('footer.platformTitle', 'Support'), links: [[t('footer.terms'), '/terms-of-service'], [t('footer.privacy'), '/privacy-policy']] },
  ]


  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3 text-xl font-black text-white">
              <img src="/applogo.png" alt={APP_NAME} className="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-teal-900/40" />
              <span>{APP_NAME}</span>
            </Link>
            <p className="mt-3 text-sm font-semibold text-teal-200">{APP_TAGLINE}</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Discover Mboa experiences, receive smart notifications, register with digital tickets, and manage event activity across Cameroon.</p>
            <div className="mt-5 flex gap-2">
              {socials.map((Icon, index) => <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-teal-600"><Icon className="h-4 w-4" /></span>)}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {sections.map((section, index) => (
              // L'index garantit l'unicité de la clé même si deux titres sont identiques
              <div key={`${section.title}-${index}`}>
                <h3 className="font-bold text-white">{section.title}</h3>
                <div className="mt-4 grid gap-3">
                  {section.links.map(([label, to]) => to.startsWith('http')
                    ? <a key={label} href={to} target="_blank" rel="noreferrer" className="text-sm text-slate-300 hover:text-teal-300">{label}</a>
                    : <Link key={label} to={to} className="text-sm text-slate-300 hover:text-teal-300">{label}</Link>)}
                </div>
              </div>
            ))}
          </div>


          <div>
            <h3 className="font-bold text-white">Contact us</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p className="flex gap-2"><MapPin className="h-4 w-4 text-teal-300" /> Cameroon</p>
              <p className="flex gap-2"><Mail className="h-4 w-4 text-teal-300" /> support@mboaevents237.cm</p>
              <p className="flex gap-2"><Phone className="h-4 w-4 text-teal-300" /> +237 6XX XXX XXX</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <div className="flex gap-4"><Link to="/terms-of-service" className="hover:text-teal-300">Terms</Link><Link to="/privacy-policy" className="hover:text-teal-300">Privacy</Link><span>Cookies</span></div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}

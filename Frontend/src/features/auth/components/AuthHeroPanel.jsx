import { BellRing, CalendarCheck, Users } from 'lucide-react'
import { APP_NAME } from '../../../shared/constants/app.js'

export default function AuthHeroPanel() {
  const features = [
    { icon: Users, title: 'Personalized discovery', text: 'Find events based on interests and location.' },
    { icon: BellRing, title: 'Smart notifications', text: 'Receive useful alerts when events match your preferences.' },
    { icon: CalendarCheck, title: 'Tickets', text: 'Register and keep your tickets in one place.' },
    { icon: Users, title: 'Organizer tools', text: 'Create events and monitor statistics.' },
  ]

  return (
    <aside className="hidden min-h-screen bg-cover bg-center p-6 text-white lg:flex lg:flex-col lg:justify-between" style={{ backgroundImage: 'linear-gradient(160deg, rgba(15,118,110,.96), rgba(15,23,42,.78)), url(/hero-events.svg)' }}>
      <div>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black shadow-lg">E</div>
        <h2 className="mt-6 max-w-md text-3xl font-bold leading-tight">Welcome to {APP_NAME}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-teal-50">Your gateway to Cameroon’s events. Discover, manage tickets, and grow event communities across Cameroon.</p>
      </div>
      <div className="mt-6 grid gap-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return <div key={feature.title} className="rounded-3xl bg-white/10 p-4 backdrop-blur"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Icon className="h-5 w-5" /></div><div><h3 className="font-bold">{feature.title}</h3><p className="mt-1 text-sm leading-6 text-teal-50">{feature.text}</p></div></div></div>
        })}
      </div>
      <p className="mt-6 text-sm text-teal-100">Secure access • Personalized events • Smart alerts</p>
    </aside>
  )
}

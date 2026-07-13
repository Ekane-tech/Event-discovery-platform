import { Bookmark, Eye, Ticket } from 'lucide-react'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function EventStatsPanel({ event }) {
  const { t } = useTranslation()
  const stats = [
    { label: t('events.stats.views'), value: event.views || 0, icon: Eye },
    { label: t('events.stats.registrations'), value: event.registrations || 0, icon: Ticket },
    { label: t('events.stats.bookmarks'), value: event.bookmarks || 0, icon: Bookmark },
  ]

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
            <span><span className="block text-lg font-black text-slate-950">{stat.value}</span><span className="text-xs font-medium text-slate-500">{stat.label}</span></span>
          </div>
        )
      })}
    </div>
  )
}

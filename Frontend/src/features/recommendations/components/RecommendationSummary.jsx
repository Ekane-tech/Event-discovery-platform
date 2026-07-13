import { Activity, MapPin, Sparkles, Target } from 'lucide-react'
import { StatGridSkeleton } from '../../../shared/components/feedback/StatCardSkeleton.jsx'

export default function RecommendationSummary({ summary, loading = false }) {
  if (loading) return <StatGridSkeleton count={4} />

  const cards = [
    { label: 'Recommended events', value: summary.total || 0, icon: Sparkles, gradient: 'from-teal-600 to-emerald-700' },
    { label: 'Interest-based', value: summary.interestBased || 0, icon: Target, gradient: 'from-pink-600 to-rose-700' },
    { label: 'Location-based', value: summary.locationBased || 0, icon: MapPin, gradient: 'from-blue-600 to-indigo-700' },
    { label: 'Activity-based', value: summary.activityBased || 0, icon: Activity, gradient: 'from-amber-500 to-orange-700' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}>
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
            <div className="relative flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Icon className="h-5 w-5" /></span>
              <span className="text-3xl font-black">{card.value}</span>
            </div>
            <p className="relative mt-5 text-sm font-bold text-white/90">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}

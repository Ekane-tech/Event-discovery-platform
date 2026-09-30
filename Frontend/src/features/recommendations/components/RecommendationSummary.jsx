import { Activity, MapPin, Target } from 'lucide-react'
import { StatGridSkeleton } from '../../../shared/components/feedback/StatCardSkeleton.jsx'
import MetricCard from '../../../shared/components/ui/MetricCard.jsx'

export default function RecommendationSummary({ summary, loading = false }) {
  if (loading) return <StatGridSkeleton count={4} />

  const cards = [
    { label: 'Recommended events', value: summary.total || 0, icon: Target },
    { label: 'Interest-based', value: summary.interestBased || 0, icon: Target },
    { label: 'Location-based', value: summary.locationBased || 0, icon: MapPin },
    { label: 'Activity-based', value: summary.activityBased || 0, icon: Activity },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => <MetricCard key={card.label} {...card} />)}
    </div>
  )
}

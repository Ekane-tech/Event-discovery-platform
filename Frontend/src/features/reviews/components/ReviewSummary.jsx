import { Star } from 'lucide-react'
import StarRating from './StarRating.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ReviewSummary({ summary }) {
  const { t } = useTranslation()
  const average = summary?.average_rating ?? null
  const count = summary?.reviews_count ?? 0
  const distribution = summary?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  if (!count) {
    return <p className="text-sm text-slate-500">{t('reviews.noReviews', 'No reviews yet')}</p>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-5xl font-black text-slate-950">{Number(average).toFixed(1)}</span>
        <div className="mt-1">
          <StarRating value={Math.round(average)} readOnly size="sm" />
        </div>
        <span className="mt-1 text-xs text-slate-500">{t('reviews.basedOn', { count, defaultValue: 'Based on {{count}} reviews' })}</span>
      </div>

      <div className="grid gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const starCount = Number(distribution[star] || 0)
          const pct = count ? Math.round((starCount / count) * 100) : 0
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="flex w-10 items-center gap-1 tabular-nums">
                {star}
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums">{starCount}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

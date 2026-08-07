import { Link } from 'react-router-dom'

/**
 * Unified metric card for dashboards.
 *
 * One accent, one shape, everywhere: white surface, subtle border, small
 * brand-tinted icon chip, uppercase label + big value. No per-card
 * gradients, no rainbow — dashboards stay calm and scannable.
 */
export default function MetricCard({ label, value, icon: Icon, to, description, className = '' }) {
  const content = (
    <div className={`h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{value}</p>
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {description && <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>}
    </div>
  )

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  )
}

export default function RecommendationReasons({ reasons = [] }) {
  if (reasons.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {reasons.slice(0, 3).map((reason) => (
        <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{reason}</span>
      ))}
    </div>
  )
}

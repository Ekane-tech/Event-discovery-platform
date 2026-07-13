export default function RecommendationScoreBadge({ score = 0 }) {
  const color = score >= 80
    ? 'bg-green-100 text-green-800'
    : score >= 50
      ? 'bg-blue-100 text-blue-800'
      : 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${color}`}>
      {score}% match
    </span>
  )
}
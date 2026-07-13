export default function EmptyState({ title = 'Nothing here yet', message = 'Content will appear here when available.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{message}</p>
    </div>
  )
}

export default function AdminMetricCard({ label, value, icon: Icon, gradient = 'from-indigo-600 to-blue-700', description }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <div className="relative flex items-center justify-between">
        {Icon && <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Icon className="h-5 w-5" /></span>}
        <span className="text-2xl font-black md:text-3xl">{value}</span>
      </div>
      <p className="relative mt-5 text-sm font-bold text-white/90">{label}</p>
      {description && <p className="relative mt-1 text-xs text-white/75">{description}</p>}
    </div>
  )
}

export default function AdminHero({ eyebrow = 'Admin console', title, description, action }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{eyebrow}</span>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export default function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

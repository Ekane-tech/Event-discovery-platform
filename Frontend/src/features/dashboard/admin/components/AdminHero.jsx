export default function AdminHero({ eyebrow = 'Admin console', title, description, action }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.92), rgba(79,70,229,.62)), url(/hero-events.svg)' }}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100 backdrop-blur">{eyebrow}</span>
          <h1 className="mt-5 text-4xl font-black md:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-slate-200">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </section>
  )
}

export default function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-pink-600">{eyebrow}</p>}
      <h1 className="text-2xl font-black text-slate-950 md:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      <div className="mt-5">{children}</div>
      {footer && <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">{footer}</div>}
    </div>
  )
}

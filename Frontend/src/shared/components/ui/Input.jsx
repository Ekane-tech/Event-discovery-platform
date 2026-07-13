export default function Input({ className = '', ...props }) {
  return <input className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 ${className}`} {...props} />
}

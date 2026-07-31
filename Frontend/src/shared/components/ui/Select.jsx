export default function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

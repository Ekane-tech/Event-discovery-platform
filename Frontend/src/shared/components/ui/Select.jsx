export default function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export default function Badge({ children, className = '' }) {
  return <span className={`inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ${className}`}>{children}</span>
}

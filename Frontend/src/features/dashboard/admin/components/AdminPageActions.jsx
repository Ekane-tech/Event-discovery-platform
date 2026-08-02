import Button from '../../../shared/components/ui/Button.jsx'

export default function AdminPageActions({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function AdminActionButton({ children, variant = 'admin', ...props }) {
  return <Button type="button" variant={variant} className="px-3 py-1 text-sm" {...props}>{children}</Button>
}
export default function AdminStatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    published: 'bg-green-100 text-green-800',
    resolved: 'bg-green-100 text-green-800',
    sent: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    open: 'bg-red-100 text-red-800',
    flagged: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-red-100 text-red-800',
    disabled: 'bg-slate-100 text-slate-700',
    draft: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status] || styles.draft}`}>
      {String(status || 'draft').replace('_', ' ')}
    </span>
  )
}
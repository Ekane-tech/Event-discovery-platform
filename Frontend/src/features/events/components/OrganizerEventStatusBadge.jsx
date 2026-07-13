export default function OrganizerEventStatusBadge({ status }) {
  const styles = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status] || styles.draft}`}>
      {status || 'draft'}
    </span>
  )
}
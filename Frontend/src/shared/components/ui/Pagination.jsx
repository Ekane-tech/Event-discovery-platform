import Button from './Button.jsx'

export default function Pagination({ page = 1, totalPages = 1, onPrevious, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" onClick={onPrevious} disabled={page <= 1}>Previous</Button>
      <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
      <Button variant="secondary" onClick={onNext} disabled={page >= totalPages}>Next</Button>
    </div>
  )
}

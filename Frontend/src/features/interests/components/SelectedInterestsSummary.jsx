import Badge from '../../../shared/components/ui/Badge.jsx'

export default function SelectedInterestsSummary({ selectedInterests = [] }) {
  if (selectedInterests.length === 0) {
    return <p className="text-sm text-slate-600">No interests selected yet.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedInterests.map((interest) => <Badge key={interest.id}>{interest.name}</Badge>)}
    </div>
  )
}
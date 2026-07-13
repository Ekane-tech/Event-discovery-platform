export default function SearchResultsHeader({ totalResults = 0, totalEvents = 0 }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Search results</h2>
        <p className="text-sm text-slate-600">
          Showing {totalResults} of {totalEvents} event{totalEvents === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  )
}

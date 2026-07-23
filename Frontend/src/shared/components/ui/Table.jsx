export default function Table({ columns = [], rows = [] }) {
  return (
    <>
      {/* Desktop / tablet: classic table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || index} className="border-t border-slate-100">
                {columns.map((column) => <td key={column.key} className="px-4 py-3 align-top">{row[column.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards (no horizontal scroll) */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => (
          <div key={row.id || index} className="rounded-2xl border border-slate-200 bg-white p-4">
            {columns.map((column) => column.label ? (
              <div key={column.key} className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{column.label}</span>
                <span className="text-right text-sm text-slate-800">{row[column.key]}</span>
              </div>
            ) : (
              <div key={column.key} className="flex flex-wrap items-center justify-end gap-1.5 pt-2">{row[column.key]}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

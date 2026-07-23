import { useEffect, useState } from 'react'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'

/**
 * Data table with a user-controlled view toggle (Table <-> Grid), regardless of
 * device size. Defaults to Grid on phones and Table on larger screens, remembers
 * the choice in localStorage. Empty-label columns (e.g. row actions) render
 * full-width at the bottom of each grid card.
 */
export default function Table({ columns = [], rows = [], storageKey = 'tableView' }) {
  const [view, setView] = useState(() => {
    if (typeof window === 'undefined') return 'table'
    const saved = window.localStorage.getItem(storageKey)
    if (saved === 'table' || saved === 'grid') return saved
    return window.matchMedia('(max-width: 767px)').matches ? 'grid' : 'table'
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, view)
  }, [view, storageKey])

  const toggle = (
    <div className="mb-3 flex justify-end gap-1" role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => setView('table')}
        aria-pressed={view === 'table'}
        title="Table view"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${view === 'table' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
      >
        <TableIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setView('grid')}
        aria-pressed={view === 'grid'}
        title="Grid view"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${view === 'grid' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  )

  const tableView = (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
  )

  const gridView = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
  )

  return (
    <>
      {toggle}
      {view === 'table' ? tableView : gridView}
    </>
  )
}

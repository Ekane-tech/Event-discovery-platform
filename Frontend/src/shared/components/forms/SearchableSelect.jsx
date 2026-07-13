import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function SearchableSelect({ label, value, onChange, options = [], placeholder = 'Select option', searchPlaceholder = 'Type to search...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => String(option.value) === String(value))
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options.slice(0, 80)
    return options.filter((option) => option.label.toLowerCase().includes(term)).slice(0, 80)
  }, [options, query])

  function selectOption(option) {
    onChange(option.value)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      {label && <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>}
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-teal-300 hover:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>{selected?.label || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder={searchPlaceholder} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
          </div>
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 ? <div className="rounded-xl px-3 py-2 text-sm text-slate-500">No matches found</div> : filtered.map((option) => <button key={option.value} type="button" onClick={() => selectOption(option)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-teal-50 ${String(option.value) === String(value) ? 'bg-teal-50 font-bold text-teal-700' : 'text-slate-700'}`}>{option.label}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}

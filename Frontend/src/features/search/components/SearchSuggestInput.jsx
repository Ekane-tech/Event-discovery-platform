import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Input from '../../../shared/components/ui/Input.jsx'

export default function SearchSuggestInput({ label, placeholder, value, onChange, suggestions = [] }) {
  const [focused, setFocused] = useState(false)
  const query = String(value || '').trim().toLowerCase()

  const matches = useMemo(() => {
    if (!query) return suggestions.slice(0, 6)
    return suggestions
      .filter((item) => item.label.toLowerCase().includes(query))
      .slice(0, 6)
  }, [query, suggestions])

  const showDropdown = focused && value

  function selectSuggestion(suggestion) {
    onChange(suggestion.label)
    setFocused(false)
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-slate-800">{label}</label>
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="h-12 pr-10"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl">
          {matches.length === 0 ? (
            <div className="rounded-lg px-3 py-2 text-sm text-slate-500">No matches found</div>
          ) : (
            matches.map((suggestion) => (
              <button
                key={`${suggestion.type}-${suggestion.id}-${suggestion.label}`}
                type="button"
                onMouseDown={() => selectSuggestion(suggestion)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-teal-50"
              >
                <span className="font-medium text-slate-800">{suggestion.label}</span>
                <span className="text-xs capitalize text-slate-400">{suggestion.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

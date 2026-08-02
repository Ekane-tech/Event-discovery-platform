import { CalendarSearch, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function CustomSelect({ label, value, onChange, options = [], className = '', icon: Icon = CalendarSearch }) {
  const [open, setOpen] = useState(false)
  const selectRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  function handleSelect(optionValue) {
    onChange(optionValue)
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={selectRef}>
      {label && <label className="mb-2 block text-sm font-bold text-slate-800">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 py-3 text-left outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 flex items-center justify-between"
        >
          <span className="text-slate-800">{selectedOption?.label || options[0]?.label || 'Select...'}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {Icon && !label && <Icon className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      </div>

      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 text-left shadow-xl ring-1 ring-slate-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-teal-50 hover:shadow-sm ${value === option.value ? 'bg-teal-50' : ''}`}
            >
              <span className="font-medium text-slate-800">{option.label}</span>
              {value === option.value && <ChevronDown className="h-4 w-4 text-teal-600 rotate-180" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

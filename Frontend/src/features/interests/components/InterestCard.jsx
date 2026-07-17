import { Check } from 'lucide-react'

export default function InterestCard({ interest, selected = false, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(interest.id)}
      className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        selected
          ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-100'
          : 'border-slate-200 bg-white hover:border-teal-200'
      }`}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-100 opacity-50 transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${selected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {interest?.name ? interest.name.charAt(0).toUpperCase() : '?'}
          </span>
          <h3 className="font-black text-slate-950">{interest.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{interest.description}</p>
        </div>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${selected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 text-transparent'}`}>
          <Check className="h-4 w-4" />
        </span>
      </div>
    </button>
  )
}

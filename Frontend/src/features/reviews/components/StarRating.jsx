import { Star } from 'lucide-react'
import { useState } from 'react'

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export default function StarRating({ value = 0, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0)
  const cls = SIZES[size] || SIZES.md
  const active = readOnly ? value : hover || value

  if (readOnly) {
    return (
      <div className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${cls} ${value >= star ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(star)}
          className="transition hover:scale-110"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          role="radio"
          aria-checked={value === star}
        >
          <Star className={`${cls} transition ${active >= star ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} />
        </button>
      ))}
    </div>
  )
}

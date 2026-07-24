import { useEffect, useMemo, useState } from 'react'

function getInitials(name = 'User') {
  const cleanedName = String(name || 'User').trim()

  const initials = cleanedName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'U'
}

function hasUsableImage(src) {
  if (!src) return false
  const value = String(src).trim()
  return value && value !== 'null' && value !== 'undefined'
}

export default function Avatar({ name = 'User', src, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const initials = useMemo(() => getInitials(name), [name])
  const shouldShowImage = hasUsableImage(src) && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  if (shouldShowImage) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
        className={`flex h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      />
    )
  }

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white ring-2 ring-white ${className}`}>
      {initials}
    </div>
  )
}

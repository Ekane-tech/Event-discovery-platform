import { useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * A react-router <Link> that prefetches the destination route's chunk when the
 * user hovers/focuses/touches, so navigation feels instant (no loading spinner).
 * Pass an `importer` that dynamically imports the target page module — the
 * bundler dedupes it with the lazy route, so it warms the exact same chunk.
 */
export default function PrefetchLink({ to, importer, children, ...props }) {
  const prefetched = useRef(false)

  const prefetch = () => {
    if (prefetched.current || !importer) return
    prefetched.current = true
    importer().catch(() => {})
  }

  return (
    <Link to={to} onMouseEnter={prefetch} onTouchStart={prefetch} onFocus={prefetch} {...props}>
      {children}
    </Link>
  )
}

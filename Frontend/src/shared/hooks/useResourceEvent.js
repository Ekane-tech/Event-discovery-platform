import { useEffect } from 'react'

/**
 * Broadcast a resource-changed event so any hook listening for the same
 * event name can refresh its data (e.g. across sibling components).
 */
export function emitResourceEvent(eventName) {
  window.dispatchEvent(new CustomEvent(eventName))
}

/**
 * Subscribe to a resource-changed event dispatched via emitResourceEvent.
 * The handler is (re)registered whenever eventName, handler or enabled change,
 * and cleaned up automatically. Pass enabled=false to skip subscribing.
 */
export function useResourceEvent(eventName, handler, enabled = true) {
  useEffect(() => {
    if (!enabled || !eventName || typeof handler !== 'function') {
      return undefined
    }

    window.addEventListener(eventName, handler)
    return () => window.removeEventListener(eventName, handler)
  }, [eventName, handler, enabled])
}

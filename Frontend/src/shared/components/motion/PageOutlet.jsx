import { Outlet } from 'react-router-dom'

/**
 * Drop-in replacement for <Outlet />.
 *
 * Note: an earlier version faded the whole page in from a blank screen on every
 * navigation (keyed motion.div). That made route changes — e.g. clicking Search
 * or Home — look like a full page reload (blank flash). Navigation is now instant
 * and smooth. Per-element entrance animations (staggered grids, section reveals,
 * hero) still run, so pages still feel alive without the "refresh" look.
 */
export default function PageOutlet() {
  return <Outlet />
}

import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { EASE } from './variants.js'

/**
 * Drop-in replacement for <Outlet /> that gives every routed page a subtle
 * fade + slide-up entrance on navigation. Keyed by pathname so each route
 * re-animates; query-param changes (filters) do NOT re-trigger.
 */
export default function PageOutlet() {
  const { pathname } = useLocation()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <Outlet />
    </motion.div>
  )
}

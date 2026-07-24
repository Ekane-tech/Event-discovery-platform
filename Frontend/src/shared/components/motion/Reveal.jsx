import { motion } from 'framer-motion'
import { EASE } from './variants.js'

/**
 * Reveal children with a gentle fade + slide-up when scrolled into view.
 * Subtle, one-shot, and respects prefers-reduced-motion (via MotionConfig).
 */
export default function Reveal({ children, delay = 0, y = 18, className, amount = 0.2, once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

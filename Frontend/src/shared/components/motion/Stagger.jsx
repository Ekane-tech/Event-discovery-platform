import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from './variants.js'

/** Container that staggers its <StaggerItem> children into view. */
export function Stagger({ children, className, amount = 0.1, once = true }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  )
}

/** A single item inside a <Stagger> — fades/slides up in sequence. */
export function StaggerItem({ children, className }) {
  return <motion.div className={className} variants={fadeUp}>{children}</motion.div>
}

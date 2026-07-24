import { motion } from 'framer-motion'
import { EASE } from '../../components/motion/variants.js'

export default function SectionHeader({ title, description, action }) {
  return (
    <motion.div
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  )
}

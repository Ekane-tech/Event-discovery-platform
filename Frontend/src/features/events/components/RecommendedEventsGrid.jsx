import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '../../../shared/components/motion/variants.js'
import RecommendedEventCard from './RecommendedEventCard.jsx'

export default function RecommendedEventsGrid({ events = [] }) {
  return (
    <motion.div
      className="grid gap-5 max-sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
    >
      {events.map((event) => (
        <motion.div key={event.id} variants={fadeUp}>
          <RecommendedEventCard event={event} />
        </motion.div>
      ))}
    </motion.div>
  )
}

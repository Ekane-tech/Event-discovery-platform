import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '../../../shared/components/motion/variants.js'
import EventCard from './EventCard.jsx'

export default function EventGrid({ events = [] }) {
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
          <EventCard event={event} />
        </motion.div>
      ))}
    </motion.div>
  )
}

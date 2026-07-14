import EventCard from './EventCard.jsx'

export default function EventGrid({ events = [] }) {
  return (
    <div className="grid gap-5 max-sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => <EventCard key={event.id} event={event} />)}
    </div>
  )
}

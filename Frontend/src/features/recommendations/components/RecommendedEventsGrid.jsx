import RecommendedEventCard from './RecommendedEventCard.jsx'

export default function RecommendedEventsGrid({ events = [] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => <RecommendedEventCard key={event.id} event={event} />)}
    </div>
  )
}
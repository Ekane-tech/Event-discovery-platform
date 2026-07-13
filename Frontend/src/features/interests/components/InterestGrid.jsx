import InterestCard from './InterestCard.jsx'

export default function InterestGrid({ interests = [], selectedInterestIds = [], onToggle }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {interests.map((interest) => (
        <InterestCard
          key={interest.id}
          interest={interest}
          selected={selectedInterestIds.includes(interest.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import { EventGridSkeleton } from '../../events/components/EventCardSkeleton.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useInterests } from '../../interests/hooks/useInterests.js'
import RecommendedEventsGrid from '../components/RecommendedEventsGrid.jsx'
import RecommendationSummary from '../components/RecommendationSummary.jsx'
import { useRecommendations } from '../hooks/useRecommendations.js'

export default function RecommendedEventsPage() {
  const { selectedCount } = useInterests()
  const { recommendations, recommendationSummary, loading, error } = useRecommendations()

  return (
    <div>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.88), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">Personalized discovery</span>
        <h1 className="mt-5 max-w-3xl text-4xl font-black md:text-5xl">Recommended events</h1>
        <p className="mt-4 max-w-2xl text-slate-200">Events selected from your interests, location, saved activity, registrations and popularity signals.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/events"><Button variant="light">Browse Events</Button></Link><Link to="/interests"><Button className="bg-teal-500 text-white hover:bg-teal-600">Update Interests</Button></Link></div>
      </section>

      <PageContainer>
        <RecommendationSummary summary={recommendationSummary} loading={loading} />
        {selectedCount === 0 && <div className="mt-6"><Alert type="info">Select interests to improve the quality of your recommendations.</Alert></div>}
        <section className="mt-8">
          {loading && <EventGridSkeleton count={6} />}
          {error && <ErrorState title="Unable to load recommendations" message={error} />}
          {!loading && !error && recommendations.length === 0 && <EmptyState title="No recommendations yet" message="Choose interests, bookmark events, or register for events to improve your recommendations." />}
          {!loading && !error && recommendations.length > 0 && <RecommendedEventsGrid events={recommendations} />}
        </section>
      </PageContainer>
    </div>
  )
}

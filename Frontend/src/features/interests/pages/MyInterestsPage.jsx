import { Heart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SelectedInterestsSummary from '../components/SelectedInterestsSummary.jsx'
import { useInterests } from '../hooks/useInterests.js'

export default function MyInterestsPage() {
  const { selectedInterests, selectedCount, loading, error } = useInterests()
  if (loading) return <PageContainer><Loader message="Loading your interests..." /></PageContainer>

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-pink-600 to-teal-700 p-8 text-white">
        <Heart className="h-10 w-10 text-pink-100" />
        <h1 className="mt-5 text-4xl font-black">My interests</h1>
        <p className="mt-3 max-w-2xl text-white/90">Your selected interests power recommendations, notifications, and event discovery.</p>
      </section>
      {error && <div className="my-6"><Alert type="error">{error}</Alert></div>}
      <div className="mt-6">
        {selectedCount === 0 ? <EmptyState title="No interests selected" message="Choose interests like Technology, Business, Music, Sports, or Culture to personalize your experience." /> : <Card><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="flex items-center gap-2 font-black text-slate-950"><Sparkles className="h-5 w-5 text-teal-700" /> {selectedCount} interest{selectedCount > 1 ? 's' : ''} selected</h2><div className="mt-4"><SelectedInterestsSummary selectedInterests={selectedInterests} /></div></div><Link to="/interests"><Button>Update Interests</Button></Link></div></Card>}
      </div>
    </PageContainer>
  )
}
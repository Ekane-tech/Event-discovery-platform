import { Target } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import InterestGrid from '../components/InterestGrid.jsx'
import SelectedInterestsSummary from '../components/SelectedInterestsSummary.jsx'
import { useInterests } from '../hooks/useInterests.js'

export default function ChooseInterestsPage() {
  const navigate = useNavigate()
  const { interests, selectedInterestIds, selectedInterests, selectedCount, loading, saving, saved, error, toggleInterest, clearInterests, saveInterests } = useInterests()

  async function handleSave() { await saveInterests().catch(() => {}) }
  async function handleSaveAndContinue() { try { await saveInterests(); navigate('/dashboard') } catch {} }

  if (loading) return <PageContainer><Loader message="Loading interests..." /></PageContainer>

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Target className="h-4 w-4" /> Personalization</span>
        <h1 className="mt-5 text-4xl font-black md:text-5xl">Choose your interests</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Pick the topics you care about so we can recommend better events and send more relevant alerts.</p>
      </section>

      <Card className="my-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-950">Selected interests: {selectedCount}</h2>
            <div className="mt-3"><SelectedInterestsSummary selectedInterests={selectedInterests} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={clearInterests} disabled={saving || selectedCount === 0}>Clear</Button>
            <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" onClick={handleSaveAndContinue} disabled={saving}>{saving ? 'Saving...' : 'Save & Continue'}</Button>
          </div>
        </div>
      </Card>

      {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}
      {saved && <div className="mb-6"><Alert type="success">Your interests have been saved successfully.</Alert></div>}
      {selectedCount === 0 && <div className="mb-6"><Alert type="info">Choose interests to improve your recommendations and notifications.</Alert></div>}
      <InterestGrid interests={interests} selectedInterestIds={selectedInterestIds} onToggle={toggleInterest} />
      <div className="mt-8 flex justify-end"><Link to="/dashboard" className="text-sm font-bold text-teal-700 hover:text-teal-800">Skip for now</Link></div>
    </PageContainer>
  )
}

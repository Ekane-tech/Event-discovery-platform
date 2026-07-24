import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SelectedInterestsSummary from '../components/SelectedInterestsSummary.jsx'
import { useInterests } from '../hooks/useInterests.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function MyInterestsPage() {
  const { t } = useTranslation()
  const { selectedInterests, selectedCount, loading, error } = useInterests()
  if (loading) return <PageContainer><Loader message={t('interests.loading', 'Loading your interests...')} /></PageContainer>

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-pink-600 to-teal-700 p-8 text-white">
        <Heart className="h-10 w-10 text-pink-100" />
        <h1 className="mt-5 text-4xl font-black">{t('interests.title', 'My interests')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('interests.subtitle', 'Your selected interests power recommendations, notifications, and event discovery.')}</p>
        {selectedCount === 0 && <Link to="/interests" className="mt-4 inline-block"><Button>{t('interests.choose', 'Choose Interests')}</Button></Link>}
      </section>
      {error && <div className="my-6"><Alert type="error">{error}</Alert></div>}
      <div className="mt-6">
        {selectedCount === 0 ? <EmptyState title={t('interests.emptyTitle', 'No interests selected')} message={t('interests.emptyMessage', 'Choose interests like Technology, Business, Music, Sports, or Culture to personalize your experience.')} action={<Link to="/interests"><Button>{t('interests.choose', 'Choose Interests')}</Button></Link>} /> : <Card><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="flex items-center gap-2 font-black text-slate-950">{t('interests.countSelected', { count: selectedCount, defaultValue: '{{count}} interests selected' })}</h2><div className="mt-4"><SelectedInterestsSummary selectedInterests={selectedInterests} /></div></div><Link to="/interests"><Button>{t('interests.update', 'Update Interests')}</Button></Link></div></Card>}
      </div>
    </PageContainer>
  )
}

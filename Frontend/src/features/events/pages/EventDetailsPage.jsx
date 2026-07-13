import { CalendarDays, MapPin, Share2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Badge from '../../../shared/components/ui/Badge.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import EventActionPanel from '../components/EventActionPanel.jsx'
import EventStatsPanel from '../components/EventStatsPanel.jsx'
import { eventService } from '../services/eventService.js'
import { normalizeEvent } from '../utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function EventDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const previousSearchPath = location.state?.from
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true)
      setError('')
      try {
        const response = await eventService.getEvent(id)
        setEvent(normalizeEvent(response.data.event))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, t('events.details.loadFailed')))
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id, t])

  function goBackToResults() {
    if (previousSearchPath) return navigate(previousSearchPath)
    navigate('/events')
  }

  if (loading) return <PageContainer><Loader message={t('events.details.loadingMessage')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('events.details.loadErrorTitle')} message={error} /></PageContainer>
  if (!event) return <PageContainer><EmptyState title={t('events.details.notFoundTitle')} message={t('events.details.notFoundMessage')} /></PageContainer>

  const cover = event.coverImage?.url || '/hero-events.svg'

  return (
    <div>
      <section className="relative min-h-[460px] overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${cover})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        <div className="relative mx-auto flex min-h-[460px] max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackToResults}>{t('events.details.backToResults')}</Button>
            <Link to="/events" className="text-sm font-semibold text-slate-100 hover:text-teal-200">{t('events.details.browseAllEvents')}</Link>
          </div>
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white backdrop-blur">{event.category || t('event.defaultCategory')}</Badge>
              <Badge className="bg-teal-500 text-white">{formatPrice(event.price)}</Badge>
              <Badge className="bg-white/15 text-white capitalize backdrop-blur">{event.status}</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{event.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{event.description}</p>
          </div>
        </div>
      </section>

      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-6">
            <Card>
              <h2 className="text-xl font-bold text-slate-950">{t('events.details.informationHeading')}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="flex gap-3 text-slate-700"><MapPin className="h-5 w-5 text-teal-700" /><span><strong>{t('events.details.venueLabel')}:</strong><br />{event.venue || t('events.details.notSpecified')}</span></p>
                <p className="flex gap-3 text-slate-700"><MapPin className="h-5 w-5 text-teal-700" /><span><strong>{t('events.details.locationLabel')}:</strong><br />{event.city}, {event.region}</span></p>
                <p className="flex gap-3 text-slate-700"><CalendarDays className="h-5 w-5 text-teal-700" /><span><strong>{t('events.details.dateLabel')}:</strong><br />{formatDate(event.startDate)}</span></p>
                <p className="flex gap-3 text-slate-700"><Users className="h-5 w-5 text-teal-700" /><span><strong>{t('events.details.capacityLabel')}:</strong><br />{event.maximumParticipants || t('events.details.notLimited')}</span></p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2"><Button variant="secondary"><Share2 className="mr-2 h-4 w-4" />{t('events.details.shareEvent')}</Button></div>
            </Card>

            {event.images?.filter((image) => !image.isCover).length > 0 && (
              <Card>
                <h2 className="mb-4 text-xl font-bold text-slate-950">{t('events.details.galleryTitle')}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {event.images.filter((image) => !image.isCover).map((image) => <img key={image.id} src={image.url} alt={event.title} className="h-44 w-full rounded-2xl object-cover" />)}
                </div>
              </Card>
            )}
            <EventStatsPanel event={event} />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start"><EventActionPanel event={event} /></div>
        </div>
      </PageContainer>
    </div>
  )
}

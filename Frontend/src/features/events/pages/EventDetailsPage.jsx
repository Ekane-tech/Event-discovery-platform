import { CalendarDays, ChevronLeft, ChevronRight, Images, MapPin, Navigation, Share2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Badge from '../../../shared/components/ui/Badge.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import LocationMap from '../../../shared/components/map/LocationMap.jsx'
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

function getVisibleImages(images, start, count) {
  if (!images.length) return []
  return Array.from({ length: Math.min(count, images.length) }, (_, offset) => images[(start + offset) % images.length])
}

export default function EventDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const previousSearchPath = location.state?.from
  const [event, setEvent] = useState(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

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

  const heroImages = useMemo(() => {
    if (!event) return []
    const images = event.images?.length ? event.images : []
    if (images.length) return images
    return [{ id: 'fallback', url: event.coverImage?.url || event.categoryImageUrl || '/hero-events.svg', isCover: true }]
  }, [event])

  const galleryImages = useMemo(() => event?.images?.filter((image) => !image.isCover) || [], [event])

  useEffect(() => {
    if (heroImages.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [heroImages.length])

  function goBackToResults() {
    if (previousSearchPath) return navigate(previousSearchPath)
    navigate('/events')
  }

  function moveHero(direction) {
    setHeroIndex((current) => (current + direction + heroImages.length) % heroImages.length)
  }

  function moveGallery(direction) {
    setGalleryIndex((current) => (current + direction + galleryImages.length) % galleryImages.length)
  }

  function handleTouchStart(e) {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  function handleTouchMove(e) {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  function handleTouchEnd() {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      moveHero(1)
    }
    if (isRightSwipe) {
      moveHero(-1)
    }
  }

  async function shareEvent() {
    const shareUrl = `${window.location.origin}/events/${event.id}`
    const shareData = {
      title: event.title,
      text: t('events.details.shareText', { title: event.title }),
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t('events.details.shareCopied'))
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') toast.error(t('events.details.shareFailed'))
    }
  }

  if (loading) return <PageContainer><Loader message={t('events.details.loadingMessage')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('events.details.loadErrorTitle')} message={error} /></PageContainer>
  if (!event) return <PageContainer><EmptyState title={t('events.details.notFoundTitle')} message={t('events.details.notFoundMessage')} /></PageContainer>

  const activeHero = heroImages[heroIndex] || heroImages[0]
  const visibleGalleryMobile = getVisibleImages(galleryImages, galleryIndex, 4)
  const visibleGalleryDesktop = getVisibleImages(galleryImages, galleryIndex, 3)

  return (
    <div>
      <section 
        className="relative min-h-135 overflow-hidden bg-slate-950 text-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div key={activeHero?.id || activeHero?.url} className="absolute inset-0 animate-[fadeIn_.7s_ease-out]">
          <img src={activeHero?.url} alt={event.title} className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(20,184,166,.15),transparent_34%)]" />

        {heroImages.length > 1 && (
          <div className="absolute inset-x-4 top-1/2 z-10 hidden -translate-y-1/2 justify-between md:flex">
            <button type="button" onClick={() => moveHero(-1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label={t('events.details.previousImage')}> <ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={() => moveHero(1)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label={t('events.details.nextImage')}><ChevronRight className="h-6 w-6" /></button>
          </div>
        )}

        <div className="relative mx-auto flex min-h-135 max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackToResults}>{t('events.details.backToResults')}</Button>
            <Link to="/events" className="text-sm font-semibold text-slate-100 hover:text-teal-200">{t('events.details.browseAllEvents')}</Link>
          </div>
          <div className="max-w-4xl animate-[slideUp_.55s_ease-out]">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white backdrop-blur">{event.category || t('event.defaultCategory')}</Badge>
              <Badge className="bg-teal-500 text-white">{formatPrice(event.price)}</Badge>
              <Badge className="bg-white/15 text-white capitalize backdrop-blur">{event.status}</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{event.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{event.description}</p>
          </div>

          {heroImages.length > 1 && (
            <div className="mt-8 flex gap-2">
              {heroImages.map((image, index) => (
                <button key={image.id || image.url} type="button" onClick={() => setHeroIndex(index)} className={`h-2.5 rounded-full transition-all ${index === heroIndex ? 'w-10 bg-teal-300' : 'w-2.5 bg-white/50 hover:bg-white'}`} aria-label={t('events.details.galleryImageLabel', { index: index + 1 })} />
              ))}
            </div>
          )}
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
                <p className="flex gap-3 text-slate-700"><CalendarDays className="h-5 w-5 text-teal-700" /><span><strong>{t('events.details.deadlineLabel', 'Registration deadline')}:</strong><br />{event.registrationDeadline ? formatDate(event.registrationDeadline) : t('events.details.notSpecified')}</span></p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={shareEvent}><Share2 className="mr-2 h-4 w-4" />{t('events.details.shareEvent')}</Button></div>
              {event.latitude && event.longitude && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-bold text-slate-950">{t('events.details.mapHeading', 'Location map')}</h3>
                  <LocationMap latitude={event.latitude} longitude={event.longitude} height={300} />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex"
                  >
                    <Button type="button" variant="secondary"><Navigation className="mr-2 h-4 w-4" />{t('events.details.getDirections', 'Get directions')}</Button>
                  </a>
                </div>
              )}
            </Card>

            {galleryImages.length > 0 && (
              <section className="rounded-3xl bg-transparent p-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-teal-700"><Images className="h-4 w-4" /> {t('events.details.galleryTitle')}</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{t('events.details.galleryTitle')}</h2>
                  </div>
                  {galleryImages.length > 3 && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveGallery(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700" aria-label={t('events.details.previousGalleryImages')}><ChevronLeft className="h-5 w-5" /></button>
                      <button type="button" onClick={() => moveGallery(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700" aria-label={t('events.details.nextGalleryImages')}><ChevronRight className="h-5 w-5" /></button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                  {visibleGalleryMobile.map((image, index) => (
                    <a key={`${image.id}-mobile-${index}`} href={image.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
                      <img src={image.url} alt={event.title} loading="lazy" decoding="async" className="h-56 w-full object-cover transition duration-500 group-hover:scale-102" />
                    </a>
                  ))}
                </div>

                <div className="hidden gap-5 lg:grid lg:grid-cols-3">
                  {visibleGalleryDesktop.map((image, index) => (
                    <a key={`${image.id}-desktop-${index}`} href={image.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-4xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
                      <img src={image.url} alt={event.title} loading="lazy" decoding="async" className="h-72 w-full object-cover transition duration-500 group-hover:scale-102" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <EventStatsPanel event={event} />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start"><EventActionPanel event={event} /></div>
        </div>
      </PageContainer>
    </div>
  )
}

import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EventForm from '../components/EventForm.jsx'
import { eventService } from '../services/eventService.js'
import { buildEventImagesFormData, eventToFormValues, extractEventFiles, formValuesToApiPayload, hasEventFiles, normalizeEvent } from '../utils/normalizeEvent.js'
import { hasEventEnded } from '../utils/eventLifecycle.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function EditEventPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function run() {
      try {
        const response = await eventService.getOrganizerEvent(id)
        setEvent(normalizeEvent(response.data.event))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, t('events.edit.loadFailed')))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id, t])

  async function handleUpdateEvent(payload, status = 'pending') {
    setSubmitting(true)
    setSubmitError('')
    try {
      await eventService.updateEvent(id, formValuesToApiPayload(payload, status))
      const files = extractEventFiles(payload)
      if (hasEventFiles(files)) await eventService.uploadImages(id, buildEventImagesFormData(files))
      toast.success(status === 'draft' ? t('events.edit.draftSaved') : 'Event published successfully.')
      navigate('/organizer/events')
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, t('events.edit.errorMessage'))
      toast.error(message)
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteImage(image) {
    const response = await eventService.deleteImage(id, image.id)
    const updated = normalizeEvent(response.data.event)
    setEvent(updated)
    toast.success(t('events.edit.imageDeleted'))
    return updated
  }

  async function handleSetCover(image) {
    const response = await eventService.setCoverImage(id, image.id)
    const updated = normalizeEvent(response.data.event)
    setEvent(updated)
    toast.success(t('events.edit.coverUpdated'))
    return updated
  }

  if (loading) return <PageContainer><Loader message={t('events.edit.loadingMessage')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('events.edit.loadErrorTitle')} message={error} /></PageContainer>
  if (!event) {
    return (
      <PageContainer>
        <EmptyState title={t('events.edit.notFoundTitle')} message={t('events.edit.notFoundMessage')} />
        <div className="mt-6"><Link to="/organizer/events"><Button>{t('events.edit.backToMyEvents')}</Button></Link></div>
      </PageContainer>
    )
  }

  if (hasEventEnded(event)) {
    return (
      <PageContainer>
        <ErrorState
          title="Past event cannot be edited"
          message="This event has already ended, so its details and photos are locked. Duplicate it from My Events to create a new edition with new dates."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to={`/organizer/events/${event.id}/details`}><Button variant="secondary">View details</Button></Link>
          <Link to="/organizer/events"><Button>Back to My Events</Button></Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <section className="mb-6 rounded-3xl bg-linear-to-r from-teal-700 to-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">{t('events.edit.title')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('events.edit.pageDescription', { title: event.title })}</p>
      </section>
      <EventForm
        initialValues={eventToFormValues(event)}
        submitLabel="Publish Event"
        onSubmit={(payload) => handleUpdateEvent(payload, 'published')}
        onDraft={(payload) => handleUpdateEvent(payload, 'draft')}
        submitting={submitting}
        serverError={submitError}
        onDeleteExistingImage={handleDeleteImage}
        onSetExistingCover={handleSetCover}
      />
    </PageContainer>
  )
}

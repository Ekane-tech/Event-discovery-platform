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
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export default function EditEventPage() {
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
        setError(getApiErrorMessage(fetchError, 'Unable to load organizer event.'))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  async function handleUpdateEvent(payload, status = 'pending') {
    setSubmitting(true)
    setSubmitError('')
    try {
      await eventService.updateEvent(id, formValuesToApiPayload(payload, status))
      const files = extractEventFiles(payload)
      if (hasEventFiles(files)) await eventService.uploadImages(id, buildEventImagesFormData(files))
      toast.success(status === 'draft' ? 'Draft saved successfully.' : 'Event updated successfully.')
      navigate('/organizer/events')
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, 'Unable to update event.')
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
    toast.success('Image deleted.')
    return updated
  }

  async function handleSetCover(image) {
    const response = await eventService.setCoverImage(id, image.id)
    const updated = normalizeEvent(response.data.event)
    setEvent(updated)
    toast.success('Cover image updated.')
    return updated
  }

  if (loading) return <PageContainer><Loader message="Loading organizer event..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Unable to load event" message={error} /></PageContainer>
  if (!event) {
    return (
      <PageContainer>
        <EmptyState title="Organizer event not found" message="The event may have been deleted or does not belong to this organizer." />
        <div className="mt-6"><Link to="/organizer/events"><Button>Back to My Events</Button></Link></div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">Edit Event</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Update {event.title}. Manage the cover photo and existing gallery without leaving this page.</p>
      </section>
      <EventForm
        initialValues={eventToFormValues(event)}
        submitLabel="Submit for Review"
        onSubmit={(payload) => handleUpdateEvent(payload, 'pending')}
        onDraft={(payload) => handleUpdateEvent(payload, 'draft')}
        submitting={submitting}
        serverError={submitError}
        onDeleteExistingImage={handleDeleteImage}
        onSetExistingCover={handleSetCover}
      />
    </PageContainer>
  )
}

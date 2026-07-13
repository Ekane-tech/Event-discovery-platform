import { toast } from 'sonner'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EventForm from '../components/EventForm.jsx'
import { createEmptyEventForm } from '../utils/eventDefaults.js'
import { eventService } from '../services/eventService.js'
import { buildEventImagesFormData, extractEventFiles, formValuesToApiPayload, hasEventFiles } from '../utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function saveEvent(payload, status = 'pending') {
    setSubmitting(true)
    setError('')
    try {
      const response = await eventService.createEvent(formValuesToApiPayload(payload, status))
      const eventId = response.data.event.id
      const files = extractEventFiles(payload)
      if (hasEventFiles(files)) await eventService.uploadImages(eventId, buildEventImagesFormData(files))
      toast.success(status === 'draft' ? 'Draft saved successfully.' : 'Event submitted successfully.')
      navigate('/organizer/events')
    } catch (createError) {
      const message = getApiErrorMessage(createError, 'Unable to create event.')
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">Create Event</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Add the essential details, photos and schedule. Save a draft or submit when ready for review.</p>
      </section>
      <EventForm
        initialValues={createEmptyEventForm()}
        submitLabel="Submit Event"
        onSubmit={(payload) => saveEvent(payload, 'pending')}
        onDraft={(payload) => saveEvent(payload, 'draft')}
        submitting={submitting}
        serverError={error}
      />
    </PageContainer>
  )
}

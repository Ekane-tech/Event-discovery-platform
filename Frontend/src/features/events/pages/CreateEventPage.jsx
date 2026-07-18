import { toast } from 'sonner'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EventForm from '../components/EventForm.jsx'
import { createEmptyEventForm } from '../utils/eventDefaults.js'
import { eventService } from '../services/eventService.js'
import { buildEventImagesFormData, extractEventFiles, formValuesToApiPayload, hasEventFiles } from '../utils/normalizeEvent.js'
import { getApiErrorMessage, isEmailVerificationError } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function CreateEventPage() {
  const { t } = useTranslation()
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
      toast.success(status === 'draft' ? t('events.create.draftSaved') : 'Event published successfully.')
      navigate('/organizer/events')
    } catch (createError) {
      const message = getApiErrorMessage(createError, t('events.create.errorMessage'))
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isVerificationError = error && isEmailVerificationError({ response: { data: { message: error } } })

  return (
    <PageContainer>
      <section className="mb-6 rounded-3xl bg-linear-to-r from-teal-700 to-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">{t('events.create.title')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('events.create.description')}</p>
      </section>
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
          {isVerificationError && (
            <Link to="/verify-email?status=required" className="mt-2 inline-block text-sm font-bold text-red-700 hover:text-red-900">
              Verify your email →
            </Link>
          )}
        </div>
      )}
      <EventForm
        initialValues={createEmptyEventForm()}
        submitLabel="Publish Event"
        onSubmit={(payload) => saveEvent(payload, 'published')}
        onDraft={(payload) => saveEvent(payload, 'draft')}
        submitting={submitting}
        serverError={error}
      />
    </PageContainer>
  )
}

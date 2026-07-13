import { useState } from 'react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import Textarea from '../../../shared/components/ui/Textarea.jsx'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { reportService } from '../services/reportService.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const REPORT_TYPES = [
  { value: 'fake_event', labelKey: 'report.type.fakeEvent' },
  { value: 'wrong_information', labelKey: 'report.type.wrongInformation' },
  { value: 'wrong_location', labelKey: 'report.type.wrongLocation' },
  { value: 'inappropriate_content', labelKey: 'report.type.inappropriateContent' },
  { value: 'duplicate_event', labelKey: 'report.type.duplicateEvent' },
  { value: 'scam_or_fraud', labelKey: 'report.type.scamOrFraud' },
  { value: 'other', labelKey: 'report.type.other' },
]

export default function ReportEventModal({ open, event, onClose, onSubmitted }) {
  const { t } = useTranslation()
  const [type, setType] = useState('fake_event')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await reportService.reportEvent(event.id, {
        type,
        message: message.trim() || null,
      })
      setMessage('')
      setType('fake_event')
      onSubmitted?.(response.data.report)
      onClose()
    } catch (reportError) {
      setError(getApiErrorMessage(reportError, t('report.submitFailed')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title={t('report.title')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <p className="text-sm text-slate-600">{t('report.reporting')}</p>
          <p className="mt-1 font-bold text-slate-950">{event?.title}</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('report.reason')}</span>
          <Select value={type} onChange={(inputEvent) => setType(inputEvent.target.value)}>
            {REPORT_TYPES.map((reportType) => <option key={reportType.value} value={reportType.value}>{t(reportType.labelKey)}</option>)}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('report.details')}</span>
          <Textarea value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} rows="5" placeholder={t('report.detailsPlaceholder')} />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>{t('cancel')}</Button>
          <Button type="submit" disabled={submitting}>{submitting ? t('report.submitting') : t('report.submit')}</Button>
        </div>
      </form>
    </Modal>
  )
}

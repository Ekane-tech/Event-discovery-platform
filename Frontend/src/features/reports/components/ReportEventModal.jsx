import { useState } from 'react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import Textarea from '../../../shared/components/ui/Textarea.jsx'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { reportService } from '../services/reportService.js'

const REPORT_TYPES = [
  { value: 'fake_event', label: 'Fake event' },
  { value: 'wrong_information', label: 'Wrong information' },
  { value: 'wrong_location', label: 'Wrong location' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'duplicate_event', label: 'Duplicate event' },
  { value: 'scam_or_fraud', label: 'Scam or fraud' },
  { value: 'other', label: 'Other' },
]

export default function ReportEventModal({ open, event, onClose, onSubmitted }) {
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
      setError(getApiErrorMessage(reportError, 'Unable to submit report.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title="Report event" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <p className="text-sm text-slate-600">You are reporting:</p>
          <p className="mt-1 font-bold text-slate-950">{event?.title}</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Reason</span>
          <Select value={type} onChange={(inputEvent) => setType(inputEvent.target.value)}>
            {REPORT_TYPES.map((reportType) => <option key={reportType.value} value={reportType.value}>{reportType.label}</option>)}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Details</span>
          <Textarea value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} rows="5" placeholder="Add helpful details for the moderation team." />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit report'}</Button>
        </div>
      </form>
    </Modal>
  )
}

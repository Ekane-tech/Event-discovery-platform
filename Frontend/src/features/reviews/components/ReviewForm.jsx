import { useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Textarea from '../../../shared/components/ui/Textarea.jsx'
import StarRating from './StarRating.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ReviewForm({ initialReview, onSubmitted, onCancel, onDelete }) {
  const { t } = useTranslation()
  const isEditing = Boolean(initialReview)
  const [rating, setRating] = useState(initialReview?.rating || 0)
  const [comment, setComment] = useState(initialReview?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (rating < 1) {
      setError(t('reviews.ratingRequired', 'Please select a rating.'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmitted({ rating, comment: comment.trim() ? comment : null })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || t('reviews.actionFailed', 'Could not submit your review.'))
      throw submitError
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <span className="mb-2 block text-sm font-semibold text-slate-700">{t('reviews.ratingLabel', 'Your rating')}</span>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <Textarea
        name="comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder={t('reviews.commentPlaceholder', 'Share details about your experience...')}
      />

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? t('reviews.submitting', 'Submitting...')
            : isEditing
              ? t('reviews.update', 'Update review')
              : t('reviews.submit', 'Submit review')}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            {t('reviews.cancel', 'Cancel')}
          </Button>
        )}
        {isEditing && onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} disabled={submitting}>
            {t('reviews.delete', 'Delete')}
          </Button>
        )}
      </div>
    </form>
  )
}

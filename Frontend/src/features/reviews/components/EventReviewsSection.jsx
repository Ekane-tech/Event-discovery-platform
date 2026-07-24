import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Card from '../../../shared/components/ui/Card.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { reviewService } from '../services/reviewService.js'
import { normalizeReview } from '../utils/normalizeReview.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import ReviewSummary from './ReviewSummary.jsx'
import ReviewList from './ReviewList.jsx'
import ReviewForm from './ReviewForm.jsx'

export default function EventReviewsSection({ event }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState({ page: 1, lastPage: 1 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const myReview = summary?.user_review ? normalizeReview(summary.user_review) : null
  const visibleReviews = myReview ? reviews.filter((review) => review.id !== myReview.id) : reviews

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, listRes] = await Promise.all([
        reviewService.getSummary(event.id),
        reviewService.getReviews(event.id, { page: 1, per_page: 10 }),
      ])
      setSummary(summaryRes.data.summary)
      setReviews((listRes.data.reviews || []).map(normalizeReview))
      setMeta({
        page: listRes.data.meta?.current_page || 1,
        lastPage: listRes.data.meta?.last_page || 1,
      })
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError, t('reviews.loadFailed', "Couldn't load reviews.")))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id])

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = meta.page + 1
    try {
      const res = await reviewService.getReviews(event.id, { page: nextPage, per_page: 10 })
      setReviews((prev) => [...prev, ...(res.data.reviews || []).map(normalizeReview)])
      setMeta({
        page: res.data.meta?.current_page || nextPage,
        lastPage: res.data.meta?.last_page || meta.lastPage,
      })
    } catch (loadMoreError) {
      toast.error(getApiErrorMessage(loadMoreError, t('reviews.loadFailed', "Couldn't load reviews.")))
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleSubmit(payload) {
    if (editing && myReview) {
      await reviewService.updateReview(event.id, myReview.id, payload)
      toast.success(t('reviews.updated', 'Review updated.'))
      setEditing(false)
      await refresh()
      return
    }
    await reviewService.createReview(event.id, payload)
    toast.success(t('reviews.submitted', 'Review submitted. Thank you!'))
    setShowForm(false)
    await refresh()
  }

  async function handleDelete() {
    if (!myReview) return
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('reviews.deleteConfirm', 'Delete your review? This cannot be undone.'))) return
    try {
      await reviewService.deleteReview(event.id, myReview.id)
      toast.success(t('reviews.deleted', 'Review removed.'))
      setEditing(false)
      await refresh()
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, t('reviews.actionFailed', 'Could not submit your review.')))
    }
  }

  function reasonMessage(reason) {
    switch (reason) {
      case 'event_not_ended':
        return t('reviews.notYetEnded', 'Reviews open once the event has ended.')
      case 'not_registered':
        return t('reviews.registerToReview', 'Only attendees with a confirmed registration can review this event.')
      default:
        return ''
    }
  }

  function renderWriteArea() {
    // Guest: prompt to log in.
    if (!user) {
      return (
        <Card className="text-center">
          <p className="text-sm text-slate-600">
            <Link to="/login" className="font-bold text-teal-700">{t('reviews.loginToReviewLink', 'Log in')}</Link>{' '}
            {t('reviews.loginToReview', 'to leave a review.')}
          </p>
        </Card>
      )
    }

    // The organizer views their own event — no write area.
    if (Number(user.id) === Number(event.organizerId)) return null

    // Already reviewed: show "your review" (editable / deletable).
    if (myReview) {
      if (editing) {
        return (
          <Card>
            <h3 className="mb-3 text-lg font-bold text-slate-950">{t('reviews.editReview', 'Edit your review')}</h3>
            <ReviewForm
              initialReview={myReview}
              onSubmitted={handleSubmit}
              onCancel={() => setEditing(false)}
              onDelete={handleDelete}
            />
          </Card>
        )
      }
      return (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-950">{t('reviews.yourReview', 'Your review')}</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(true)}>{t('reviews.edit', 'Edit')}</Button>
              <Button variant="danger" onClick={handleDelete}>{t('reviews.delete', 'Delete')}</Button>
            </div>
          </div>
          <StarRating value={myReview.rating} readOnly size="sm" />
          {myReview.comment && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{myReview.comment}</p>}
        </Card>
      )
    }

    // Eligible to review: show CTA / form.
    if (summary?.can_review) {
      if (showForm) {
        return (
          <Card>
            <h3 className="mb-3 text-lg font-bold text-slate-950">{t('reviews.leaveReview', 'Rate this event')}</h3>
            <ReviewForm onSubmitted={handleSubmit} onCancel={() => setShowForm(false)} />
          </Card>
        )
      }
      return (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-950">{t('reviews.canReviewHeading', 'Attended this event?')}</p>
            <p className="text-sm text-slate-600">{t('reviews.canReviewText', 'Share your experience to help other attendees.')}</p>
          </div>
          <Button onClick={() => setShowForm(true)}>{t('reviews.leaveReview', 'Rate this event')}</Button>
        </Card>
      )
    }

    // Not eligible yet: explain why.
    const reason = reasonMessage(summary?.review_reason)
    if (!reason) return null
    return (
      <Card className="text-center">
        <p className="text-sm text-slate-600">{reason}</p>
      </Card>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        <h2 className="text-2xl font-black text-slate-950">{t('reviews.title', 'Reviews')}</h2>
        {summary?.reviews_count > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-600">{summary.reviews_count}</span>
        )}
      </div>

      {loading ? (
        <Loader message={t('reviews.loading', 'Loading reviews...')} />
      ) : error ? (
        <ErrorState title={t('reviews.loadFailed', "Couldn't load reviews.")} message={error} />
      ) : (
        <>
          <Card>
            <ReviewSummary summary={summary} />
          </Card>

          {renderWriteArea()}

          <ReviewList
            reviews={visibleReviews}
            hasMore={meta.page < meta.lastPage}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </>
      )}
    </section>
  )
}

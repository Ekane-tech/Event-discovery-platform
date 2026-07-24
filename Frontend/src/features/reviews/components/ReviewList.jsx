import StarRating from './StarRating.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ReviewList({ reviews = [], hasMore = false, loadingMore = false, onLoadMore }) {
  const { t } = useTranslation()

  if (reviews.length === 0) {
    return (
      <EmptyState
        title={t('reviews.noReviews', 'No reviews yet')}
        message={t('reviews.noReviewsHint', 'Be the first to share your experience after the event.')}
      />
    )
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Avatar name={review.authorName || t('reviews.anonymous', 'Attendee')} src={review.authorAvatar} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-bold text-slate-950">{review.authorName || t('reviews.anonymous', 'Attendee')}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                  {t('reviews.verifiedAttendee', 'Verified attendee')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={review.rating} readOnly size="sm" />
                <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? t('reviews.loadingMore', 'Loading...') : t('reviews.loadMore', 'Load more')}
          </Button>
        </div>
      )}
    </div>
  )
}

import Button from './Button.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'

export default function Pagination({ page = 1, totalPages = 1, onPrevious, onNext }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" onClick={onPrevious} disabled={page <= 1}>{t('pagination.previous', 'Previous')}</Button>
      <span className="text-sm text-slate-600">{t('pagination.pageOf', { page, totalPages, defaultValue: 'Page {{page}} of {{totalPages}}' })}</span>
      <Button variant="secondary" onClick={onNext} disabled={page >= totalPages}>{t('pagination.next', 'Next')}</Button>
    </div>
  )
}

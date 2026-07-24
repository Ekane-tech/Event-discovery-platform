import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function SearchResultsHeader({ totalResults = 0, totalEvents = 0 }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-950">{t('searchPage.resultsTitle', 'Search results')}</h2>
        <p className="text-sm text-slate-600">
          {t('searchPage.showingResults', {
            totalResults,
            totalEvents,
            defaultValue: 'Showing {{totalResults}} of {{totalEvents}} events.',
          })}
        </p>
      </div>
    </div>
  )
}

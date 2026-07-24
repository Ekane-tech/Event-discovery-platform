import Badge from '../../../shared/components/ui/Badge.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function SelectedInterestsSummary({ selectedInterests = [] }) {
  const { t } = useTranslation()
  if (selectedInterests.length === 0) {
    return <p className="text-sm text-slate-600">{t('interests.noneSelected', 'No interests selected yet.')}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedInterests.map((interest) => <Badge key={interest.id}>{interest.name}</Badge>)}
    </div>
  )
}

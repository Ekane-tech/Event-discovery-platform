import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function StatisticsPage() {
  const { t } = useTranslation()
  return (
    <PageContainer>
      <SectionHeader title={t('statistics.title', 'Statistics')} description={t('statistics.description', 'Analytics and reports will appear here.')} />
      <Card>
        <p className="text-slate-600">{t('statistics.placeholder', 'This page is ready for UI building and API integration.')}</p>
      </Card>
    </PageContainer>
  )
}

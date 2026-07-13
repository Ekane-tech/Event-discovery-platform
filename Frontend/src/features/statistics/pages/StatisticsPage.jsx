import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import Card from '../../../shared/components/ui/Card.jsx'

export default function StatisticsPage() {
  return (
    <PageContainer>
      <SectionHeader title="Statistics" description="Analytics and reports will appear here." />
      <Card>
        <p className="text-slate-600">This page is ready for UI building and API integration.</p>
      </Card>
    </PageContainer>
  )
}

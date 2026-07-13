import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import Card from '../../../shared/components/ui/Card.jsx'

export default function LocationsPage() {
  return (
    <PageContainer>
      <SectionHeader title="Locations" description="Manage regions, divisions, subdivisions, and cities." />
      <Card>
        <p className="text-slate-600">This page is ready for UI building and API integration.</p>
      </Card>
    </PageContainer>
  )
}

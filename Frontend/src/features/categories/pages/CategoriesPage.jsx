import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import Card from '../../../shared/components/ui/Card.jsx'

export default function CategoriesPage() {
  return (
    <PageContainer>
      <SectionHeader title="Categories" description="Manage and browse event categories." />
      <Card>
        <p className="text-slate-600">This page is ready for UI building and API integration.</p>
      </Card>
    </PageContainer>
  )
}

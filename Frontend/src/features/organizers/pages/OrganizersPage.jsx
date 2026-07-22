import { BadgeCheck, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import OrganizerCard from '../components/OrganizerCard.jsx'
import { organizerService } from '../services/organizerService.js'
import { normalizeOrganizers } from '../utils/normalizeOrganizer.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState([])
  const [keyword, setKeyword] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchOrganizers(params = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await organizerService.getOrganizers({ per_page: 50, ...params })
      setOrganizers(normalizeOrganizers(response.data))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load organizers.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrganizers() }, [])

  async function handleSearch(event) {
    event.preventDefault()
    await fetchOrganizers({ keyword: keyword.trim() || undefined, verified: verifiedOnly ? 1 : undefined })
  }

  const stats = useMemo(() => ({ total: organizers.length, verified: organizers.filter((item) => item.isVerified).length }), [organizers])

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-teal-900/70" />
          <div className="relative px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Users className="h-4 w-4" />Organizers</span>
          <h1 className="mt-5 max-w-4xl text-4xl font-black md:text-6xl">Find trusted event organizers.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">Search organizer profiles, discover verified organizers and browse their public events on Mboa Events 237.</p>
          </div>
        </section>
      </div>

      <PageContainer>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-700 p-5 text-white"><p className="text-sm text-white/80">Organizers</p><p className="mt-2 text-3xl font-black">{stats.total}</p></div>
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white"><p className="text-sm text-white/80">Verified</p><p className="mt-2 text-3xl font-black">{stats.verified}</p></div>
        </div>

        <form onSubmit={handleSearch} className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search organizer, company, city or region" className="pl-10" /></div>
            <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="h-4 w-4" /><BadgeCheck className="h-4 w-4 text-teal-700" />Verified only</label>
            <Button type="submit">Search</Button>
          </div>
        </form>

        {loading && <Loader message="Loading organizers..." />}
        {error && <ErrorState title="Unable to load organizers" message={error} />}
        {!loading && !error && organizers.length === 0 && <EmptyState title="No organizers found" message="Try another search term or disable verified-only filtering." />}
        {!loading && !error && organizers.length > 0 && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{organizers.map((organizer) => <OrganizerCard key={organizer.id} organizer={organizer} />)}</div>}
      </PageContainer>
    </div>
  )
}

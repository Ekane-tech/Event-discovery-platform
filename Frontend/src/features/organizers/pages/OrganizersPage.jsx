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
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function OrganizersPage() {
  const { t } = useTranslation()
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
      setError(getApiErrorMessage(fetchError, t('organizers.loadError', 'Unable to load organizers.')))
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
    <PageContainer>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700"><Users className="h-4 w-4" />{t('organizers.badge', 'Organizers')}</span>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{t('organizers.title', 'Find trusted event organizers.')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('organizers.subtitle', 'Search organizer profiles, discover verified organizers and browse their public events on Mboa Events 237.')}</p>
        </div>
      </div>
        <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Users className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('organizers.badge', 'Organizers')}</p>
              <p className="text-2xl font-black leading-tight text-slate-950">{stats.total}</p>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-slate-200 sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><BadgeCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('organizers.verified', 'Verified')}</p>
              <p className="text-2xl font-black leading-tight text-slate-950">{stats.verified}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t('organizers.searchPlaceholder', 'Search organizer, company, city or region')} className="pl-10" /></div>
            <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="h-4 w-4" /><BadgeCheck className="h-4 w-4 text-teal-700" />{t('organizers.verifiedOnly', 'Verified only')}</label>
            <Button type="submit">{t('search', 'Search')}</Button>
          </div>
        </form>

        {loading && <Loader message={t('organizers.loading', 'Loading organizers...')} />}
        {error && <ErrorState title={t('organizers.errorTitle', 'Unable to load organizers')} message={error} />}
        {!loading && !error && organizers.length === 0 && <EmptyState title={t('organizers.emptyTitle', 'No organizers found')} message={t('organizers.emptyMessage', 'Try another search term or disable verified-only filtering.')} />}
        {!loading && !error && organizers.length > 0 && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{organizers.map((organizer) => <OrganizerCard key={organizer.id} organizer={organizer} />)}</div>}
      </PageContainer>
  )
}

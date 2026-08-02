import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Building2, Map, MapPin, Plus } from 'lucide-react'
import AdminHero from '../components/AdminHero.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { getApiErrorMessage } from '../../../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'
import { useTranslation } from '../../../../shared/i18n/useTranslation.js'

const tabs = [{id:'regions',label:'Regions',icon:Map},{id:'divisions',label:'Divisions',icon:Building2},{id:'cities',label:'Cities',icon:MapPin}]

export default function AdminLocationsPage(){
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('regions')
  const [regions, setRegions] = useState([])
  const [divisions, setDivisions] = useState([])
  const [cities, setCities] = useState([])
  const [regionName, setRegionName] = useState('')
  const [divisionForm, setDivisionForm] = useState({ region_id: '', name: '' })
  const [cityForm, setCityForm] = useState({ region_id: '', division_id: '', name: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchLocations() {
    setLoading(true)
    setError('')
    try {
      const [r, d, c] = await Promise.all([
        adminService.getRegions({ include_inactive: true }),
        adminService.getDivisions({ include_inactive: true }),
        adminService.getCities({ include_inactive: true })
      ])
      setRegions(extractCollection(r.data, 'regions'))
      setDivisions(extractCollection(d.data, 'divisions'))
      setCities(extractCollection(c.data, 'cities'))
    } catch (e) {
      setError(getApiErrorMessage(e, t('admin.locations.toasts.error.load', 'Unable to load locations.')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  async function submitRegion(e) {
    e.preventDefault()
    try {
      await adminService.createRegion({ name: regionName, is_active: true })
      setRegionName('')
      toast.success(t('admin.locations.toasts.regionCreated', 'Region created.'))
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.createRegion', 'Unable to create region.')))
    }
  }

  async function submitDivision(e) {
    e.preventDefault()
    try {
      await adminService.createDivision({ region_id: Number(divisionForm.region_id), name: divisionForm.name, is_active: true })
      setDivisionForm({ region_id: '', name: '' })
      toast.success(t('admin.locations.toasts.divisionCreated', 'Division created.'))
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.createDivision', 'Unable to create division.')))
    }
  }

  async function submitCity(e) {
    e.preventDefault()
    try {
      await adminService.createCity({
        region_id: Number(cityForm.region_id),
        division_id: cityForm.division_id ? Number(cityForm.division_id) : null,
        name: cityForm.name,
        is_active: true
      })
      setCityForm({ region_id: '', division_id: '', name: '' })
      toast.success(t('admin.locations.toasts.cityCreated', 'City created.'))
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.createCity', 'Unable to create city.')))
    }
  }

  async function toggleRegion(r) {
    try {
      await adminService.updateRegion(r.id, { name: r.name, is_active: !r.is_active })
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.updateRegion', 'Unable to update region.')))
    }
  }

  async function toggleDivision(d) {
    try {
      await adminService.updateDivision(d.id, { region_id: d.region_id, name: d.name, is_active: !d.is_active })
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.updateDivision', 'Unable to update division.')))
    }
  }

  async function toggleCity(c) {
    try {
      await adminService.updateCity(c.id, { region_id: c.region_id, division_id: c.division_id, name: c.name, is_active: !c.is_active })
      await fetchLocations()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.locations.toasts.error.updateCity', 'Unable to update city.')))
    }
  }

  const regionRows = regions.map(r => ({
    ...r,
    status: <AdminStatusBadge status={r.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions>
      <AdminActionButton onClick={() => toggleRegion(r)}>
        {r.is_active ? t('admin.locations.actions.disable', 'Disable') : t('admin.locations.actions.enable', 'Enable')}
      </AdminActionButton>
    </AdminPageActions>
  }))

  const divisionRows = divisions.map(d => ({
    ...d,
    regionName: d.region?.name || regions.find(r => r.id === d.region_id)?.name || '—',
    status: <AdminStatusBadge status={d.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions>
      <AdminActionButton onClick={() => toggleDivision(d)}>
        {d.is_active ? t('admin.locations.actions.disable', 'Disable') : t('admin.locations.actions.enable', 'Enable')}
      </AdminActionButton>
    </AdminPageActions>
  }))

  const cityRows = cities.map(c => ({
    ...c,
    regionName: c.region?.name || regions.find(r => r.id === c.region_id)?.name || '—',
    divisionName: c.division?.name || divisions.find(d => d.id === c.division_id)?.name || '—',
    status: <AdminStatusBadge status={c.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions>
      <AdminActionButton onClick={() => toggleCity(c)}>
        {c.is_active ? t('admin.locations.actions.disable', 'Disable') : t('admin.locations.actions.enable', 'Enable')}
      </AdminActionButton>
    </AdminPageActions>
  }))

  return <PageContainer>
    <AdminHero 
      title={t('admin.locations.title', 'Manage locations')} 
      description={t('admin.locations.description', 'Maintain regions, divisions and cities used by event publishing and search filters.')} 
    />
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {tabs.map(tab => {
        const Icon = tab.icon
        return <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)} 
          className={`rounded-3xl border p-5 text-left transition ${activeTab === tab.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'}`}
        >
          <Icon className="h-6 w-6 text-teal-700" />
          <p className="mt-3 font-black text-slate-950">{t(`admin.locations.tabs.${tab.id}`, tab.label)}</p>
          <p className="text-sm text-slate-500">
            {t('admin.locations.recordsCount', { count: tab.id === 'regions' ? regions.length : tab.id === 'divisions' ? divisions.length : cities.length }, '{{count}} records')}
          </p>
        </button>
      })}
    </div>
    {loading && <div className="mt-6"><Loader message={t('admin.common.loading', { type: t('admin.locations.title', 'locations') }, 'Loading locations...')} /></div>}
    {error && <div className="mt-6"><ErrorState title={t('admin.common.errorTitle', 'Error')} message={error} /></div>}
    {!loading && <div className="mt-6">
      {activeTab === 'regions' && <>
        <Card className="mb-5">
          <form onSubmit={submitRegion} className="flex flex-col gap-3 md:flex-row">
            <Input 
              value={regionName} 
              onChange={e => setRegionName(e.target.value)} 
              placeholder={t('admin.locations.regions.namePlaceholder', 'Region name')} 
              required 
            />
            <Button><Plus className="mr-2 h-4 w-4" />{t('admin.locations.regions.addButton', 'Add Region')}</Button>
          </form>
        </Card>
        <Table 
          columns={[
            { key: 'name', label: t('admin.locations.regions.table.region', 'Region') },
            { key: 'status', label: t('admin.common.status', 'Status') },
            { key: 'actions', label: t('admin.common.actions', 'Actions') }
          ]} 
          rows={regionRows} 
        />
      </>}
      {activeTab === 'divisions' && <>
        <Card className="mb-5">
          <form onSubmit={submitDivision} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <Select 
              value={divisionForm.region_id} 
              onChange={e => setDivisionForm(c => ({ ...c, region_id: e.target.value }))} 
              required
            >
              <option value="">{t('admin.common.select', 'Select')} {t('admin.locations.divisions.regionLabel', 'region')}</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Input 
              value={divisionForm.name} 
              onChange={e => setDivisionForm(c => ({ ...c, name: e.target.value }))} 
              placeholder={t('admin.locations.divisions.namePlaceholder', 'Division name')} 
              required 
            />
            <Button>{t('admin.locations.divisions.addButton', 'Add Division')}</Button>
          </form>
        </Card>
        <Table 
          columns={[
            { key: 'name', label: t('admin.locations.divisions.table.division', 'Division') },
            { key: 'regionName', label: t('admin.locations.divisions.table.regionName', 'Region') },
            { key: 'status', label: t('admin.common.status', 'Status') },
            { key: 'actions', label: t('admin.common.actions', 'Actions') }
          ]} 
          rows={divisionRows} 
        />
      </>}
      {activeTab === 'cities' && <>
        <Card className="mb-5">
          <form onSubmit={submitCity} className="grid gap-3 md:grid-cols-[200px_200px_1fr_auto]">
            <Select 
              value={cityForm.region_id} 
              onChange={e => setCityForm(c => ({ ...c, region_id: e.target.value, division_id: '' }))} 
              required
            >
              <option value="">{t('admin.common.select', 'Select')} {t('admin.locations.cities.regionLabel', 'region')}</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Select 
              value={cityForm.division_id} 
              onChange={e => setCityForm(c => ({ ...c, division_id: e.target.value }))}
            >
              <option value="">{t('admin.locations.cities.noDivision', 'No division')}</option>
              {divisions.filter(d => !cityForm.region_id || Number(d.region_id) === Number(cityForm.region_id)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input 
              value={cityForm.name} 
              onChange={e => setCityForm(c => ({ ...c, name: e.target.value }))} 
              placeholder={t('admin.locations.cities.namePlaceholder', 'City name')} 
              required 
            />
            <Button>{t('admin.locations.cities.addButton', 'Add City')}</Button>
          </form>
        </Card>
        <Table 
          columns={[
            { key: 'name', label: t('admin.locations.cities.table.city', 'City') },
            { key: 'divisionName', label: t('admin.locations.cities.table.divisionName', 'Division') },
            { key: 'regionName', label: t('admin.locations.cities.table.regionName', 'Region') },
            { key: 'status', label: t('admin.common.status', 'Status') },
            { key: 'actions', label: t('admin.common.actions', 'Actions') }
          ]} 
          rows={cityRows} 
        />
      </>}
    </div>}
  </PageContainer>
}

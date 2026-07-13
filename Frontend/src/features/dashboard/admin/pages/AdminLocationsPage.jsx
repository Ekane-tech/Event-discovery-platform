import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminLocationsPage() {
  const [regions, setRegions] = useState([])
  const [divisions, setDivisions] = useState([])
  const [cities, setCities] = useState([])
  const [regionName, setRegionName] = useState('')
  const [divisionForm, setDivisionForm] = useState({ region_id: '', name: '' })
  const [cityForm, setCityForm] = useState({ region_id: '', division_id: '', name: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchLocations() {
    setLoading(true)
    setError('')
    try {
      const [regionsResponse, divisionsResponse, citiesResponse] = await Promise.all([
        adminService.getRegions({ include_inactive: true }),
        adminService.getDivisions({ include_inactive: true }),
        adminService.getCities({ include_inactive: true }),
      ])
      setRegions(extractCollection(regionsResponse.data, 'regions'))
      setDivisions(extractCollection(divisionsResponse.data, 'divisions'))
      setCities(extractCollection(citiesResponse.data, 'cities'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load locations.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  async function createRegion(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')
    try {
      await adminService.createRegion({ name: regionName, is_active: true })
      setRegionName('')
      setSuccess('Region created successfully.')
      toast.success('Region created successfully.')
      await fetchLocations()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to create region.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function createDivision(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')
    try {
      await adminService.createDivision({ region_id: Number(divisionForm.region_id), name: divisionForm.name, is_active: true })
      setDivisionForm({ region_id: '', name: '' })
      setSuccess('Division created successfully.')
      toast.success('Division created successfully.')
      await fetchLocations()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to create division.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function createCity(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')
    try {
      await adminService.createCity({
        region_id: Number(cityForm.region_id),
        division_id: cityForm.division_id ? Number(cityForm.division_id) : null,
        name: cityForm.name,
        is_active: true,
      })
      setCityForm({ region_id: '', division_id: '', name: '' })
      setSuccess('City created successfully.')
      toast.success('City created successfully.')
      await fetchLocations()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to create city.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleRegion(region) {
    await adminService.updateRegion(region.id, { name: region.name, is_active: !region.is_active })
    await fetchLocations()
  }

  async function toggleDivision(division) {
    await adminService.updateDivision(division.id, { region_id: division.region_id, name: division.name, is_active: !division.is_active })
    await fetchLocations()
  }

  async function toggleCity(city) {
    await adminService.updateCity(city.id, { region_id: city.region_id, division_id: city.division_id, name: city.name, is_active: !city.is_active })
    await fetchLocations()
  }

  const regionRows = regions.map((region) => ({
    ...region,
    status: <AdminStatusBadge status={region.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions><AdminActionButton onClick={() => toggleRegion(region)}>{region.is_active ? 'Disable' : 'Enable'}</AdminActionButton></AdminPageActions>,
  }))

  const divisionRows = divisions.map((division) => ({
    ...division,
    regionName: division.region?.name || regions.find((region) => region.id === division.region_id)?.name || '—',
    status: <AdminStatusBadge status={division.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions><AdminActionButton onClick={() => toggleDivision(division)}>{division.is_active ? 'Disable' : 'Enable'}</AdminActionButton></AdminPageActions>,
  }))

  const cityRows = cities.map((city) => ({
    ...city,
    regionName: city.region?.name || regions.find((region) => region.id === city.region_id)?.name || '—',
    divisionName: city.division?.name || divisions.find((division) => division.id === city.division_id)?.name || '—',
    status: <AdminStatusBadge status={city.is_active ? 'active' : 'disabled'} />,
    actions: <AdminPageActions><AdminActionButton onClick={() => toggleCity(city)}>{city.is_active ? 'Disable' : 'Enable'}</AdminActionButton></AdminPageActions>,
  }))

  return (
    <PageContainer>
      <SectionHeader title="Manage Locations" description="Manage regions, divisions, and cities used by events and filters." />

      {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-6"><Alert type="success">{success}</Alert></div>}

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Card>
          <h2 className="mb-3 font-bold">Add Region</h2>
          <form onSubmit={createRegion} className="grid gap-3">
            <Input value={regionName} onChange={(event) => setRegionName(event.target.value)} placeholder="Region name" required />
            <Button type="submit" disabled={saving}>Add Region</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Add Division</h2>
          <form onSubmit={createDivision} className="grid gap-3">
            <Select value={divisionForm.region_id} onChange={(event) => setDivisionForm((current) => ({ ...current, region_id: event.target.value }))} required>
              <option value="">Select region</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </Select>
            <Input value={divisionForm.name} onChange={(event) => setDivisionForm((current) => ({ ...current, name: event.target.value }))} placeholder="Division name" required />
            <Button type="submit" disabled={saving}>Add Division</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Add City</h2>
          <form onSubmit={createCity} className="grid gap-3">
            <Select value={cityForm.region_id} onChange={(event) => setCityForm((current) => ({ ...current, region_id: event.target.value, division_id: '' }))} required>
              <option value="">Select region</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </Select>
            <Select value={cityForm.division_id} onChange={(event) => setCityForm((current) => ({ ...current, division_id: event.target.value }))}>
              <option value="">No division</option>
              {divisions.filter((division) => !cityForm.region_id || Number(division.region_id) === Number(cityForm.region_id)).map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
            </Select>
            <Input value={cityForm.name} onChange={(event) => setCityForm((current) => ({ ...current, name: event.target.value }))} placeholder="City name" required />
            <Button type="submit" disabled={saving}>Add City</Button>
          </form>
        </Card>
      </div>

      {loading && <Loader message="Loading locations..." />}
      {!loading && error && regions.length === 0 && <ErrorState title="Unable to load locations" message={error} />}
      {!loading && (
        <div className="grid gap-8">
          <section><h2 className="mb-3 text-xl font-bold">Regions</h2><Table columns={[{ key: 'name', label: 'Region' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={regionRows} /></section>
          <section><h2 className="mb-3 text-xl font-bold">Divisions</h2><Table columns={[{ key: 'name', label: 'Division' }, { key: 'regionName', label: 'Region' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={divisionRows} /></section>
          <section><h2 className="mb-3 text-xl font-bold">Cities</h2><Table columns={[{ key: 'name', label: 'City' }, { key: 'divisionName', label: 'Division' }, { key: 'regionName', label: 'Region' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={cityRows} /></section>
        </div>
      )}
    </PageContainer>
  )
}

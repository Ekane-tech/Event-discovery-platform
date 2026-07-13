import { ImagePlus, Images, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import SearchableSelect from '../../../shared/components/forms/SearchableSelect.jsx'
import FormTextarea from '../../../shared/components/forms/FormTextarea.jsx'
import DateTimeField from '../../../shared/components/forms/DateTimeField.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import { EVENT_VISIBILITIES, createEmptyEventForm } from '../utils/eventDefaults.js'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import { extractCollection } from '../utils/normalizeEvent.js'

function UploadBox({ title, description, icon: Icon, multiple = false, name, onChange, selected, existing }) {
  return <label className="group block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-teal-400 hover:bg-teal-50"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm"><Icon className="h-6 w-6" /></span><span className="mt-4 block font-black text-slate-950">{title}</span><span className="mt-1 block text-sm text-slate-600">{description}</span>{existing&&<span className="mt-2 block text-xs font-semibold text-slate-500">Current image already uploaded</span>}{selected&&<span className="mt-3 block text-xs font-semibold text-teal-700">{selected}</span>}<input name={name} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple={multiple} onChange={onChange} className="hidden" /></label>
}

export default function EventForm({ initialValues, submitLabel = 'Save Event', onSubmit, submitting = false, serverError = '' }) {
  const [form, setForm] = useState(initialValues || createEmptyEventForm())
  const [error, setError] = useState('')
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => { setForm(initialValues || createEmptyEventForm()) }, [initialValues])
  useEffect(() => { async function loadOptions(){ setOptionsLoading(true); try{ const [cat,reg,city]=await Promise.all([categoryService.getCategories(),locationService.getRegions(),locationService.getCities()]); setCategories(extractCollection(cat.data,'categories')); setRegions(extractCollection(reg.data,'regions')); setCities(extractCollection(city.data,'cities')) } finally { setOptionsLoading(false) } } loadOptions() }, [])

  const categoryOptions = useMemo(() => categories.map((item) => ({ value: item.id, label: item.name })), [categories])
  const regionOptions = useMemo(() => regions.map((item) => ({ value: item.id, label: item.name })), [regions])
  const cityOptions = useMemo(() => cities.filter((item) => !form.region_id || Number(item.region_id) === Number(form.region_id)).map((item) => ({ value: item.id, label: item.name })), [cities, form.region_id])

  function updateField(event) { const { name, value, files, type } = event.target; if (type === 'file') { setForm((c) => ({ ...c, [name]: name === 'galleryImages' ? Array.from(files || []) : files?.[0] || null })); return } setForm((c) => ({ ...c, [name]: value })) }
  function updateValue(name, value) { setForm((c) => ({ ...c, [name]: value, ...(name === 'region_id' ? { city_id: '' } : {}) })) }
  function handleSubmit(event) { event.preventDefault(); setError(''); if (!form.title.trim()) return setError('Event title is required.'); if (!form.description.trim()) return setError('Event description is required.'); if (!form.category_id) return setError('Category is required.'); if (!form.startDate) return setError('Start date is required.'); if (!form.coverImage && !form.existingCoverImage) return setError('Please upload a cover photo.'); if ((!form.galleryImages || form.galleryImages.length === 0) && (!form.existingGalleryImages || form.existingGalleryImages.length === 0)) return setError('Please upload at least one gallery image.'); onSubmit(form) }
  if (optionsLoading) return <Loader message="Preparing event form..." />

  return <form onSubmit={handleSubmit} className="grid gap-6">{error&&<Alert type="error">{error}</Alert>}{serverError&&<Alert type="error">{serverError}</Alert>}<Card><h2 className="mb-4 text-xl font-black text-slate-950">Event basics</h2><div className="grid gap-4"><FormInput label="Event title" name="title" value={form.title} onChange={updateField} placeholder="Douala Tech Summit" required/><FormTextarea label="Description" name="description" value={form.description} onChange={updateField} rows="5" placeholder="Describe the experience, audience, program and benefits." required/><div className="grid gap-4 md:grid-cols-2"><SearchableSelect label="Category" value={form.category_id} onChange={(value)=>updateValue('category_id', value)} options={categoryOptions} placeholder="Select category"/><SearchableSelect label="Visibility" value={form.visibility} onChange={(value)=>updateValue('visibility', value)} options={EVENT_VISIBILITIES.map(v=>({value:v.value,label:v.label}))} placeholder="Select visibility"/></div></div></Card><Card><h2 className="mb-4 text-xl font-black text-slate-950">Location</h2><div className="grid gap-4 md:grid-cols-3"><SearchableSelect label="Region" value={form.region_id} onChange={(value)=>updateValue('region_id', value)} options={regionOptions} placeholder="Select region"/><SearchableSelect label="City" value={form.city_id} onChange={(value)=>updateValue('city_id', value)} options={cityOptions} placeholder="Select city"/><FormInput label="Venue" name="venue" value={form.venue} onChange={updateField} placeholder="Bonanjo Conference Hall"/></div></Card><Card><h2 className="mb-4 text-xl font-black text-slate-950">Schedule and capacity</h2><div className="grid gap-4 md:grid-cols-2"><DateTimeField label="Start date and time" name="startDate" value={form.startDate} onChange={updateField} helper="When the event begins." required/><DateTimeField label="End date and time" name="endDate" value={form.endDate} onChange={updateField} helper="Optional, but recommended for longer events."/></div><div className="mt-4 grid gap-4 md:grid-cols-3"><FormInput label="Price (XAF)" name="price" type="number" value={form.price} onChange={updateField} placeholder="0" min="0"/><FormInput label="Maximum participants" name="maximumParticipants" type="number" value={form.maximumParticipants} onChange={updateField} placeholder="500" min="1"/><DateTimeField label="Registration deadline" name="registrationDeadline" value={form.registrationDeadline} onChange={updateField} helper="Last moment attendees can register." /></div></Card><Card><h2 className="mb-4 text-xl font-black text-slate-950">Event photos</h2><div className="grid gap-4 md:grid-cols-2"><UploadBox title="Upload cover photo" description="Required. Appears on event cards and details." icon={ImagePlus} name="coverImage" onChange={updateField} selected={form.coverImage?.name} existing={form.existingCoverImage}/><UploadBox title="Upload gallery photos" description="Required. Add at least one additional image." icon={Images} name="galleryImages" onChange={updateField} multiple selected={form.galleryImages?.length ? `${form.galleryImages.length} image(s) selected` : ''} existing={form.existingGalleryImages?.length}/></div></Card><div className="flex justify-end"><Button type="submit" disabled={submitting}><Save className="mr-2 h-4 w-4"/>{submitting?'Saving...':submitLabel}</Button></div></form>
}

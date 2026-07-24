import { Eye, ImagePlus, Images, Save, Star, Trash2, UploadCloud } from 'lucide-react'
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
import LocationPicker from '../../../shared/components/map/LocationPicker.jsx'

const MAX_GALLERY_IMAGES = 8
const MAX_SOURCE_IMAGE_MB = 10
const MAX_OUTPUT_IMAGE_MB = 4

function fileSizeMb(file) {
  return file.size / 1024 / 1024
}

function canCompressImage(file) {
  return typeof window !== 'undefined' && /^image\/(jpeg|jpg|png|webp)$/i.test(file.type)
}

function compressImage(file) {
  if (!canCompressImage(file)) return Promise.resolve(file)
  if (fileSizeMb(file) <= 1.5) return Promise.resolve(file)

  return new Promise((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      const maxSide = 1600
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * ratio)
      canvas.height = Math.round(image.height * ratio)
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) return resolve(file)
          const extension = file.type === 'image/webp' ? 'webp' : 'jpg'
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, `.${extension}`), {
            type: extension === 'webp' ? 'image/webp' : 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(fileSizeMb(compressed) < fileSizeMb(file) ? compressed : file)
        },
        file.type === 'image/webp' ? 'image/webp' : 'image/jpeg',
        0.82,
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    image.src = url
  })
}

function imageStateFromEvent(event) {
  const images = event?.images || []
  return {
    existingCoverImage: images.find((image) => image.isCover) || null,
    existingGalleryImages: images.filter((image) => !image.isCover),
  }
}

function UploadBox({ title, description, icon: Icon, multiple = false, name, onChange, selected, existing }) {
  return (
    <label className="group block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50 p-6 text-center transition hover:border-teal-400 hover:from-teal-50 hover:to-white">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-4 block font-black text-slate-950">{title}</span>
      <span className="mt-1 block text-sm text-slate-600">{description}</span>
      {existing && <span className="mt-2 block text-xs font-semibold text-slate-500">Current image available below</span>}
      {selected && <span className="mt-3 block text-xs font-semibold text-teal-700">{selected}</span>}
      <input name={name} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple={multiple} onChange={onChange} className="hidden" />
    </label>
  )
}

function ExistingImageCard({ image, isCover, onSetCover, onDelete, busy }) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={image.url} alt="Event" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-2">
          {isCover && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">Cover</span>}
        </div>
        <a href={image.url} target="_blank" rel="noreferrer" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-800 shadow-sm transition hover:bg-white">
          <Eye className="h-4 w-4" />
        </a>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {!isCover && (
          <Button type="button" variant="secondary" className="!px-3 !py-2 text-xs" onClick={() => onSetCover(image)} disabled={busy}>
            <Star className="mr-1 h-3.5 w-3.5" /> Make cover
          </Button>
        )}
        <Button type="button" variant="danger" className="!px-3 !py-2 text-xs" onClick={() => onDelete(image)} disabled={busy}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  )
}

export default function EventForm({
  initialValues,
  submitLabel = 'Save Event',
  onSubmit,
  submitting = false,
  serverError = '',
  onDeleteExistingImage,
  onSetExistingCover,
  onDraft,
}) {
  const [form, setForm] = useState(initialValues || createEmptyEventForm())
  const [error, setError] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    setForm(initialValues || createEmptyEventForm())
  }, [initialValues])

  useEffect(() => {
    async function loadOptions() {
      setOptionsLoading(true)
      try {
        const [cat, reg, city] = await Promise.all([
          categoryService.getCategories(),
          locationService.getRegions(),
          locationService.getCities(),
        ])
        setCategories(extractCollection(cat.data, 'categories'))
        setRegions(extractCollection(reg.data, 'regions'))
        setCities(extractCollection(city.data, 'cities'))
      } finally {
        setOptionsLoading(false)
      }
    }

    loadOptions()
  }, [])

  const categoryOptions = useMemo(() => categories.map((item) => ({ value: item.id, label: item.name })), [categories])
  const regionOptions = useMemo(() => regions.map((item) => ({ value: item.id, label: item.name })), [regions])
  const cityOptions = useMemo(
    () => cities.filter((item) => !form.region_id || Number(item.region_id) === Number(form.region_id)).map((item) => ({ value: item.id, label: item.name })),
    [cities, form.region_id],
  )

  const existingGalleryCount = form.existingGalleryImages?.length || 0
  const selectedGalleryCount = form.galleryImages?.length || 0
  const galleryRemaining = Math.max(0, MAX_GALLERY_IMAGES - existingGalleryCount)

  function updateTextField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function updateFileField(event) {
    const { name, files } = event.target
    setError('')
    const selectedFiles = Array.from(files || [])
    if (selectedFiles.some((file) => fileSizeMb(file) > MAX_SOURCE_IMAGE_MB)) {
      event.target.value = ''
      setError(`Each source image must be ${MAX_SOURCE_IMAGE_MB}MB or smaller.`)
      return
    }

    if (name === 'galleryImages' && selectedFiles.length > galleryRemaining) {
      event.target.value = ''
      setError(`You can add ${galleryRemaining} more gallery image${galleryRemaining === 1 ? '' : 's'}. Maximum is ${MAX_GALLERY_IMAGES}.`)
      return
    }

    const compressed = await Promise.all(selectedFiles.map(compressImage))
    if (compressed.some((file) => fileSizeMb(file) > MAX_OUTPUT_IMAGE_MB)) {
      event.target.value = ''
      setError(`After compression, each image must be ${MAX_OUTPUT_IMAGE_MB}MB or smaller. Please choose a smaller image.`)
      return
    }

    setForm((current) => ({
      ...current,
      [name]: name === 'galleryImages' ? compressed : compressed[0] || null,
    }))
  }

  function updateValue(name, value) {
    setForm((current) => ({ ...current, [name]: value, ...(name === 'region_id' ? { city_id: '' } : {}) }))
  }
  function updateTicketType(index, field, value) {
    setForm((current) => ({
      ...current,
      ticketTypes: (current.ticketTypes || []).map((ticket, ticketIndex) => ticketIndex === index ? { ...ticket, [field]: value } : ticket),
    }))
  }

  function addTicketType() {
    setForm((current) => ({
      ...current,
      ticketTypes: [
        ...(current.ticketTypes || []),
        { name: '', description: '', price: '0', quantity: '', is_active: true },
      ].slice(0, 6),
    }))
  }

  function removeTicketType(index) {
    setForm((current) => ({
      ...current,
      ticketTypes: (current.ticketTypes || []).filter((_, ticketIndex) => ticketIndex !== index),
    }))
  }

  async function handleDeleteImage(image) {
    if (!onDeleteExistingImage) return
    setImageBusy(true)
    setError('')
    try {
      const event = await onDeleteExistingImage(image)
      setForm((current) => ({ ...current, ...imageStateFromEvent(event) }))
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete image.')
    } finally {
      setImageBusy(false)
    }
  }

  async function handleSetCover(image) {
    if (!onSetExistingCover) return
    setImageBusy(true)
    setError('')
    try {
      const event = await onSetExistingCover(image)
      setForm((current) => ({ ...current, ...imageStateFromEvent(event) }))
    } catch (coverError) {
      setError(coverError?.message || 'Unable to update cover image.')
    } finally {
      setImageBusy(false)
    }
  }

  function validateForm() {
    setError('')
    if (!form.title.trim()) return setError('Event title is required.')
    if (!form.description.trim()) return setError('Event description is required.')
    if (!form.category_id) return setError('Category is required.')
    if (!form.startDate) return setError('Start date is required.')
    if (!form.coverImage && !form.existingCoverImage) return setError('Please upload or choose a cover photo.')
    if (existingGalleryCount + selectedGalleryCount > MAX_GALLERY_IMAGES) return setError(`Gallery images are limited to ${MAX_GALLERY_IMAGES}.`)
    const validTicketTypes = (form.ticketTypes || []).filter((ticket) => ticket.name?.trim())
    if (validTicketTypes.length === 0) return setError('Add at least one ticket type, for example Classic or Free.')
    if (validTicketTypes.some((ticket) => Number(ticket.price || 0) < 0)) return setError('Ticket type prices cannot be negative.')
    return true
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (validateForm()) onSubmit(form)
  }

  function handleDraft() {
    if (validateForm()) onDraft(form)
  }

  if (optionsLoading) return <Loader message="Preparing event form..." />

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {error && <Alert type="error">{error}</Alert>}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">Event basics</h2>
        <div className="grid gap-4">
          <FormInput label="Event title" name="title" value={form.title} onChange={updateTextField} placeholder="Douala Tech Summit" required />
          <FormTextarea label="Description" name="description" value={form.description} onChange={updateTextField} rows="5" placeholder="Describe the experience, audience, program and benefits." required />
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect label="Category" value={form.category_id} onChange={(value) => updateValue('category_id', value)} options={categoryOptions} placeholder="Select category" />
            <SearchableSelect label="Visibility" value={form.visibility} onChange={(value) => updateValue('visibility', value)} options={EVENT_VISIBILITIES.map((v) => ({ value: v.value, label: v.label }))} placeholder="Select visibility" />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">Location</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <SearchableSelect label="Region" value={form.region_id} onChange={(value) => updateValue('region_id', value)} options={regionOptions} placeholder="Select region" />
          <SearchableSelect label="City" value={form.city_id} onChange={(value) => updateValue('city_id', value)} options={cityOptions} placeholder="Select city" />
            <FormInput label="Venue" name="venue" value={form.venue} onChange={updateTextField} placeholder="Bonanjo Conference Hall" />
        </div>
        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-slate-700">Pin on map</span>
          <LocationPicker
            value={{ venue: form.venue, latitude: form.latitude, longitude: form.longitude }}
            onChange={({ latitude, longitude, venue }) => setForm((current) => ({ ...current, latitude, longitude, venue: venue ?? current.venue }))}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">Schedule and capacity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DateTimeField label="Start date and time" name="startDate" value={form.startDate} onChange={updateTextField} helper="When the event begins." required />
          <DateTimeField label="End date and time" name="endDate" value={form.endDate} onChange={updateTextField} helper="Optional, but recommended for longer events." />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormInput label="Maximum participants" name="maximumParticipants" type="number" value={form.maximumParticipants} onChange={updateTextField} placeholder="500" min="1" />
          <DateTimeField label="Registration deadline" name="registrationDeadline" value={form.registrationDeadline} onChange={updateTextField} helper="Last moment attendees can register." />
        </div>
        <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Event price is calculated from the ticket types below. Use price 0 for free tickets.</p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Ticket types</h2>
            <p className="text-sm text-slate-600">Create free, Classic, VIP or VVIP tickets. The price selected by the attendee will be used for payment.</p>
          </div>
          <Button type="button" variant="secondary" onClick={addTicketType} disabled={(form.ticketTypes || []).length >= 6}>Add ticket type</Button>
        </div>
        <div className="grid gap-4">
          {(form.ticketTypes || []).map((ticket, index) => (
            <div key={ticket.id || index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_130px_130px_auto] md:items-end">
                <FormInput label="Ticket name" value={ticket.name} onChange={(event) => updateTicketType(index, 'name', event.target.value)} placeholder={index === 0 ? 'Classic' : 'VIP'} />
                <FormInput label="Description" value={ticket.description || ''} onChange={(event) => updateTicketType(index, 'description', event.target.value)} placeholder="Access details" />
                <FormInput label="Price (XAF)" type="number" min="0" value={ticket.price} onChange={(event) => updateTicketType(index, 'price', event.target.value)} />
                <FormInput label="Quantity" type="number" min="1" value={ticket.quantity || ''} onChange={(event) => updateTicketType(index, 'quantity', event.target.value)} placeholder="Unlimited" />
                <Button type="button" variant="danger" onClick={() => removeTicketType(index)} disabled={(form.ticketTypes || []).length <= 1}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-900">
          Tip: use <strong>Free</strong> with price 0 for free access, then add <strong>Classic</strong>, <strong>VIP</strong> or <strong>VVIP</strong> as needed.
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Event photos</h2>
            <p className="text-sm text-slate-600">Images are compressed before upload where possible. Gallery limit: {MAX_GALLERY_IMAGES} images.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{existingGalleryCount + selectedGalleryCount}/{MAX_GALLERY_IMAGES} gallery used</span>
        </div>

        {(form.existingCoverImage || existingGalleryCount > 0) && (
          <div className="mb-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Existing images</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {form.existingCoverImage && <ExistingImageCard image={form.existingCoverImage} isCover onDelete={handleDeleteImage} onSetCover={handleSetCover} busy={imageBusy} />}
              {(form.existingGalleryImages || []).map((image) => (
                <ExistingImageCard key={image.id} image={image} onDelete={handleDeleteImage} onSetCover={handleSetCover} busy={imageBusy} />
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <UploadBox title="Upload cover photo" description="Appears on event cards and details. Replaces the current cover." icon={ImagePlus} name="coverImage" onChange={updateFileField} selected={form.coverImage?.name} existing={form.existingCoverImage} />
          <UploadBox title="Add gallery photos" description={`Add up to ${galleryRemaining} more gallery image${galleryRemaining === 1 ? '' : 's'}.`} icon={Images} name="galleryImages" onChange={updateFileField} multiple selected={form.galleryImages?.length ? `${form.galleryImages.length} image(s) selected` : ''} existing={existingGalleryCount} />
        </div>

        {form.galleryImages?.length > 0 && (
          <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-teal-800">
            <UploadCloud className="mr-2 inline h-4 w-4" /> {form.galleryImages.length} new gallery image(s) ready for upload.
          </div>
        )}
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        {onDraft && (
          <Button type="button" variant="secondary" disabled={submitting || imageBusy} onClick={handleDraft}>
            Save as Draft
          </Button>
        )}
        <Button type="submit" disabled={submitting || imageBusy}>
          <Save className="mr-2 h-4 w-4" />
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

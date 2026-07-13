import { Eye, ImagePlus, Images, Save, Star, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
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
      setError(t('eventForm.errors.sourceImageSize', { size: MAX_SOURCE_IMAGE_MB }))
      return
    }

    if (name === 'galleryImages' && selectedFiles.length > galleryRemaining) {
      event.target.value = ''
      setError(t('eventForm.errors.galleryCount', { remaining: galleryRemaining, max: MAX_GALLERY_IMAGES }))
      return
    }

    const compressed = await Promise.all(selectedFiles.map(compressImage))
    if (compressed.some((file) => fileSizeMb(file) > MAX_OUTPUT_IMAGE_MB)) {
      event.target.value = ''
      setError(t('eventForm.errors.compressedImageSize', { size: MAX_OUTPUT_IMAGE_MB }))
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

  async function handleDeleteImage(image) {
    if (!onDeleteExistingImage) return
    setImageBusy(true)
    setError('')
    try {
      const event = await onDeleteExistingImage(image)
      setForm((current) => ({ ...current, ...imageStateFromEvent(event) }))
    } catch (deleteError) {
      setError(deleteError?.message || t('eventForm.errors.deleteImage'))
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
      setError(coverError?.message || t('eventForm.errors.updateCoverImage'))
    } finally {
      setImageBusy(false)
    }
  }

  function validateForm() {
    setError('')
    if (!form.title.trim()) return setError(t('eventForm.errors.titleRequired'))
    if (!form.description.trim()) return setError(t('eventForm.errors.descriptionRequired'))
    if (!form.category_id) return setError(t('eventForm.errors.categoryRequired'))
    if (!form.startDate) return setError(t('eventForm.errors.startDateRequired'))
    if (!form.coverImage && !form.existingCoverImage) return setError(t('eventForm.errors.coverRequired'))
    if (existingGalleryCount + selectedGalleryCount > MAX_GALLERY_IMAGES) return setError(t('eventForm.errors.galleryLimit'))
    return true
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (validateForm()) onSubmit(form)
  }

  function handleDraft() {
    if (validateForm()) onDraft(form)
  }

  if (optionsLoading) return <Loader message={t('eventForm.loadingMessage')} />

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {error && <Alert type="error">{error}</Alert>}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">{t('eventForm.sections.basicsTitle')}</h2>
        <div className="grid gap-4">
          <FormInput label={t('eventForm.titleLabel')} name="title" value={form.title} onChange={updateTextField} placeholder={t('eventForm.titlePlaceholder')} required />
          <FormTextarea label={t('eventForm.descriptionLabel')} name="description" value={form.description} onChange={updateTextField} rows="5" placeholder={t('eventForm.descriptionPlaceholder')} required />
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect label={t('eventForm.categoryLabel')} value={form.category_id} onChange={(value) => updateValue('category_id', value)} options={categoryOptions} placeholder={t('eventForm.categoryPlaceholder')} />
            <SearchableSelect label={t('eventForm.visibilityLabel')} value={form.visibility} onChange={(value) => updateValue('visibility', value)} options={EVENT_VISIBILITIES.map((v) => ({ value: v.value, label: v.label }))} placeholder={t('eventForm.visibilityPlaceholder')} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">{t('eventForm.sections.locationTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <SearchableSelect label={t('eventForm.regionLabel')} value={form.region_id} onChange={(value) => updateValue('region_id', value)} options={regionOptions} placeholder={t('eventForm.regionPlaceholder')} />
          <SearchableSelect label={t('eventForm.cityLabel')} value={form.city_id} onChange={(value) => updateValue('city_id', value)} options={cityOptions} placeholder={t('eventForm.cityPlaceholder')} />
          <FormInput label={t('eventForm.venueLabel')} name="venue" value={form.venue} onChange={updateTextField} placeholder={t('eventForm.venuePlaceholder')} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-black text-slate-950">{t('eventForm.sections.scheduleTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DateTimeField label={t('eventForm.startDateLabel')} name="startDate" value={form.startDate} onChange={updateTextField} helper={t('eventForm.startDateHelper')} required />
          <DateTimeField label={t('eventForm.endDateLabel')} name="endDate" value={form.endDate} onChange={updateTextField} helper={t('eventForm.endDateHelper')} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FormInput label={t('eventForm.priceLabel')} name="price" type="number" value={form.price} onChange={updateTextField} placeholder={t('eventForm.pricePlaceholder')} min="0" />
          <FormInput label={t('eventForm.capacityLabel')} name="maximumParticipants" type="number" value={form.maximumParticipants} onChange={updateTextField} placeholder={t('eventForm.capacityPlaceholder')} min="1" />
          <DateTimeField label={t('eventForm.registrationDeadlineLabel')} name="registrationDeadline" value={form.registrationDeadline} onChange={updateTextField} helper={t('eventForm.registrationDeadlineHelper')} />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t('eventForm.sections.photosTitle')}</h2>
            <p className="text-sm text-slate-600">{t('eventForm.sections.photosDescription', { limit: MAX_GALLERY_IMAGES })}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{existingGalleryCount + selectedGalleryCount}/{MAX_GALLERY_IMAGES} {t('eventForm.sections.galleryUsed')}</span>
        </div>

        {(form.existingCoverImage || existingGalleryCount > 0) && (
          <div className="mb-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{t('eventForm.sections.existingImagesTitle')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {form.existingCoverImage && <ExistingImageCard image={form.existingCoverImage} isCover onDelete={handleDeleteImage} onSetCover={handleSetCover} busy={imageBusy} />}
              {(form.existingGalleryImages || []).map((image) => (
                <ExistingImageCard key={image.id} image={image} onDelete={handleDeleteImage} onSetCover={handleSetCover} busy={imageBusy} />
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <UploadBox title={t('eventForm.coverImageTitle')} description={t('eventForm.coverImageDescription')} icon={ImagePlus} name="coverImage" onChange={updateFileField} selected={form.coverImage?.name} existing={form.existingCoverImage} />
          <UploadBox title={t('eventForm.galleryImagesTitle')} description={t('eventForm.galleryImagesDescription', { remaining: galleryRemaining })} icon={Images} name="galleryImages" onChange={updateFileField} multiple selected={form.galleryImages?.length ? t('eventForm.imagesSelected', { count: form.galleryImages.length }) : ''} existing={existingGalleryCount} />
        </div>

        {form.galleryImages?.length > 0 && (
          <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-teal-800">
            <UploadCloud className="mr-2 inline h-4 w-4" /> {t('eventForm.galleryReady', { count: form.galleryImages.length })}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        {onDraft && (
          <Button type="button" variant="secondary" disabled={submitting || imageBusy} onClick={handleDraft}>
            {t('eventForm.saveDraft')}
          </Button>
        )}
        <Button type="submit" disabled={submitting || imageBusy}>
          <Save className="mr-2 h-4 w-4" />
          {submitting ? t('eventForm.saving') : submitLabel}
        </Button>
      </div>
    </form>
  )
}

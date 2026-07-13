import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { FolderTree, ImagePlus, Plus, Search, Tags, Trash2 } from 'lucide-react'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ConfirmDialog from '../../../../shared/components/feedback/ConfirmDialog.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import AdminHero from '../components/AdminHero.jsx'
import AdminMetricCard from '../components/AdminMetricCard.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Modal from '../../../../shared/components/ui/Modal.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Textarea from '../../../../shared/components/ui/Textarea.jsx'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

const emptyForm = { name: '', description: '', image: null, removeImage: false }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: 'all' })
  const [form, setForm] = useState(emptyForm)
  const [modal, setModal] = useState({ open: false, category: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchCategories() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getCategories({ include_inactive: true })
      setCategories(extractCollection(response.data, 'categories'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load categories.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const filteredCategories = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return categories.filter((category) => {
      const matchesKeyword = !keyword
        || category.name?.toLowerCase().includes(keyword)
        || category.description?.toLowerCase().includes(keyword)
      const matchesStatus = filters.status === 'all'
        || (filters.status === 'active' && category.is_active)
        || (filters.status === 'disabled' && !category.is_active)
      return matchesKeyword && matchesStatus
    })
  }, [categories, filters])

  const metrics = useMemo(() => ({
    total: categories.length,
    active: categories.filter((category) => category.is_active).length,
    disabled: categories.filter((category) => !category.is_active).length,
    used: categories.filter((category) => Number(category.events_count || 0) > 0).length,
  }), [categories])

  function openCreateModal() {
    setForm(emptyForm)
    setModal({ open: true, category: null })
    setError('')
    setSuccess('')
  }

  function openEditModal(category) {
    setForm({ name: category.name || '', description: category.description || '', image: null, removeImage: false })
    setModal({ open: true, category })
    setError('')
    setSuccess('')
  }

  function closeModal() {
    setModal({ open: false, category: null })
    setForm(emptyForm)
  }


  function buildCategoryPayload(isActive = true) {
    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('description', form.description || '')
    payload.append('is_active', isActive ? '1' : '0')
    payload.append('remove_image', form.removeImage ? '1' : '0')
    if (form.image) payload.append('image', form.image)
    return payload
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (modal.category) {
        await adminService.updateCategory(modal.category.id, buildCategoryPayload(modal.category.is_active ?? true))
        setSuccess('Category updated successfully.')
        toast.success('Category updated successfully.')
      } else {
        await adminService.createCategory(buildCategoryPayload(true))
        setSuccess('Category created successfully.')
        toast.success('Category created successfully.')
      }

      closeModal()
      await fetchCategories()
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, 'Unable to save category.')
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleCategory(category) {
    setError('')
    setSuccess('')
    try {
      const payload = new FormData()
      payload.append('name', category.name)
      payload.append('description', category.description || '')
      payload.append('is_active', !category.is_active ? '1' : '0')
      await adminService.updateCategory(category.id, payload)
      toast.success(category.is_active ? 'Category disabled.' : 'Category enabled.')
      await fetchCategories()
    } catch (toggleError) {
      const message = getApiErrorMessage(toggleError, 'Unable to update category status.')
      setError(message)
      toast.error(message)
    }
  }

  async function deleteCategory() {
    if (!deleteTarget) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await adminService.deleteCategory(deleteTarget.id)
      toast.success('Category deleted successfully.')
      setDeleteTarget(null)
      await fetchCategories()
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Unable to delete category.')
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const rows = filteredCategories.map((category) => ({
    ...category,
    name: <div className="flex items-center gap-3"><div className="h-12 w-16 overflow-hidden rounded-2xl bg-slate-100">{category.image_url ? <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ImagePlus className="h-5 w-5" /></div>}</div><div><p className="font-bold text-slate-950">{category.name}</p><p className="text-xs text-slate-500">/{category.slug}</p></div></div>,
    description: <span className="line-clamp-2 text-slate-600">{category.description || 'No description'}</span>,
    eventCount: category.events_count ?? 0,
    status: <AdminStatusBadge status={category.is_active ? 'active' : 'disabled'} />,
    actions: (
      <AdminPageActions>
        <AdminActionButton onClick={() => openEditModal(category)}>Edit</AdminActionButton>
        <AdminActionButton onClick={() => toggleCategory(category)}>{category.is_active ? 'Disable' : 'Enable'}</AdminActionButton>
        <AdminActionButton onClick={() => setDeleteTarget(category)}>Delete</AdminActionButton>
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <AdminHero
        title="Manage categories"
        description="Create clear event categories so attendees can discover the right experiences faster."
        action={<Button variant="light" onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" /> New Category</Button>}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total categories" value={metrics.total} icon={FolderTree} gradient="from-indigo-600 to-blue-700" />
        <AdminMetricCard label="Active" value={metrics.active} icon={Tags} gradient="from-teal-600 to-emerald-700" />
        <AdminMetricCard label="Disabled" value={metrics.disabled} icon={Tags} gradient="from-slate-600 to-slate-800" />
        <AdminMetricCard label="Used by events" value={metrics.used} icon={Tags} gradient="from-amber-500 to-orange-700" />
      </div>

      {error && <div className="mt-6"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mt-6"><Alert type="success">{success}</Alert></div>}

      <div className="my-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            placeholder="Search categories"
            className="pl-10"
          />
        </div>
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <Button type="button" variant="secondary" onClick={() => setFilters({ keyword: '', status: 'all' })}>Reset</Button>
      </div>

      {loading && <Loader message="Loading categories..." />}
      {!loading && error && categories.length === 0 && <ErrorState title="Unable to load categories" message={error} />}
      {!loading && (
        <Table
          columns={[
            { key: 'name', label: 'Category' },
            { key: 'description', label: 'Description' },
            { key: 'eventCount', label: 'Events' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={rows}
        />
      )}

      <Modal open={modal.open} title={modal.category ? 'Edit category' : 'Create category'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="grid gap-2">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-teal-700 p-3 text-white sm:p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80 sm:text-sm">Category setup</p>
            <h3 className="mt-1 text-xl font-black sm:text-2xl">{modal.category ? 'Update category' : 'New category'}</h3>
            <p className="mt-2 text-xs leading-5 text-white/90 sm:mt-2 sm:text-sm sm:leading-6">Use short, recognizable names that help attendees filter events quickly.</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Category name</span>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Technology" required />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="3" placeholder="Describe the kind of events included in this category." />
          </label>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-32 w-full overflow-hidden rounded-2xl bg-white sm:h-28 sm:w-40">
                {form.image ? (
                  <img src={URL.createObjectURL(form.image)} alt="Selected category" className="h-full w-full object-cover" />
                ) : modal.category?.image_url && !form.removeImage ? (
                  <img src={modal.category.image_url} alt={modal.category.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400"><ImagePlus className="w-8" /></div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-950">Category image</p>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">JPG, PNG or WebP. Maximum 4MB. This image appears on public category cards and as an event fallback image.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 sm:px-4 sm:py-2">
                    <ImagePlus className="mr-2 h-4 w-4" /> Choose image
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(event) => setForm((current) => ({ ...current, image: event.target.files?.[0] || null, removeImage: false }))} />
                  </label>
                  {(form.image || modal.category?.image_url) && (
                    <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, image: null, removeImage: true }))} className="px-4 py-2.5 sm:px-4 sm:py-2">
                      <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? 'Saving...' : modal.category ? 'Update Category' : 'Create Category'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        message={`Delete category "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete category"
        loading={saving}
        onConfirm={deleteCategory}
        onClose={() => setDeleteTarget(null)}
      />
    </PageContainer>
  )
}

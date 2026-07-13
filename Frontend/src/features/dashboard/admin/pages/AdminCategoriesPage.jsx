import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [editingId, setEditingId] = useState(null)
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
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  function resetForm() {
    setForm({ name: '', description: '' })
    setEditingId(null)
  }

  function startEdit(category) {
    setEditingId(category.id)
    setForm({ name: category.name || '', description: category.description || '' })
    setSuccess('')
      toast.success('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')

    try {
      if (editingId) {
        const current = categories.find((category) => category.id === editingId)
        await adminService.updateCategory(editingId, {
          name: form.name,
          description: form.description || null,
          is_active: current?.is_active ?? true,
        })
        setSuccess('Category updated successfully.')
      toast.success('Category updated successfully.')
      } else {
        await adminService.createCategory({
          name: form.name,
          description: form.description || null,
          is_active: true,
        })
        setSuccess('Category created successfully.')
      toast.success('Category created successfully.')
      }

      resetForm()
      await fetchCategories()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to save category.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCategory(category) {
    setError('')
    setSuccess('')
      toast.success('')
    try {
      await adminService.updateCategory(category.id, {
        name: category.name,
        description: category.description || null,
        is_active: !category.is_active,
      })
      setSuccess(category.is_active ? 'Category disabled.' : 'Category enabled.')
      await fetchCategories()
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError, 'Unable to update category status.'))
      toast.error('Action failed. Please review the form and try again.')
    }
  }

  async function deleteCategory(category) {
    const confirmed = window.confirm(`Delete category "${category.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setError('')
    setSuccess('')
      toast.success('')
    try {
      await adminService.deleteCategory(category.id)
      setSuccess('Category deleted successfully.')
      toast.success('Category deleted successfully.')
      await fetchCategories()
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Unable to delete category.'))
      toast.error('Action failed. Please review the form and try again.')
    }
  }

  const rows = categories.map((category) => ({
    ...category,
    eventCount: category.events_count ?? 0,
    status: <AdminStatusBadge status={category.is_active ? 'active' : 'disabled'} />,
    actions: (
      <AdminPageActions>
        <AdminActionButton onClick={() => startEdit(category)}>Edit</AdminActionButton>
        <AdminActionButton onClick={() => toggleCategory(category)}>{category.is_active ? 'Disable' : 'Enable'}</AdminActionButton>
        <AdminActionButton onClick={() => deleteCategory(category)}>Delete</AdminActionButton>
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <SectionHeader title="Manage Categories" description="Create, update, enable, and disable event categories." />

      {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-6"><Alert type="success">{success}</Alert></div>}

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[1fr_2fr_auto_auto]">
        <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" required />
        <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Category'}</Button>
        {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
      </form>

      {loading && <Loader message="Loading categories..." />}
      {!loading && error && categories.length === 0 && <ErrorState title="Unable to load categories" message={error} />}
      {!loading && categories.length > 0 && (
        <Table columns={[{ key: 'name', label: 'Category' }, { key: 'description', label: 'Description' }, { key: 'eventCount', label: 'Events' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={rows} />
      )}
    </PageContainer>
  )
}

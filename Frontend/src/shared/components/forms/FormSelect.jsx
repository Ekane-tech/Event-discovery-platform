import Select from '../ui/Select.jsx'

export default function FormSelect({ label, error, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <Select {...props}>{children}</Select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  )
}

export default function PreferenceToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <span>
        <span className="block font-medium text-slate-950">{label}</span>
        {description && <span className="mt-1 block text-sm text-slate-600">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 accent-blue-700"
      />
    </label>
  )
}
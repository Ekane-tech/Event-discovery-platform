import Textarea from '../ui/Textarea.jsx'
export default function FormTextarea({ label, error, ...props }) { return <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span><Textarea {...props}/>{error&&<p className="mt-1 text-sm text-red-600">{error}</p>}</label> }

import { LoaderCircle } from 'lucide-react'

export default function Loader({ message = 'Please wait while we prepare your content.' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-teal-700" />
      <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>
    </div>
  )
}

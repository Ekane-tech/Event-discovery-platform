import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ className = '', type = 'text', ...props }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  if (!isPassword) {
    return <input className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 ${className}`} type={type} {...props} />
  }

  return (
    <div className="relative">
      <input
        className={`h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 ${className}`}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-3 flex items-center text-slate-500"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
}

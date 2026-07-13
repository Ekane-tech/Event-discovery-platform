export default function PasswordChecklist({ password = '', confirmation = '' }) {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a letter', valid: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Passwords match', valid: password && password === confirmation },
  ]

  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Password checks</p>
      <div className="grid gap-1">
        {checks.map((check) => (
          <p key={check.label} className={`text-xs ${check.valid ? 'text-green-700' : 'text-slate-500'}`}>
            {check.valid ? '✓' : '○'} {check.label}
          </p>
        ))}
      </div>
    </div>
  )
}
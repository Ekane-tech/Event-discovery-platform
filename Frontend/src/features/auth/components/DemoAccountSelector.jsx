import { ShieldCheck, User, Users } from 'lucide-react'

const accountIcons = {
  user: User,
  organizer: Users,
  admin: ShieldCheck,
}

export default function DemoAccountSelector({ accounts = [], onSelect }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
      <p className="text-sm font-bold text-slate-800">Demo accounts from Laravel</p>
      <p className="mt-1 text-xs text-slate-600">Password for all seeded accounts: <strong>password1</strong></p>
      <div className="mt-3 grid gap-2">
        {accounts.map((account) => {
          const Icon = accountIcons[account.role] || User
          return (
            <button
              key={account.email}
              type="button"
              onClick={() => onSelect(account.email)}
              className="flex items-center gap-3 rounded-2xl border border-white bg-white px-3 py-3 text-left text-sm shadow-sm transition hover:border-teal-200 hover:bg-teal-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-900">{account.label}</span>
                <span className="block truncate text-xs text-slate-500">{account.email}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

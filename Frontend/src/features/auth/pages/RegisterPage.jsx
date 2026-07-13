import { ArrowRight, CalendarCheck, Ticket, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import FormSelect from '../../../shared/components/forms/FormSelect.jsx'
import { CAMEROON_REGIONS } from '../../../shared/constants/regions.js'
import AuthCard from '../components/AuthCard.jsx'
import PasswordChecklist from '../components/PasswordChecklist.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPathByRole } from '../utils/authRedirects.js'

const ACCOUNT_TYPES = [
  { value: 'user', title: 'Attend events', description: 'Discover events, save favorites, register and manage tickets.', icon: Ticket },
  { value: 'organizer', title: 'Provide services', description: 'Create events, manage attendees, upload images and track performance.', icon: CalendarCheck },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ accountType: '', name: '', email: '', phone: '', city: '', region: 'Littoral', preferredLanguage: 'English', password: '', passwordConfirmation: '' })

  function updateField(event) { setError(''); setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function chooseAccountType(accountType) { setError(''); setForm((current) => ({ ...current, accountType })) }

  async function handleSubmit(event) {
    event.preventDefault(); setError('')
    if (!form.accountType) return setError('Please choose how you want to use the platform.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/[a-zA-Z]/.test(form.password)) return setError('Password must contain at least one letter.')
    if (!/\d/.test(form.password)) return setError('Password must contain at least one number.')
    if (form.password !== form.passwordConfirmation) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      const user = await register(form)
      navigate(user.role === 'user' ? '/interests' : getDashboardPathByRole(user.role), { replace: true })
    } catch (registerError) { setError(registerError.message) } finally { setSubmitting(false) }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_540px] lg:px-8 lg:py-14">
      <section className="hidden lg:block">
        <div className="sticky top-28 overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl">
          <img src="/hero-events.svg" alt="Event crowd" className="h-[600px] w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white"><Users className="mb-4 h-10 w-10 text-teal-300" /><h2 className="text-4xl font-black">Join the event ecosystem.</h2><p className="mt-4 max-w-lg text-slate-200">Choose whether you want to attend events or provide event services.</p></div>
        </div>
      </section>
      <section>
        <AuthCard eyebrow="Create account" title="How do you want to start?" description="Choose your account type, then complete your profile." footer={<>Already have an account? <Link className="font-bold text-teal-700" to="/login">Sign in</Link></>}>
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPES.map((item) => {
              const Icon = item.icon
              const active = form.accountType === item.value
              return (
                <button key={item.value} type="button" onClick={() => chooseAccountType(item.value)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'}`}>
                  <Icon className="h-6 w-6 text-teal-700" />
                  <h3 className="mt-3 font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                </button>
              )
            })}
          </div>
          {form.accountType && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <FormInput label="Full name" name="name" value={form.name} onChange={updateField} placeholder="Your name" required />
              <FormInput label="Email address" name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
              <div className="grid gap-4 sm:grid-cols-2"><FormInput label="Phone" name="phone" value={form.phone} onChange={updateField} placeholder="+237 6XX XXX XXX" /><FormInput label="City" name="city" value={form.city} onChange={updateField} placeholder="Douala" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><FormSelect label="Region" name="region" value={form.region} onChange={updateField}>{CAMEROON_REGIONS.map((region) => <option key={region}>{region}</option>)}</FormSelect><FormSelect label="Language" name="preferredLanguage" value={form.preferredLanguage} onChange={updateField}><option>English</option><option>French</option></FormSelect></div>
              <FormInput label="Password" name="password" type="password" value={form.password} onChange={updateField} placeholder="Example: password1" required />
              <FormInput label="Confirm password" name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required />
              <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />
              <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-pink-600 hover:bg-pink-700">{submitting ? 'Creating account...' : 'Create account'}{!submitting && <ArrowRight className="h-4 w-4" />}</Button>
            </form>
          )}
        </AuthCard>
      </section>
    </main>
  )
}

import { BarChart3, Bell, CalendarCheck, CheckCircle2, CreditCard, Heart, Mail, MapPin, Phone, Settings, ShieldCheck, Ticket, UserRound, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatPrice } from '../../../shared/utils/currency.js'
import { dashboardService } from '../../dashboard/services/dashboardService.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useProfileApi } from '../hooks/useProfileApi.js'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 shrink-0 text-teal-700" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 break-words font-semibold text-slate-800">{value || 'Not provided'}</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15" />
      <Icon className="relative h-6 w-6" />
      <p className="relative mt-3 text-3xl font-black">{value}</p>
      <p className="relative text-sm text-white/85">{label}</p>
    </div>
  )
}

function getRoleConfig(role) {
  if (role === 'admin') {
    return {
      eyebrow: 'Administrator profile',
      title: 'System command profile',
      description: 'Manage platform trust, moderation, payments, users, reports and operational visibility for Mboa Events 237.',
      gradient: 'linear-gradient(90deg, rgba(15,23,42,.94), rgba(88,28,135,.72)), url(/hero-events.svg)',
      dashboardPath: '/admin/dashboard',
      dashboardLabel: 'Admin Dashboard',
    }
  }

  if (role === 'organizer') {
    return {
      eyebrow: 'Organizer profile',
      title: 'Organizer identity and event presence',
      description: 'Keep your organizer profile ready for attendees, event moderation and communication on Mboa Events 237.',
      gradient: 'linear-gradient(90deg, rgba(2,6,23,.92), rgba(15,118,110,.72)), url(/hero-events.svg)',
      dashboardPath: '/organizer/dashboard',
      dashboardLabel: 'Organizer Dashboard',
    }
  }

  return {
    eyebrow: 'Attendee profile',
    title: 'Your Mboa event profile',
    description: 'Manage your contact details, interests, tickets and event activity across Cameroon.',
    gradient: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)',
    dashboardPath: '/dashboard',
    dashboardLabel: 'Dashboard',
  }
}

export default function ProfilePage() {
  const { profile, loading, error } = useProfileApi()
  const [dashboard, setDashboard] = useState(null)
  const [dashboardError, setDashboardError] = useState('')

  const role = String(profile?.role || 'user').toLowerCase()
  const config = getRoleConfig(role)

  useEffect(() => {
    if (!profile?.role) return

    async function fetchDashboard() {
      setDashboardError('')
      try {
        const response = profile.role === 'admin'
          ? await dashboardService.getAdminDashboard()
          : profile.role === 'organizer'
            ? await dashboardService.getOrganizerDashboard()
            : await dashboardService.getUserDashboard()
        setDashboard(response.data)
      } catch (fetchError) {
        setDashboardError(getApiErrorMessage(fetchError, 'Unable to load profile metrics.'))
      }
    }

    fetchDashboard()
  }, [profile?.role])

  const metrics = useMemo(() => {
    const summary = dashboard?.summary || {}

    if (role === 'admin') {
      return [
        ['Users', summary.users_count || 0, Users, 'from-indigo-600 to-blue-700'],
        ['Events', summary.events_count || 0, CalendarCheck, 'from-teal-600 to-emerald-700'],
        ['Open reports', summary.open_reports_count || 0, ShieldCheck, 'from-rose-600 to-pink-700'],
        ['Registrations', summary.registrations_count || 0, Ticket, 'from-slate-600 to-slate-800'],
      ]
    }

    if (role === 'organizer') {
      return [
        ['Events', summary.events_count || 0, CalendarCheck, 'from-teal-600 to-emerald-700'],
        ['Registrations', summary.total_registrations || 0, Ticket, 'from-blue-600 to-indigo-700'],
        ['Views', summary.total_views || 0, BarChart3, 'from-purple-600 to-violet-800'],
        ['Revenue', Number(summary.revenue || 0) === 0 ? '0' : formatPrice(summary.revenue), Wallet, 'from-amber-500 to-orange-700'],
      ]
    }

    return [
      ['Interests', summary.interests_count || 0, Heart, 'from-pink-600 to-rose-700'],
      ['Saved events', summary.bookmarks_count || 0, CalendarCheck, 'from-teal-600 to-emerald-700'],
      ['Registrations', summary.registrations_count || 0, Ticket, 'from-blue-600 to-indigo-700'],
      ['Recommendations', summary.recommendations_count || 0, Users, 'from-purple-600 to-violet-800'],
    ]
  }, [dashboard, role])

  if (loading) return <PageContainer><Loader message="Loading profile..." /></PageContainer>

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: config.gradient }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={profile?.name} src={profile?.avatar} className="h-24 w-24 text-3xl" />
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-bold capitalize text-teal-100">{config.eyebrow}</span>
              <h1 className="mt-3 text-4xl font-black">{profile?.name}</h1>
              {role === 'organizer' && profile?.organizationName && <p className="mt-1 text-lg font-bold text-teal-100">{profile.organizationName}</p>}
              <p className="mt-1 text-slate-200">{profile?.email}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{config.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={config.dashboardPath}><Button variant="secondary">{config.dashboardLabel}</Button></Link>
            <Link to="/profile/edit"><Button variant="light"><Settings className="mr-2 h-4 w-4" />Edit Profile</Button></Link>
          </div>
        </div>
      </section>

      {error && <div className="mt-6"><Alert type="error">{error}</Alert></div>}
      {dashboardError && <div className="mt-6"><Alert type="warning">{dashboardError}</Alert></div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, gradient]) => <MetricCard key={label} label={label} value={value} icon={Icon} gradient={gradient} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <Card>
          <h2 className="mb-4 text-xl font-black text-slate-950">Profile information</h2>
          <div className="grid gap-3">
            {role === 'organizer' && <InfoRow icon={ShieldCheck} label="Organizer name" value={profile?.organizationName} />}
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow icon={MapPin} label="Location" value={`${profile?.city || ''}${profile?.city && profile?.region ? ', ' : ''}${profile?.region || ''}`} />
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={CheckCircle2} label="Email verification" value={profile?.emailVerifiedAt ? 'Verified' : 'Not verified'} />
            <InfoRow icon={UserRound} label="Role" value={role} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-black text-slate-950">{role === 'admin' ? 'Administrative note' : role === 'organizer' ? 'Organizer bio' : 'Bio'}</h2>
          <p className="text-sm leading-7 text-slate-600">{profile?.bio || (role === 'organizer' ? 'Add a short organizer bio so attendees understand your event brand.' : role === 'admin' ? 'Add an internal note about your administrative role.' : 'No bio added yet.')}</p>
          <div className="mt-6 grid gap-3">
            {role === 'admin' && <><Link to="/admin/users"><Button className="w-full">Manage Users</Button></Link><Link to="/admin/audit-logs"><Button variant="secondary" className="w-full">View Audit Logs</Button></Link></>}
            {role === 'organizer' && <><Link to="/organizer/events/create"><Button className="w-full">Create Event</Button></Link><Link to="/organizer/events"><Button variant="secondary" className="w-full">Manage My Events</Button></Link></>}
            {role === 'user' && <><Link to="/my-interests"><Button className="w-full">Update Interests</Button></Link><Link to="/registrations"><Button variant="secondary" className="w-full">View Registrations</Button></Link></>}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}

import { CalendarCheck, Heart, Mail, MapPin, Phone, Settings, Ticket, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { useInterests } from '../../interests/hooks/useInterests.js'
import SelectedInterestsSummary from '../../interests/components/SelectedInterestsSummary.jsx'
import { useRegistrations } from '../../registrations/hooks/useRegistrations.js'
import { useProfileApi } from '../hooks/useProfileApi.js'

function InfoRow({ icon: Icon, label, value }) {
  return <div className="flex gap-3 rounded-2xl bg-slate-50 p-4"><Icon className="h-5 w-5 text-teal-700"/><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value || 'Not provided'}</p></div></div>
}

export default function ProfilePage() {
  const { profile, loading, error } = useProfileApi()
  const { selectedInterests, selectedCount } = useInterests()
  const { bookmarkCount } = useBookmarks()
  const { registrationCount } = useRegistrations()
  if (loading) return <PageContainer><Loader message="Loading profile..." /></PageContainer>

  return <PageContainer><section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{backgroundImage:'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)'}}><div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="flex items-center gap-5"><Avatar name={profile?.name} src={profile?.avatar}/><div><span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-bold capitalize text-teal-100">{profile?.role}</span><h1 className="mt-3 text-4xl font-black">{profile?.name}</h1><p className="mt-1 text-slate-200">{profile?.email}</p></div></div><Link to="/profile/edit"><Button className="bg-white text-slate-950 hover:bg-slate-100"><Settings className="mr-2 h-4 w-4"/>Edit Profile</Button></Link></div></section>{error&&<div className="mt-6"><Alert type="error">{error}</Alert></div>}<div className="mt-6 grid gap-4 md:grid-cols-3"><Card><Heart className="h-5 w-5 text-pink-600"/><p className="mt-3 text-3xl font-black">{selectedCount}</p><p className="text-sm text-slate-600">Interests</p></Card><Card><CalendarCheck className="h-5 w-5 text-teal-700"/><p className="mt-3 text-3xl font-black">{bookmarkCount}</p><p className="text-sm text-slate-600">Saved events</p></Card><Card><Ticket className="h-5 w-5 text-blue-700"/><p className="mt-3 text-3xl font-black">{registrationCount}</p><p className="text-sm text-slate-600">Registrations</p></Card></div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]"><Card><h2 className="mb-4 text-xl font-black text-slate-950">Profile information</h2><div className="grid gap-3"><InfoRow icon={Phone} label="Phone" value={profile?.phone}/><InfoRow icon={MapPin} label="Location" value={`${profile?.city || ''}${profile?.city&&profile?.region?', ':''}${profile?.region || ''}`}/><InfoRow icon={Mail} label="Email" value={profile?.email}/><InfoRow icon={UserRound} label="Language" value={profile?.preferredLanguage}/></div></Card><Card><h2 className="mb-4 text-xl font-black text-slate-950">Bio</h2><p className="text-sm leading-7 text-slate-600">{profile?.bio || 'No bio added yet.'}</p><div className="mt-6"><h3 className="mb-3 font-bold text-slate-950">Notification interests</h3><SelectedInterestsSummary selectedInterests={selectedInterests}/><Link to="/interests" className="mt-4 inline-block"><Button variant="secondary">Update Interests</Button></Link></div></Card></div></PageContainer>
}

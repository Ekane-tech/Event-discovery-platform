import Avatar from '../../../shared/components/ui/Avatar.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ProfileInfoCard({ user }) {
  const { t } = useTranslation()
  const notProvided = t('profile.notProvided', 'Not provided')
  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user?.name} src={user?.avatar} />
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{user?.name}</h2>
          <p className="text-slate-600">{user?.email}</p>
          <p className="mt-1 text-sm capitalize text-slate-500">{t('profile.role', 'Role')}: {user?.role}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <p><strong>{t('profile.phone', 'Phone')}:</strong> {user?.phone || notProvided}</p>
        <p><strong>{t('profile.city', 'City')}:</strong> {user?.city || notProvided}</p>
        <p><strong>{t('profile.region', 'Region')}:</strong> {user?.region || notProvided}</p>
        <p><strong>{t('profile.preferredLanguage', 'Preferred language')}:</strong> {user?.preferredLanguage || t('english', 'English')}</p>
      </div>

      <div className="mt-6">
        <p className="font-bold text-slate-950">{t('profile.bio', 'Bio')}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{user?.bio || t('profile.noBio', 'No bio added yet.')}</p>
      </div>
    </Card>
  )
}

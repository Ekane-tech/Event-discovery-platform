import Avatar from '../../../shared/components/ui/Avatar.jsx'
import Card from '../../../shared/components/ui/Card.jsx'

export default function ProfileInfoCard({ user }) {
  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user?.name} src={user?.avatar} />
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{user?.name}</h2>
          <p className="text-slate-600">{user?.email}</p>
          <p className="mt-1 text-sm capitalize text-slate-500">Role: {user?.role}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
        <p><strong>City:</strong> {user?.city || 'Not provided'}</p>
        <p><strong>Region:</strong> {user?.region || 'Not provided'}</p>
        <p><strong>Preferred language:</strong> {user?.preferredLanguage || 'English'}</p>
      </div>

      <div className="mt-6">
        <p className="font-bold text-slate-950">Bio</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{user?.bio || 'No bio added yet.'}</p>
      </div>
    </Card>
  )
}
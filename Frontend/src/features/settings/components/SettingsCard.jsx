import { Link } from 'react-router-dom'
import Card from '../../../shared/components/ui/Card.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
export default function SettingsCard({ title, description, to, actionLabel='Open', icon: Icon }) {return <Card className="flex h-full flex-col transition hover:-translate-y-1 hover:shadow-xl">{Icon&&<span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5"/></span>}<h2 className="font-black text-slate-950">{title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p><Link to={to} className="mt-5"><Button variant="secondary" className="w-full">{actionLabel}</Button></Link></Card>}

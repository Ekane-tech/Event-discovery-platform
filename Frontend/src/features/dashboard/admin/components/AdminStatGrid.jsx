import Card from '../../../../shared/components/ui/Card.jsx'

export default function AdminStatGrid({ stats = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm text-slate-600">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{stat.value}</p>
          {stat.description && <p className="mt-1 text-xs text-slate-500">{stat.description}</p>}
        </Card>
      ))}
    </div>
  )
}

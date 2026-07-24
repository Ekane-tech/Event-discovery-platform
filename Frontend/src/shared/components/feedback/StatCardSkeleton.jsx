import { Skeleton } from './Skeleton.jsx'

export default function StatCardSkeleton({ compact = false }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${compact ? 'max-w-sm' : ''}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-8 w-14" />
      </div>
      <Skeleton className="mt-4 h-4 w-32" />
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => <StatCardSkeleton key={index} />)}
    </div>
  )
}

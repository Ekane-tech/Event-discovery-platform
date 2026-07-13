export function Skeleton({ className = '' }) { return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} /> }
export function TextSkeleton({ lines = 3 }) { return <div className="grid gap-2">{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}</div> }

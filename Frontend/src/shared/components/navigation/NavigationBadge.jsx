export default function NavigationBadge({ count = 0 }) {
  if (!count) return null

  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

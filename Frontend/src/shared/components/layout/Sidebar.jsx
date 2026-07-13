import { NavLink } from 'react-router-dom'

export default function Sidebar({ links = [] }) {
  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 md:w-64">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

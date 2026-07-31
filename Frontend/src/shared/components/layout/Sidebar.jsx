import { NavLink } from 'react-router-dom'

export default function Sidebar({ links = [] }) {
  return (
    <aside className="w-1/2 rounded-2xl border border-teal-500/20 bg-white p-2 md:w-64">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

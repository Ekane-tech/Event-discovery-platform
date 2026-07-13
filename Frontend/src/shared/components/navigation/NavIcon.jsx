import {
  BarChart3,
  Bell,
  Bookmark,
  Boxes,
  CalendarCheck,
  CalendarDays,
  CalendarSearch,
  CreditCard,
  Heart,
  History,
  LayoutDashboard,
  MapPin,
  PlusSquare,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
} from 'lucide-react'

const iconMap = {
  barChart3: BarChart3,
  bell: Bell,
  bookmark: Bookmark,
  boxes: Boxes,
  calendarCheck: CalendarCheck,
  calendarDays: CalendarDays,
  calendarSearch: CalendarSearch,
  creditCard: CreditCard,
  heart: Heart,
  history: History,
  layoutDashboard: LayoutDashboard,
  mapPin: MapPin,
  plusSquare: PlusSquare,
  search: Search,
  send: Send,
  settings: Settings,
  shield: ShieldCheck,
  sparkles: Sparkles,
  ticket: Ticket,
  user: User,
  users: Users,
}

export default function NavIcon({ name, className = '' }) {
  const Icon = iconMap[name] || LayoutDashboard
  return <Icon className={`h-5 w-5 shrink-0 ${className}`} strokeWidth={2} />
}

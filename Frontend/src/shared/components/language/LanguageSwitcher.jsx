import { Globe2 } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation.js'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage } = useTranslation()

  return (
    <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
      {!compact && <Globe2 className="h-4 w-4 text-teal-700" />}
      <select id="language-switcher" name="language" value={language} onChange={(event) => setLanguage(event.target.value)} className="bg-transparent outline-none">
        <option value="en">EN</option>
        <option value="fr">FR</option>
      </select>
    </label>
  )
}

import { useTranslation } from '../../../../shared/i18n/useTranslation.js'

export default function AdminHero({ eyebrow, title, description, action }) {
  const { t } = useTranslation()
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
          {eyebrow || t('admin.common.adminConsole', 'Admin console')}
        </span>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

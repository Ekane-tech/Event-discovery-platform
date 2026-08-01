import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function PasswordChecklist({ password = '', confirmation = '' }) {
  const { t } = useTranslation()
  const checks = [
    { label: t('auth.checkMinLength'), valid: password.length >= 8 },
    { label: t('auth.checkLetter'), valid: /[a-zA-Z]/.test(password) },
    { label: t('auth.checkNumber'), valid: /\d/.test(password) },
    { label: t('auth.checkMatch'), valid: password && password === confirmation },
  ]

  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{t('auth.passwordChecks')}</p>
      <div className="grid gap-1">
        {checks.map((check) => (
          <p key={check.label} className={`text-xs ${check.valid ? 'text-green-700' : 'text-slate-500'}`}>
            {check.valid ? '✓' : '○'} {check.label}
          </p>
        ))}
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'

export default function Spinner({ label }) {
  const { t } = useTranslation()
  const text = label ?? t('common.loading')
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink-700 border-t-brand-400 shadow-neon" />
      <p className="font-mono text-xs uppercase tracking-widest">{text}</p>
    </div>
  )
}

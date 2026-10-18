import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogs } from '../hooks/useLogs'
import { toISODate, weekId } from '../lib/dates'

// Shown on the Home screen when there's no body-weight entry for the current
// week. Because it keys off weekId, it appears every Monday (new week) and
// stays until logged, then returns next week.
export default function WeightReminder() {
  const { t } = useTranslation()
  const { weights, saveWeight } = useLogs()
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const currentWeek = weekId(new Date())
  const alreadyLogged = weights.some((w) => w.weekId === currentWeek)
  if (alreadyLogged) return null

  async function handleSave() {
    const n = Number(value)
    if (!n || n <= 0) return
    setSaving(true)
    try {
      await saveWeight({ weekId: currentWeek, date: toISODate(new Date()), weightKg: n })
      setValue('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card border-neon-pink/40 bg-neon-pink/5 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neon-pink/40 text-neon-pink">
          <ScaleIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">{t('weight.title')}</p>
          <p className="text-xs text-slate-400">{t('weight.subtitle')}</p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={t('weight.placeholder')}
                className="input pr-9"
                autoFocus
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">kg</span>
            </div>
            <button onClick={handleSave} disabled={saving || !value} className="btn-primary px-4">
              {saving ? '…' : t('weight.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScaleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8m-4 0 2.5 4.5a2.5 2.5 0 1 1-5 0L12 8z" />
    </svg>
  )
}

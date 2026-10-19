import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAchievements } from '../hooks/useAchievements'
import { TrophyIcon, LockIcon } from '../components/icons.jsx'

export default function Achievements() {
  const { t } = useTranslation()
  const { achievements, unlockedCount } = useAchievements()

  // Normal achievements in one list; secrets grouped on their own at the end.
  const { normal, secret } = useMemo(
    () => ({
      normal: achievements.filter((a) => a.tier !== 'secret'),
      secret: achievements.filter((a) => a.tier === 'secret'),
    }),
    [achievements],
  )

  return (
    <div className="space-y-5">
      <Link to="/account" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> {t('nav.account')}
      </Link>

      <div>
        <h1 className="neon-title text-2xl text-brand-300">{t('achievements.title')}</h1>
        <p className="text-sm text-slate-500">
          {t('achievements.unlockedOf', { unlocked: unlockedCount, total: achievements.length })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {normal.map((a) => (
          <AchievementRow key={a.id} a={a} t={t} />
        ))}
      </div>

      {secret.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            {t('achievements.tiers.secret')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {secret.map((a) => (
              <AchievementRow key={a.id} a={a} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AchievementRow({ a, t }) {
  const secretHidden = a.tier === 'secret' && !a.unlocked
  const title = secretHidden ? t('achievements.secretTitle') : t(`achievements.items.${a.id}.title`)
  const desc = secretHidden ? t('achievements.secretDesc') : t(`achievements.items.${a.id}.desc`)
  // Progress bar only for non-boolean, locked, non-secret achievements.
  const showBar = !a.unlocked && !secretHidden && a.target > 1
  const pct = a.target > 0 ? Math.min(100, Math.round((a.current / a.target) * 100)) : 0

  return (
    <div
      className={`card flex gap-3 p-4 ${
        a.unlocked ? 'border-brand-400/50 shadow-neon-soft' : 'opacity-90'
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
          a.unlocked
            ? 'border-brand-400/50 bg-brand-500/15 text-brand-300 shadow-neon'
            : 'border-slate-500/25 bg-ink-800/60 text-slate-500'
        }`}
      >
        {a.unlocked ? <TrophyIcon className="h-6 w-6" /> : <LockIcon className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${a.unlocked ? 'text-slate-100' : 'text-slate-400'}`}>
            {title}
          </p>
          {a.points > 0 && (
            <span
              className={`chip shrink-0 ${
                a.unlocked
                  ? 'border-brand-400/50 bg-brand-500/15 text-brand-300'
                  : 'border-slate-500/25 bg-ink-700/60 text-slate-500'
              }`}
            >
              {t('achievements.points', { count: a.points })}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>

        {showBar && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full bg-brand-500/70" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-right text-[10px] font-mono text-slate-500">
              {a.current}/{a.target}
            </p>
          </div>
        )}

        {a.unlocked && (
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
            {t('achievements.unlocked')}
          </p>
        )}
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

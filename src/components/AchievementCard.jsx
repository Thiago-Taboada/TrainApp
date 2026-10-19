import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAchievements } from '../hooks/useAchievements'
import { TrophyIcon } from './icons.jsx'

// Compact achievements card for the Account page: shows the most recent
// unlocked badges and a button to the full view.
export default function AchievementCard() {
  const { t } = useTranslation()
  const { achievements, unlockedCount } = useAchievements()

  // Show up to 4 unlocked (latest first by catalog order reversed is arbitrary;
  // we keep catalog order but prioritize unlocked).
  const unlocked = achievements.filter((a) => a.unlocked)
  const preview = unlocked.slice(-4).reverse()

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold uppercase tracking-wide text-slate-100">
          {t('achievements.title')}
        </h2>
        <Link to="/achievements" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
          {t('achievements.seeAll')}
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {t('achievements.unlockedOf', { unlocked: unlockedCount, total: achievements.length })}
      </p>

      {preview.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t('achievements.noneYet')}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {preview.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-brand-400/40 bg-brand-500/10 p-3 text-center"
              title={t(`achievements.items.${a.id}.desc`)}
            >
              <TrophyIcon className="h-6 w-6 text-brand-300" />
              <span className="text-[11px] font-semibold leading-tight text-slate-200">
                {t(`achievements.items.${a.id}.title`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

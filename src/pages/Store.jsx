import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { useAchievements } from '../hooks/useAchievements'
import { SLOT_COST } from '../lib/points'
import { THEMES } from '../lib/themes'
import Spinner from '../components/Spinner.jsx'
import { CoinIcon, CheckIcon } from '../components/icons.jsx'

export default function Store() {
  const { t } = useTranslation()
  const {
    routines,
    routineSlots,
    buyRoutineSlot,
    ownedThemes,
    activeTheme,
    buyTheme,
    setTheme,
    loading,
  } = useCatalog()
  const { loading: logsLoading } = useLogs()
  const { balance: points } = useAchievements()

  if (loading || logsLoading) return <Spinner />

  const customCount = routines.filter((r) => r.isCustom).length

  async function buySlot() {
    if (points < SLOT_COST) return
    if (!confirm(t('store.confirmSlot', { cost: SLOT_COST }))) return
    await buyRoutineSlot(SLOT_COST)
  }

  async function handleTheme(theme) {
    const owned = ownedThemes.includes(theme.id)
    if (owned) {
      if (theme.id !== activeTheme) await setTheme(theme.id)
      return
    }
    if (points < theme.price) return
    if (!confirm(t('store.confirmTheme', { price: theme.price, name: t('themes.' + theme.id) }))) return
    await buyTheme(theme.id, theme.price)
    await setTheme(theme.id) // activate right after buying
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="neon-title text-2xl text-brand-300">{t('store.title')}</h1>
        <p className="text-sm text-slate-500">{t('store.subtitle')}</p>
      </div>

      {/* Balance */}
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-400/50 text-brand-300 shadow-neon">
          <CoinIcon />
        </div>
        <div>
          <p className="label">{t('store.balance')}</p>
          <p className="font-display text-3xl font-extrabold text-brand-300 neon-text">{points}</p>
          <p className="text-xs text-slate-500">{t('store.points')}</p>
        </div>
      </div>

      {/* Item: routine slot */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100">{t('store.routineSlot')}</p>
            <p className="mt-0.5 text-sm text-slate-400">
              {t('store.routineSlotDesc', { used: customCount, total: routineSlots })}
            </p>
          </div>
          <span className="chip border-brand-400/40 bg-brand-500/10 text-brand-300">{SLOT_COST} pts</span>
        </div>
        <button
          onClick={buySlot}
          disabled={points < SLOT_COST}
          className="btn-primary mt-4 w-full"
        >
          {points < SLOT_COST ? t('store.need', { n: SLOT_COST - points }) : t('store.redeem')}
        </button>
      </div>

      {/* Themes */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t('store.themes')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const owned = ownedThemes.includes(theme.id)
            const active = theme.id === activeTheme
            const affordable = points >= theme.price
            return (
              <div
                key={theme.id}
                className={`card flex flex-col items-center gap-2 p-4 ${active ? 'border-brand-400/60 shadow-neon-soft' : ''}`}
              >
                <span
                  className="h-10 w-10 rounded-full"
                  style={{ background: theme.swatch, boxShadow: `0 0 14px ${theme.swatch}80` }}
                />
                <p className="text-sm font-semibold text-slate-200">{t('themes.' + theme.id)}</p>

                {active ? (
                  <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300">
                    <CheckIcon className="h-3 w-3" /> {t('store.active')}
                  </span>
                ) : owned ? (
                  <button onClick={() => handleTheme(theme)} className="btn-ghost w-full py-1.5 text-xs">
                    {t('store.use')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleTheme(theme)}
                    disabled={!affordable}
                    className="btn-primary w-full py-1.5 text-xs"
                  >
                    {affordable ? `${theme.price} pts` : t('store.needShort', { n: theme.price - points })}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-center text-xs text-slate-500">
        {t('store.earnHint')}{' '}
        <Link to="/" className="font-semibold text-brand-400">{t('store.seeHome')}</Link>
      </p>
    </div>
  )
}

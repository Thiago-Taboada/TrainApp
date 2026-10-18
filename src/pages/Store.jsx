import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { computeStreak } from '../lib/streak'
import { computeBalance, SLOT_COST } from '../lib/points'
import { THEMES } from '../lib/themes'
import Spinner from '../components/Spinner.jsx'
import { CoinIcon, CheckIcon } from '../components/icons.jsx'

export default function Store() {
  const {
    routines,
    routineSlots,
    pointsSpent,
    activeRoutines,
    buyRoutineSlot,
    ownedThemes,
    activeTheme,
    buyTheme,
    setTheme,
    loading,
  } = useCatalog()
  const { logs, loading: logsLoading } = useLogs()

  if (loading || logsLoading) return <Spinner />

  const trainedCount = logs.filter((l) => l.trained).length
  const { best: bestStreak } = computeStreak(logs, activeRoutines)
  const points = computeBalance(trainedCount, bestStreak, pointsSpent)
  const customCount = routines.filter((r) => r.isCustom).length

  async function buySlot() {
    if (points < SLOT_COST) return
    if (!confirm(`¿Canjear ${SLOT_COST} Vortx Points por un espacio de rutina extra?`)) return
    await buyRoutineSlot(SLOT_COST)
  }

  async function handleTheme(theme) {
    const owned = ownedThemes.includes(theme.id)
    if (owned) {
      if (theme.id !== activeTheme) await setTheme(theme.id)
      return
    }
    if (points < theme.price) return
    if (!confirm(`¿Canjear ${theme.price} Vortx Points por el tema ${theme.name}?`)) return
    await buyTheme(theme.id, theme.price)
    await setTheme(theme.id) // activate right after buying
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="neon-title text-2xl text-brand-300">Tienda</h1>
        <p className="text-sm text-slate-500">Canjea tus Vortx Points.</p>
      </div>

      {/* Balance */}
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-400/50 text-brand-300 shadow-neon">
          <CoinIcon />
        </div>
        <div>
          <p className="label">Tu saldo</p>
          <p className="font-display text-3xl font-extrabold text-brand-300 neon-text">{points}</p>
          <p className="text-xs text-slate-500">Vortx Points</p>
        </div>
      </div>

      {/* Item: routine slot */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100">Espacio de rutina extra</p>
            <p className="mt-0.5 text-sm text-slate-400">
              Crea una rutina propia más. Usas {customCount} de {routineSlots}.
            </p>
          </div>
          <span className="chip border-brand-400/40 bg-brand-500/10 text-brand-300">{SLOT_COST} pts</span>
        </div>
        <button
          onClick={buySlot}
          disabled={points < SLOT_COST}
          className="btn-primary mt-4 w-full"
        >
          {points < SLOT_COST ? `Te faltan ${SLOT_COST - points} pts` : 'Canjear'}
        </button>
      </div>

      {/* Themes */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Temas de color</h2>
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
                <p className="text-sm font-semibold text-slate-200">{theme.name}</p>

                {active ? (
                  <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300">
                    <CheckIcon className="h-3 w-3" /> Activo
                  </span>
                ) : owned ? (
                  <button onClick={() => handleTheme(theme)} className="btn-ghost w-full py-1.5 text-xs">
                    Usar
                  </button>
                ) : (
                  <button
                    onClick={() => handleTheme(theme)}
                    disabled={!affordable}
                    className="btn-primary w-full py-1.5 text-xs"
                  >
                    {affordable ? `${theme.price} pts` : `Faltan ${theme.price - points}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-center text-xs text-slate-500">
        Gana Vortx Points entrenando y manteniendo tu racha.{' '}
        <Link to="/" className="font-semibold text-brand-400">Ver inicio</Link>
      </p>
    </div>
  )
}

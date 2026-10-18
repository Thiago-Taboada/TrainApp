import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { computeStreak } from '../lib/streak'
import { computeBalance, SLOT_COST } from '../lib/points'
import Spinner from '../components/Spinner.jsx'
import { CoinIcon } from '../components/icons.jsx'

export default function Store() {
  const { routines, routineSlots, pointsSpent, activeRoutines, buyRoutineSlot, loading } = useCatalog()
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

      <p className="text-center text-xs text-slate-500">
        Gana Vortx Points entrenando y manteniendo tu racha.{' '}
        <Link to="/" className="font-semibold text-brand-400">Ver inicio</Link>
      </p>
    </div>
  )
}

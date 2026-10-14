import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { exportUserData } from '../lib/exportData'
import { fromISODate, toISODate, addDays } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'

export default function Account() {
  const { user, signOut } = useAuth()
  const { exercises, routines, activeRoutines, activeRoutineIds, loading } = useCatalog()
  const { logs, loading: logsLoading } = useLogs()

  const stats = useMemo(() => computeStats(logs), [logs])

  if (loading || logsLoading) return <Spinner />

  function handleExport() {
    exportUserData({
      user,
      logs,
      customExercises: exercises.filter((e) => e.isCustom),
      customRoutines: routines.filter((r) => r.isCustom),
      activeRoutineIds,
    })
  }

  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-5">
      <h1 className="neon-title text-2xl text-brand-300">Mi cuenta</h1>

      {/* Identity */}
      <div className="card flex items-center gap-4 p-5">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full border border-brand-400/50 shadow-neon" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-400/50 bg-ink-800 text-2xl font-bold text-brand-300 shadow-neon">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-100">{user?.displayName || 'Atleta'}</p>
          <p className="truncate text-sm text-slate-400">{user?.email}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-neon-pink">
            cuenta de Google
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entrenamientos" value={stats.total} tone="brand" />
        <Stat label="Racha (semanas)" value={stats.weekStreak} tone="pink" />
        <Stat label="Minutos totales" value={stats.totalMinutes} tone="brand" />
        <Stat label="Rutinas activas" value={activeRoutines.length} tone="pink" />
      </div>

      {/* Activity summary */}
      <div className="card p-5">
        <h2 className="mb-3 font-display font-bold uppercase tracking-wide text-slate-100">Actividad</h2>
        <Row label="Primer registro" value={stats.firstDate ?? '—'} />
        <Row label="Último entrenamiento" value={stats.lastDate ?? '—'} />
        <Row label="Promedio por sesión" value={stats.avgMinutes ? `${stats.avgMinutes} min` : '—'} />
        <Row label="Ejercicios propios" value={exercises.filter((e) => e.isCustom).length} last />
      </div>

      {/* Actions */}
      <div className="card divide-y divide-brand-500/15 p-1.5">
        <ActionRow onClick={handleExport} icon={<DownloadIcon />} label="Exportar mis datos" sub="Descarga un respaldo en JSON" />
      </div>

      <button
        onClick={signOut}
        className="btn w-full border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20"
      >
        <LogoutIcon /> Cerrar sesión
      </button>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Train App · v0.1.0
      </p>
    </div>
  )
}

function computeStats(logs) {
  const trained = logs.filter((l) => l.trained)
  const total = trained.length
  const totalMinutes = trained.reduce((a, l) => a + (Number(l.durationMinutes) || 0), 0)
  const withDuration = trained.filter((l) => Number(l.durationMinutes) > 0)
  const avgMinutes = withDuration.length
    ? Math.round(totalMinutes / withDuration.length)
    : 0

  const dates = trained.map((l) => l.date).sort()
  const firstDate = dates[0] ? fmt(dates[0]) : null
  const lastDate = dates.at(-1) ? fmt(dates.at(-1)) : null

  return {
    total,
    totalMinutes,
    avgMinutes,
    firstDate,
    lastDate,
    weekStreak: computeWeekStreak(trained),
  }
}

// Consecutive weeks (ending this week) with at least one trained session.
function computeWeekStreak(trained) {
  if (trained.length === 0) return 0
  const weeks = new Set(trained.map((l) => weekKey(fromISODate(l.date))))
  let streak = 0
  let cursor = new Date()
  // Walk back week by week while that week has activity.
  for (let i = 0; i < 520; i++) {
    const key = weekKey(cursor)
    if (weeks.has(key)) {
      streak++
    } else if (i > 0) {
      // allow the current week to be empty without breaking (grace)
      break
    }
    cursor = addDays(cursor, -7)
  }
  return streak
}

function weekKey(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return toISODate(d)
}

function fmt(iso) {
  return fromISODate(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Stat({ label, value, tone }) {
  const color = tone === 'pink' ? 'text-neon-pink neon-text-pink' : 'text-brand-300 neon-text'
  return (
    <div className="card p-4">
      <p className={`font-display text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  )
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b border-brand-500/10'}`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-200">{value}</span>
    </div>
  )
}

function ActionRow({ onClick, icon, label, sub }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-brand-500/10">
      <span className="text-brand-300">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-200">{label}</span>
        {sub && <span className="block text-xs text-slate-400">{sub}</span>}
      </span>
    </button>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0 4-4m-4 4 4 4M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" />
    </svg>
  )
}

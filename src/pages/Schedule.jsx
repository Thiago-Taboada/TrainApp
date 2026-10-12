import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { WEEKDAYS } from '../data/seedData'
import { sessionForDay, metaFor } from '../lib/sessions'
import { addDays, startOfWeek, toISODate, weekDates, weekdayKey } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'

export default function Schedule() {
  const { activeRoutines, loading } = useCatalog()
  const { logs, loading: logsLoading } = useLogs()
  const [weekOffset, setWeekOffset] = useState(0)

  if (loading || logsLoading) return <Spinner />

  const reference = addDays(startOfWeek(new Date()), weekOffset * 7)
  const days = weekDates(reference)
  const todayISO = toISODate(new Date())

  const rangeLabel = `${days[0].toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('es', { day: 'numeric', month: 'short' })}`

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="neon-title text-2xl text-brand-300">Cronograma</h1>
          <p className="text-sm text-slate-500">Marca y registra tu progreso semanal.</p>
        </div>
      </div>

      {activeRoutines.length === 0 && (
        <div className="card border-neon-amber/40 bg-neon-amber/10 p-4 text-sm text-neon-amber">
          No hay rutinas activas.{' '}
          <Link to="/rutinas" className="font-semibold underline">Activa una</Link> para ver tu plan.
        </div>
      )}

      {/* Week switcher */}
      <div className="flex items-center justify-between rounded-xl border border-brand-500/20 bg-ink-850/80 p-2">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="btn-ghost px-3 py-2">
          ‹
        </button>
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-slate-200">{rangeLabel}</p>
          <button onClick={() => setWeekOffset(0)} className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            {weekOffset === 0 ? 'Semana actual' : 'Volver a hoy'}
          </button>
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost px-3 py-2">
          ›
        </button>
      </div>

      <div className="space-y-3">
        {days.map((d) => {
          const iso = toISODate(d)
          const wk = weekdayKey(d)
          const dayDef = sessionForDay(activeRoutines, wk)
          const meta = metaFor(dayDef.sessionType)
          const log = logs.find((l) => l.date === iso)
          const isToday = iso === todayISO
          const isRest = dayDef.sessionType === 'rest'

          return (
            <Link
              key={iso}
              to={`/sesion/${wk}?date=${iso}`}
              className={`card flex items-stretch overflow-hidden transition hover:border-brand-400/60 hover:shadow-neon-soft ${
                isToday ? 'border-brand-400/60 shadow-neon-soft' : ''
              }`}
            >
              <div className={`w-1.5 shrink-0 ${meta.color}`} />
              <div className="flex flex-1 items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-100">{WEEKDAYS.find((w) => w.key === wk)?.label}</p>
                    {isToday && (
                      <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">Hoy</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-slate-400">{dayDef.label}</p>
                  {!isRest && (
                    <p className="mt-1 text-xs text-slate-400">
                      {dayDef.blocks.length} ejercicios
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 pl-3">
                  {log?.trained ? (
                    <div className="text-right">
                      <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">✓ Hecho</span>
                      {log.durationMinutes ? (
                        <p className="mt-1 text-xs text-slate-400">{log.durationMinutes} min</p>
                      ) : null}
                    </div>
                  ) : isRest ? (
                    <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">Descanso</span>
                  ) : (
                    <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">Pendiente</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

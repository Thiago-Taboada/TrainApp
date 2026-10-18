import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { CheckIcon, PlayIcon } from '../components/icons.jsx'
import { sessionForDay, metaFor } from '../lib/sessions'
import { addDays, startOfWeek, toISODate, weekDates, weekdayKey, formatShort } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'

export default function Schedule() {
  const { t } = useTranslation()
  const { activeRoutines, exercises, loading } = useCatalog()
  const { logs, loading: logsLoading } = useLogs()
  const [weekOffset, setWeekOffset] = useState(0)
  const [openISO, setOpenISO] = useState(() => toISODate(new Date()))

  if (loading || logsLoading) return <Spinner />

  const reference = addDays(startOfWeek(new Date()), weekOffset * 7)
  const days = weekDates(reference)
  const todayISO = toISODate(new Date())

  const rangeLabel = `${formatShort(days[0])} – ${formatShort(days[6])}`

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="neon-title text-2xl text-brand-300">{t('schedule.title')}</h1>
          <p className="text-sm text-slate-500">{t('schedule.subtitle')}</p>
        </div>
      </div>

      {activeRoutines.length === 0 && (
        <div className="card border-neon-amber/40 bg-neon-amber/10 p-4 text-sm text-neon-amber">
          {t('schedule.noActive')}{' '}
          <Link to="/rutinas" className="font-semibold underline">{t('schedule.activateOne')}</Link> {t('schedule.toSeePlan')}
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
            {weekOffset === 0 ? t('schedule.currentWeek') : t('schedule.backToToday')}
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

          const isOpen = openISO === iso

          return (
            <div
              key={iso}
              className={`card overflow-hidden transition ${
                isToday ? 'border-brand-400/60 shadow-neon-soft' : ''
              }`}
            >
              {/* Header (toggle) */}
              <button
                onClick={() => setOpenISO(isOpen ? '' : iso)}
                className="flex w-full items-stretch text-left"
                aria-expanded={isOpen}
              >
                <div className={`w-1.5 shrink-0 ${meta.color}`} />
                <div className="flex flex-1 items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-100">{t('weekdays.' + wk)}</p>
                      {isToday && (
                        <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">{t('schedule.today')}</span>
                      )}
                    </div>
                    <p className="truncate text-sm text-slate-400">{dayDef.label}</p>
                    {!isRest && (
                      <p className="mt-1 text-xs text-slate-400">
                        {t('schedule.exercisesCount', { count: dayDef.blocks.length })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pl-3">
                    {log?.trained ? (
                      <div className="text-right">
                        <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text"><CheckIcon className="h-3 w-3" /> {t('schedule.done')}</span>
                        {log.durationMinutes ? (
                          <p className="mt-1 text-xs text-slate-400">{log.durationMinutes} min</p>
                        ) : null}
                      </div>
                    ) : isRest ? (
                      <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">{t('schedule.rest')}</span>
                    ) : (
                      <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">{t('schedule.pending')}</span>
                    )}
                    <ChevronIcon open={isOpen} />
                  </div>
                </div>
              </button>

              {/* Expandable panel — animated via grid-rows 0fr -> 1fr */}
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-brand-500/15 px-4 pb-4 pt-3">
                    {isRest ? (
                      <p className="text-sm text-slate-400">{t('schedule.restDayNote')}</p>
                    ) : (
                      <>
                        <ul className="space-y-1.5">
                          {dayDef.blocks.map((b, i) => {
                            const ex = exercises.find((e) => e.id === b.exerciseId)
                            return (
                              <li key={i} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300">{ex?.name ?? '[Ejercicio eliminado]'}</span>
                                <span className="font-mono font-semibold text-brand-300">
                                  {b.sets}×{b.repsText}
                                  {b.perSide ? ' ' + t('schedule.perSide') : ''}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                        <Link to={`/entrenar/${wk}?date=${iso}`} className="btn-primary mt-4 w-full py-3 text-base">
                          <PlayIcon /> {t('schedule.startWorkout')}
                        </Link>
                        <Link to={`/sesion/${wk}?date=${iso}`} className="btn-ghost mt-2 w-full">
                          {log?.trained ? t('schedule.editSession') : t('schedule.registerSession')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

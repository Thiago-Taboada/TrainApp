import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { useAuth } from '../context/AuthContext.jsx'
import { CheckIcon, RestIcon, PlayIcon, FlameIcon, CoinIcon } from '../components/icons.jsx'
import { WEEKDAYS } from '../data/seedData'
import { sessionForDay, metaFor } from '../lib/sessions'
import { computeStreak } from '../lib/streak'
import { computeBalance } from '../lib/points'
import { toISODate, weekdayKey, weekDates, formatLong } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'
import WeightReminder from '../components/WeightReminder.jsx'

export default function Today() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { exercises, activeRoutines, pointsSpent, loading } = useCatalog()
  const { logs, loading: logsLoading } = useLogs()

  if (loading || logsLoading) return <Spinner />

  const today = new Date()
  const todayKey = weekdayKey(today)
  const todayISO = toISODate(today)
  const day = sessionForDay(activeRoutines, todayKey)
  const meta = metaFor(day.sessionType)
  const todayLog = logs.find((l) => l.date === todayISO)

  // This week's adherence: count planned (non-rest) weekdays across active routines
  const week = weekDates(today).map(toISODate)
  const plannedDays = WEEKDAYS.filter(
    (w) => sessionForDay(activeRoutines, w.key).sessionType !== 'rest',
  ).length
  const trainedThisWeek = logs.filter((l) => week.includes(l.date) && l.trained).length

  const { current: streak, best: bestStreak } = computeStreak(logs, activeRoutines)
  const trainedCount = logs.filter((l) => l.trained).length
  const points = computeBalance(trainedCount, bestStreak, pointsSpent)

  const firstName = (user?.displayName ?? '').split(' ')[0] || 'atleta'
  const hasActive = activeRoutines.length > 0

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-400">{formatLong(today)}</p>
        <h1 className="neon-title text-2xl text-brand-300">{t('today.hello', { name: firstName })}</h1>
      </div>

      <WeightReminder />

      {!hasActive && (
        <div className="card border-neon-amber/40 bg-neon-amber/10 p-4 text-sm text-neon-amber">
          {t('today.noActiveRoutines')}{' '}
          <Link to="/rutinas" className="font-semibold underline">
            {t('today.activateRoutine')}
          </Link>{' '}
          {t('today.toSeeToday')}
        </div>
      )}

      {/* Today's session */}
      <div className="card overflow-hidden">
        <div className={`${meta.color} px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink-950`}>
          {t('today.todaySession')} · {t('sessionTypes.' + day.sessionType)}
        </div>
        <div className="p-5">
          <h2 className="font-display text-xl font-bold text-slate-100">{day.label}</h2>
          <p className="mt-1 text-sm text-slate-400">{day.content}</p>

          {day.sessionType !== 'rest' && day.blocks.length > 0 ? (
            <>
              <div className="mt-4 space-y-1.5">
                {day.blocks.slice(0, 5).map((b, i) => {
                  const ex = exercises.find((e) => e.id === b.exerciseId)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{ex?.name ?? '[Ejercicio eliminado]'}</span>
                      <span className="font-mono font-semibold text-brand-300">
                        {b.sets}×{b.repsText}
                      </span>
                    </div>
                  )
                })}
                {day.blocks.length > 5 && (
                  <p className="text-xs text-slate-400">+{day.blocks.length - 5}…</p>
                )}
              </div>

              <Link to={`/entrenar/${todayKey}`} className="btn-primary mt-5 w-full py-3 text-base">
                <PlayIcon /> {t('today.startWorkout')}
              </Link>
              <Link to={`/sesion/${todayKey}`} className="btn-ghost mt-2 w-full">
                {todayLog ? t('today.editTodayLog') : t('today.registerWorkout')}
              </Link>
              {todayLog?.trained && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-medium text-brand-300 neon-text">
                  <CheckIcon className="h-4 w-4" />
                  {t('today.registered')} · {todayLog.durationMinutes ?? 0} min
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-slate-500/15 bg-ink-900/60 px-4 py-3 text-sm text-slate-400">
              <RestIcon className="h-4 w-4 shrink-0 text-brand-400" />
              {t('today.restDay')}
            </p>
          )}
        </div>
      </div>

      {/* Streak + points */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-4 overflow-hidden p-5">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${streak > 0 ? 'border-neon-amber/50 text-neon-amber shadow-[0_0_18px_rgba(255,176,32,0.3)]' : 'border-slate-500/30 text-slate-500'}`}>
            <FlameIcon active={streak > 0} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label">{t('today.currentStreak')}</p>
            <p className={`font-display text-3xl font-extrabold ${streak > 0 ? 'text-neon-amber' : 'text-slate-400'}`}>
              {streak} <span className="text-base font-semibold text-slate-500">{streak === 1 ? t('common.day') : t('common.days')}</span>
            </p>
            <p className="truncate text-xs text-slate-500">
              {streak === 0 ? t('today.startStreakHint') : t('today.bestStreak', { count: bestStreak })}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4 overflow-hidden p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-400/50 text-brand-300 shadow-neon">
            <CoinIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label">{t('today.points')}</p>
            <p className="font-display text-3xl font-extrabold text-brand-300 neon-text">{points}</p>
            <p className="truncate text-xs text-slate-500">{t('today.earnPointsHint')}</p>
          </div>
        </div>
      </div>

      {/* Week adherence quick stat */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label">{t('today.thisWeek')}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-brand-300 neon-text">
            {trainedThisWeek}
            <span className="text-base font-semibold text-slate-500">/{plannedDays}</span>
          </p>
          <p className="text-xs text-slate-500">{t('today.sessionsCompleted')}</p>
        </div>
        <div className="card p-4">
          <p className="label">{t('today.totalLogs')}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-neon-pink neon-text-pink">{logs.filter((l) => l.trained).length}</p>
          <p className="text-xs text-slate-500">{t('today.workouts')}</p>
        </div>
      </div>

      {/* Week strip */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="label">{t('today.yourWeek')}</p>
          <Link to="/cronograma" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            {t('today.seeAll')}
          </Link>
        </div>
        <div className="flex justify-between">
          {weekDates(today).map((d) => {
            const iso = toISODate(d)
            const wk = weekdayKey(d)
            const dayDef = sessionForDay(activeRoutines, wk)
            const m = metaFor(dayDef.sessionType)
            const log = logs.find((l) => l.date === iso)
            const isToday = iso === todayISO
            return (
              <Link
                to={`/sesion/${wk}`}
                key={iso}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className={`text-[11px] font-semibold ${isToday ? 'text-brand-300 neon-text' : 'text-slate-500'}`}>
                  {t('weekdaysShort.' + wk)}
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                    isToday ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-ink-850' : ''
                  } ${log?.trained ? `${m.color} text-ink-950 shadow-neon` : 'bg-ink-800 text-slate-500'}`}
                >
                  {log?.trained ? <CheckIcon className="h-4 w-4" /> : d.getDate()}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

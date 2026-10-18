import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { sessionForDay, metaFor, formatClock } from '../lib/sessions'
import { toISODate, weekdayKey } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'
import { CheckIcon } from '../components/icons.jsx'

// Flattens a day's blocks into a sequential list of sets to guide the user.
function buildSteps(day, exercises) {
  const steps = []
  for (const block of day.blocks ?? []) {
    const ex = exercises.find((e) => e.id === block.exerciseId)
    for (let s = 0; s < (block.sets || 1); s++) {
      steps.push({
        exerciseId: block.exerciseId,
        name: ex?.name ?? '',
        description: ex?.description ?? '',
        cues: ex?.cues ?? [],
        tracking: ex?.tracking ?? 'reps',
        targetSeconds: parseTargetSeconds(block.repsText),
        setNumber: s + 1,
        totalSets: block.sets || 1,
        repsText: block.repsText,
        perSide: block.perSide,
        restSeconds: Number(block.restSeconds) || 0,
      })
    }
  }
  return steps
}

// Low end of a time range like "30-45 s" or "10-20 s" -> 30 / 10 (seconds).
function parseTargetSeconds(repsText) {
  const m = String(repsText ?? '').match(/\d+/)
  return m ? Number(m[0]) : 0
}

export default function WorkoutRunner() {
  const { t } = useTranslation()
  const { weekday } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { activeRoutines, exercises, loading } = useCatalog()

  const dateISO = params.get('date') ?? toISODate(new Date())
  const resolvedWeekday = weekday ?? weekdayKey(new Date())
  const day = useMemo(
    () => sessionForDay(activeRoutines, resolvedWeekday),
    [activeRoutines, resolvedWeekday],
  )
  const steps = useMemo(() => buildSteps(day, exercises), [day, exercises])

  const [index, setIndex] = useState(0)
  const [resting, setResting] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  // Rest countdown: the interval only decrements. When it reaches 0 the
  // effect below fires the alert + advances. (Keeping side effects out of the
  // state updater avoids double-firing under StrictMode.)
  useEffect(() => {
    if (!resting) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [resting])

  // When the rest timer hits 0, alert and move to the next step.
  useEffect(() => {
    if (!resting || remaining > 0) return
    clearInterval(intervalRef.current)
    beep()
    vibrate()
    goNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, remaining])

  if (loading) return <Spinner />

  const meta = metaFor(day.sessionType)

  if (steps.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-400">{t('runner.noExercises')}</p>
        <Link to="/" className="btn-primary mt-4">{t('runner.back')}</Link>
      </div>
    )
  }

  const step = steps[index]
  const progress = Math.round((index / steps.length) * 100)
  const isLast = index === steps.length - 1

  function completeSet() {
    if (step.restSeconds > 0 && !isLast) {
      setRemaining(step.restSeconds)
      setRestTotal(step.restSeconds)
      setResting(true)
    } else if (!isLast) {
      goNext()
    } else {
      finish()
    }
  }

  function goNext() {
    setResting(false)
    clearInterval(intervalRef.current)
    if (index < steps.length - 1) setIndex((i) => i + 1)
    else finish()
  }

  function skipRest() {
    clearInterval(intervalRef.current)
    setResting(false)
    goNext()
  }

  function addTime() {
    // Grow both the remaining time and the ring's total so the circle stays
    // in sync (adding time shouldn't make the ring overfill or spin backwards).
    setRemaining((r) => r + 15)
    setRestTotal((t) => t + 15)
  }

  function finish() {
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/50 text-brand-300 shadow-neon">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h1 className="neon-title text-xl text-brand-300">{t('runner.completed')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {t('runner.completedDetail', { count: steps.length, label: day.label })}
          </p>
          <Link
            to={`/session/${resolvedWeekday}?date=${dateISO}`}
            className="btn-primary mt-5 w-full"
          >
            {t('runner.logDetails')}
          </Link>
          <Link to="/" className="btn-ghost mt-3 w-full">
            {t('runner.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + progress */}
      <div>
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('runner.exit')}
          </Link>
          <span className="font-mono text-xs text-slate-400">
            {index + 1} / {steps.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div className={`h-full ${meta.color} transition-all duration-300`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {resting ? (
        <RestView
          remaining={remaining}
          total={restTotal}
          nextStep={steps[index + 1]}
          onSkip={skipRest}
          onAddTime={addTime}
          meta={meta}
        />
      ) : (
        <div className="card p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-neon-pink">
            {t('weekdays.' + resolvedWeekday)} · {t('sessionTypes.' + day.sessionType)}
          </p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-100">{step.name || t('sessionLog.deletedExercise')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('runner.setOf', { current: step.setNumber, total: step.totalSets })}
          </p>

          {step.description && (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              {step.description}
            </p>
          )}

          {step.cues.length > 0 && (
            <ul className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-1.5">
              {step.cues.map((cue, i) => (
                <li key={i} className="chip border-brand-400/30 bg-brand-500/10 text-brand-200">
                  {cue}
                </li>
              ))}
            </ul>
          )}

          {step.tracking === 'time' ? (
            <ExerciseTimer
              key={index}
              target={step.targetSeconds}
              repsText={step.repsText}
              perSide={step.perSide}
              onComplete={completeSet}
            />
          ) : (
            <>
              <div className="my-6 rounded-2xl border border-brand-500/20 bg-ink-900/60 py-6">
                <p className="label">{t('runner.target')}</p>
                <p className="font-display text-4xl font-extrabold text-brand-300 neon-text">
                  {step.repsText}
                </p>
                {step.perSide && <p className="mt-1 text-xs text-slate-400">{t('runner.perSide')}</p>}
              </div>

              <button onClick={completeSet} className="btn-primary w-full py-3 text-base">
                <CheckIcon className="h-5 w-5" />
                {t('runner.setDone')}
              </button>
            </>
          )}

          {step.restSeconds === 0 && !isLast && (
            <p className="mt-3 text-xs text-slate-500">{t('runner.noRest')}</p>
          )}
        </div>
      )}

      {/* Up next */}
      {!resting && steps[index + 1] && (
        <div className="card flex items-center gap-3 p-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{t('runner.upNext')}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-200">{steps[index + 1].name || t('sessionLog.deletedExercise')}</p>
            <p className="text-xs text-slate-400">
              {t('runner.setOf', { current: steps[index + 1].setNumber, total: steps[index + 1].totalSets })} · {steps[index + 1].repsText}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Timer for time-based exercises: a 3-2-1 countdown, then a stopwatch counting
// up. Start/Pause and Reset. Shows the target hold time as reference.
function ExerciseTimer({ target, repsText, perSide, onComplete }) {
  const { t } = useTranslation()
  // phase: 'idle' | 'countdown' | 'running' | 'paused'
  const [phase, setPhase] = useState('idle')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const tickRef = useRef(null)

  // Countdown 3-2-1 then start the stopwatch.
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('running')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Stopwatch tick.
  useEffect(() => {
    if (phase !== 'running') return
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(tickRef.current)
  }, [phase])

  // Alert once when the hold reaches its target time.
  useEffect(() => {
    if (phase === 'running' && target > 0 && elapsed === target) {
      beep()
      vibrate()
    }
  }, [phase, elapsed, target])

  function start() {
    setCountdown(3)
    setPhase('countdown')
  }
  function pause() {
    setPhase('paused')
  }
  function resume() {
    setPhase('running')
  }
  function reset() {
    clearInterval(tickRef.current)
    setElapsed(0)
    setCountdown(3)
    setPhase('idle')
  }

  const reachedTarget = target > 0 && elapsed >= target

  return (
    <div className="my-6">
      <div
        className={`relative mx-auto flex h-44 w-44 items-center justify-center rounded-full border-4 ${
          reachedTarget ? 'border-brand-400 shadow-neon' : 'border-ink-600'
        }`}
      >
        {phase === 'countdown' ? (
          <span className="font-display text-6xl font-extrabold text-neon-amber neon-text-pink">
            {countdown === 0 ? t('runner.now') : countdown}
          </span>
        ) : (
          <div className="text-center">
            <span className="font-display text-5xl font-extrabold text-brand-300 neon-text">
              {formatClock(elapsed)}
            </span>
            {target > 0 && (
              <p className="mt-1 font-mono text-xs text-slate-500">{t('runner.goal')} {formatClock(target)}</p>
            )}
          </div>
        )}
      </div>

      {perSide && <p className="mt-2 text-center text-xs text-slate-400">{t('runner.perSide')}</p>}
      {phase === 'idle' && target > 0 && (
        <p className="mt-2 text-center text-sm text-slate-400">{t('runner.target')}: {repsText}</p>
      )}

      {/* Controls */}
      <div className="mt-5 flex gap-2">
        {phase === 'idle' && (
          <button onClick={start} className="btn-primary flex-1 py-3">{t('runner.start')}</button>
        )}
        {phase === 'countdown' && (
          <button onClick={reset} className="btn-ghost flex-1 py-3">{t('runner.cancel')}</button>
        )}
        {phase === 'running' && (
          <>
            <button onClick={pause} className="btn-ghost flex-1 py-3">{t('runner.pause')}</button>
            <button onClick={reset} className="btn-ghost flex-1 py-3">{t('runner.reset')}</button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button onClick={resume} className="btn-primary flex-1 py-3">{t('runner.resume')}</button>
            <button onClick={reset} className="btn-ghost flex-1 py-3">{t('runner.reset')}</button>
          </>
        )}
      </div>

      <button onClick={onComplete} className="btn-primary mt-3 w-full py-3 text-base">
        <CheckIcon className="h-5 w-5" />
        {t('runner.setDone')}
      </button>
    </div>
  )
}

function RestView({ remaining, total, nextStep, onSkip, onAddTime, meta }) {
  const { t } = useTranslation()
  // Fraction of time already elapsed, clamped to [0,1] so the ring can never
  // overfill or spin backwards even if time is added mid-rest.
  const elapsedFraction = total > 0 ? Math.min(1, Math.max(0, (total - remaining) / total)) : 1
  const pct = elapsedFraction * 100
  return (
    <div className="card p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-amber">{t('runner.rest')}</p>

      {/* Ring timer */}
      <div className="relative mx-auto my-5 h-44 w-44">
        <svg className="h-full w-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1c2743" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#ffb020"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={(2 * Math.PI * 40 * pct) / 100}
            style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px rgba(255,176,32,0.6))' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-4xl font-extrabold text-neon-amber">
            {formatClock(remaining)}
          </span>
        </div>
      </div>

      {nextStep && (
        <p className="text-sm text-slate-400">
          {t('runner.then')} <span className="font-semibold text-slate-200">{nextStep.name || t('sessionLog.deletedExercise')}</span> · {t('runner.thenSet')} {nextStep.setNumber}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button onClick={onAddTime} className="btn-ghost flex-1">{t('runner.addTime')}</button>
        <button onClick={onSkip} className="btn-primary flex-1">{t('runner.skipRest')}</button>
      </div>
    </div>
  )
}

// Vibrate the device when rest ends. Supported mainly on Android browsers;
// iOS Safari ignores it, which is fine.
function vibrate() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  } catch {
    /* no-op */
  }
}

// Short beep when the rest ends. Uses the Web Audio API; fails silently.
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    /* no-op */
  }
}

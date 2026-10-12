import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { WEEKDAYS } from '../data/seedData'
import { sessionForDay, metaFor } from '../lib/sessions'
import { formatLong, fromISODate, toISODate } from '../lib/dates'
import Spinner from '../components/Spinner.jsx'

// Session fatigue options (global feeling of the session).
const FATIGUE = [
  { value: 'fresh', emoji: '🟢', label: 'Súper bien' },
  { value: 'ok', emoji: '🟡', label: 'Cansado pero salió' },
  { value: 'spent', emoji: '🔴', label: 'Agotado' },
]

// Build an empty entries array from a routine day's blocks.
function buildEntries(day) {
  if (!day) return []
  return day.blocks.map((b) => ({
    exerciseId: b.exerciseId,
    sets: Array.from({ length: b.sets || 1 }, () => ({
      reps: '',
      weightKg: '',
      rir: '',
      toFailure: false,
    })),
  }))
}

export default function SessionLog() {
  const { weekday } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { exercises, activeRoutines, loading } = useCatalog()
  const { logs, loading: logsLoading, saveLog, deleteLog } = useLogs()

  // Resolve the date: ?date=YYYY-MM-DD or the next occurrence of this weekday.
  const dateISO = params.get('date') ?? resolveDateForWeekday(weekday)

  const day = useMemo(
    () => sessionForDay(activeRoutines, weekday),
    [activeRoutines, weekday],
  )

  const existing = logs.find((l) => l.date === dateISO)

  const [trained, setTrained] = useState(true)
  const [duration, setDuration] = useState('')
  const [fatigue, setFatigue] = useState('ok')
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize form from existing log or routine template.
  useEffect(() => {
    if (loading || logsLoading || initialized || !day) return
    if (existing) {
      setTrained(existing.trained ?? true)
      setDuration(existing.durationMinutes ?? '')
      setFatigue(existing.sessionFatigue ?? 'ok')
      setNotes(existing.notes ?? '')
      // Merge saved entries over the template structure so new blocks appear.
      const base = buildEntries(day)
      if (existing.entries?.length) {
        for (const saved of existing.entries) {
          const idx = base.findIndex((e) => e.exerciseId === saved.exerciseId)
          if (idx >= 0) base[idx] = saved
          else base.push(saved)
        }
      }
      setEntries(base)
    } else {
      setEntries(buildEntries(day))
    }
    setInitialized(true)
  }, [loading, logsLoading, day, existing, initialized])

  if (loading || logsLoading) return <Spinner />
  if (!day) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Día no encontrado.</p>
        <Link to="/cronograma" className="btn-primary mt-4">Volver al cronograma</Link>
      </div>
    )
  }

  const meta = metaFor(day.sessionType)
  const wd = WEEKDAYS.find((w) => w.key === weekday)
  const isRest = day.sessionType === 'rest' || day.blocks.length === 0

  function updateSet(entryIdx, setIdx, field, value) {
    setEntries((prev) => {
      const next = structuredClone(prev)
      next[entryIdx].sets[setIdx][field] = value
      return next
    })
  }

  function addSet(entryIdx) {
    setEntries((prev) => {
      const next = structuredClone(prev)
      const last = next[entryIdx].sets.at(-1) ?? { reps: '', weightKg: '', rir: '', toFailure: false }
      next[entryIdx].sets.push({ ...last, toFailure: false })
      return next
    })
  }

  function removeSet(entryIdx, setIdx) {
    setEntries((prev) => {
      const next = structuredClone(prev)
      if (next[entryIdx].sets.length > 1) next[entryIdx].sets.splice(setIdx, 1)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Clean entries: numbers where possible, drop fully-empty sets.
      const cleanEntries = entries
        .map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets
            .filter((s) => s.reps !== '' || s.weightKg !== '' || s.toFailure)
            .map((s) => ({
              reps: s.reps === '' ? null : Number(s.reps),
              weightKg: s.weightKg === '' ? null : Number(s.weightKg),
              rir: s.rir === '' ? null : Number(s.rir),
              toFailure: !!s.toFailure,
            })),
        }))
        .filter((e) => e.sets.length > 0)

      await saveLog({
        date: dateISO,
        routineIds: activeRoutines.map((r) => r.id),
        weekday,
        dayLabel: day.label,
        sessionType: day.sessionType,
        trained,
        durationMinutes: duration === '' ? null : Number(duration),
        sessionFatigue: fatigue,
        notes: notes.trim(),
        entries: trained ? cleanEntries : [],
      })
      navigate('/cronograma')
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar: ' + (err?.message ?? 'error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('¿Eliminar el registro de este día?')) return
    await deleteLog(existing.id)
    navigate('/cronograma')
  }

  return (
    <div className="space-y-5">
      <Link to="/cronograma" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Cronograma
      </Link>

      <div className="card overflow-hidden">
        <div className={`${meta.color} px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink-950`}>
          {wd?.label} · {meta.label}
        </div>
        <div className="p-5">
          <h1 className="text-xl font-bold">{day.label}</h1>
          <p className="text-sm text-slate-500">{formatLong(fromISODate(dateISO))}</p>
          <p className="mt-1 text-sm text-slate-500">{day.content}</p>
        </div>
      </div>

      {/* Trained toggle */}
      <div className="card flex items-center justify-between p-4">
        <div>
          <p className="font-semibold">¿Entrenaste este día?</p>
          <p className="text-sm text-slate-500">Marca si completaste la sesión.</p>
        </div>
        <button
          onClick={() => setTrained((t) => !t)}
          className={`relative h-7 w-12 rounded-full transition ${trained ? 'bg-brand-500 shadow-neon' : 'bg-ink-600'}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${trained ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {trained && (
        <>
          {/* Duration + fatigue */}
          <div className="card space-y-4 p-5">
            <div>
              <label className="label mb-1.5">Duración total (minutos)</label>
              <input
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ej. 45"
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1.5">¿Cómo terminaste?</label>
              <div className="grid grid-cols-3 gap-2">
                {FATIGUE.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFatigue(f.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition ${
                      fatigue === f.value
                        ? 'border-brand-400 bg-brand-500/15 text-brand-300 shadow-neon'
                        : 'border-slate-500/25 text-slate-400 hover:border-brand-400/40 hover:text-brand-200'
                    }`}
                  >
                    <span className="text-xl">{f.emoji}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercises */}
          {!isRest && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Ejercicios ({entries.length})
              </h2>
              {entries.map((entry, ei) => {
                const ex = exercises.find((e) => e.id === entry.exerciseId)
                const block = day.blocks.find((b) => b.exerciseId === entry.exerciseId)
                return (
                  <div key={entry.exerciseId + ei} className="card p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/biblioteca/${entry.exerciseId}`} className="font-semibold text-slate-200 hover:text-brand-300">
                          {ex?.name ?? entry.exerciseId}
                        </Link>
                        {block && (
                          <p className="text-xs text-slate-400">
                            Objetivo: {block.sets}×{block.repsText}
                            {block.perSide ? ' /lado' : ''}
                            {block.restText && block.restText !== '—' ? ` · desc. ${block.restText}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Set rows */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto] items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <span>#</span>
                        <span>Reps</span>
                        <span>Peso kg</span>
                        <span>RIR</span>
                        <span className="text-center">Fallo</span>
                      </div>
                      {entry.sets.map((set, si) => (
                        <div key={si} className="grid grid-cols-[28px_1fr_1fr_1fr_auto] items-center gap-2">
                          <span className="text-sm font-semibold text-slate-400">{si + 1}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(ei, si, 'reps', e.target.value)}
                            placeholder="—"
                            className="input px-2 py-1.5 text-center"
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            value={set.weightKg}
                            onChange={(e) => updateSet(ei, si, 'weightKg', e.target.value)}
                            placeholder="—"
                            className="input px-2 py-1.5 text-center"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.rir}
                            onChange={(e) => updateSet(ei, si, 'rir', e.target.value)}
                            placeholder="1-3"
                            title="Repeticiones en reserva (las que podrías haber hecho más)"
                            className="input px-2 py-1.5 text-center"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateSet(ei, si, 'toFailure', !set.toFailure)}
                              title="Llegué al fallo"
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition ${
                                set.toFailure ? 'bg-neon-red text-white shadow-neon-pink' : 'bg-ink-700 text-slate-400'
                              }`}
                            >
                              F
                            </button>
                            <button
                              onClick={() => removeSet(ei, si)}
                              className="flex h-8 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-ink-700 hover:text-neon-red"
                              title="Quitar serie"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => addSet(ei)} className="mt-3 text-xs font-semibold text-brand-400 hover:text-brand-300">
                      + Añadir serie
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Notes */}
          <div className="card p-5">
            <label className="label mb-1.5">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="¿Dolor de cadera? ¿Subiste peso? ¿Cómo te sentiste?"
              className="input resize-none"
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="sticky bottom-20 z-10 flex gap-3 md:bottom-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 shadow-lg">
          {saving ? 'Guardando…' : existing ? 'Actualizar' : 'Guardar sesión'}
        </button>
        {existing && (
          <button onClick={handleDelete} className="btn border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20">
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

// Returns the ISO date of the given weekday within the current week.
function resolveDateForWeekday(weekday) {
  const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const target = keys.indexOf(weekday)
  const now = new Date()
  const curr = (now.getDay() + 6) % 7
  const diff = target - curr
  const d = new Date(now)
  d.setDate(now.getDate() + diff)
  return toISODate(d)
}

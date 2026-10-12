import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { CATEGORIES, SESSION_TYPE_META, WEEKDAYS } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

const SESSION_TYPES = [
  { key: 'strength', label: 'Fuerza' },
  { key: 'flexibility', label: 'Flexibilidad' },
  { key: 'mobility', label: 'Movilidad' },
  { key: 'rest', label: 'Descanso' },
]

function emptyDays() {
  return WEEKDAYS.map((w) => ({
    weekday: w.key,
    sessionType: 'rest',
    label: '',
    content: '',
    blocks: [],
  }))
}

export default function RoutineEditor() {
  const { routineId } = useParams()
  const navigate = useNavigate()
  const { loading, routines, exercises, saveRoutine, deleteRoutine } = useCatalog()

  const editing = Boolean(routineId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState(emptyDays())
  const [openDay, setOpenDay] = useState('monday')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  const existing = useMemo(
    () => routines.find((r) => r.id === routineId),
    [routines, routineId],
  )
  const isTemplate = existing?.isTemplate

  useEffect(() => {
    if (loading || ready) return
    if (editing && existing) {
      setName(existing.name ?? '')
      setDescription(existing.description ?? '')
      // normalize to all 7 weekdays
      const base = emptyDays()
      for (const d of existing.days ?? []) {
        const idx = base.findIndex((x) => x.weekday === d.weekday)
        if (idx >= 0) base[idx] = { ...base[idx], ...d, blocks: d.blocks ?? [] }
      }
      setDays(base)
    }
    setReady(true)
  }, [loading, ready, editing, existing])

  if (loading) return <Spinner />

  // Template routines are read-only: offer to duplicate instead.
  if (editing && isTemplate) {
    return (
      <div className="space-y-5">
        <Link to="/rutinas" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
          <ChevronLeft /> Rutinas
        </Link>
        <TemplateView routine={existing} exercises={exercises} navigate={navigate} />
      </div>
    )
  }

  function updateDay(weekday, patch) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)))
  }

  function addBlock(weekday, exerciseId) {
    if (!exerciseId) return
    updateDayBlocks(weekday, (blocks) => [
      ...blocks,
      { exerciseId, sets: 3, repsText: '8-12', perSide: false, restText: '60-120 s' },
    ])
  }

  function updateDayBlocks(weekday, fn) {
    setDays((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, blocks: fn(d.blocks) } : d)),
    )
  }

  function updateBlock(weekday, idx, patch) {
    updateDayBlocks(weekday, (blocks) => blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  function removeBlock(weekday, idx) {
    updateDayBlocks(weekday, (blocks) => blocks.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Ponle un nombre a la rutina.')
      return
    }
    setSaving(true)
    try {
      // Only persist days that have content or a non-rest type.
      const cleanDays = days.map((d) => ({
        weekday: d.weekday,
        sessionType: d.blocks.length === 0 && d.sessionType !== 'rest' ? d.sessionType : d.sessionType,
        label: d.label?.trim() || defaultLabel(d.sessionType),
        content: d.content?.trim() || '',
        blocks: d.blocks.map((b) => ({
          exerciseId: b.exerciseId,
          sets: Number(b.sets) || 1,
          repsText: String(b.repsText || '').trim() || '-',
          perSide: !!b.perSide,
          restText: String(b.restText || '').trim() || '—',
        })),
      }))
      const id = await saveRoutine({
        id: editing ? routineId : undefined,
        name: name.trim(),
        description: description.trim(),
        days: cleanDays,
      })
      navigate('/rutinas')
      return id
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar: ' + (err?.message ?? 'error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta rutina?')) return
    await deleteRoutine(routineId)
    navigate('/rutinas')
  }

  return (
    <div className="space-y-5">
      <Link to="/rutinas" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> Rutinas
      </Link>

      <h1 className="neon-title text-2xl text-brand-300">
        {editing ? 'Editar rutina' : 'Nueva rutina'}
      </h1>

      {/* Meta */}
      <div className="card space-y-4 p-5">
        <div>
          <label className="label mb-1.5">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Mi rutina de fuerza" className="input" />
        </div>
        <div>
          <label className="label mb-1.5">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="¿De qué trata esta rutina?" className="input resize-none" />
        </div>
      </div>

      {/* Days accordion */}
      <div className="space-y-3">
        {days.map((d) => {
          const wd = WEEKDAYS.find((w) => w.key === d.weekday)
          const meta = SESSION_TYPE_META[d.sessionType] ?? SESSION_TYPE_META.rest
          const isOpen = openDay === d.weekday
          return (
            <div key={d.weekday} className="card overflow-hidden">
              <button
                onClick={() => setOpenDay(isOpen ? '' : d.weekday)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${meta.color}`} />
                  <div>
                    <p className="font-bold">{wd?.label}</p>
                    <p className="text-xs text-slate-500">
                      {d.sessionType === 'rest' ? 'Descanso' : `${meta.label} · ${d.blocks.length} ejercicios`}
                    </p>
                  </div>
                </div>
                <span className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-slate-100 p-4">
                  {/* Session type */}
                  <div className="flex flex-wrap gap-2">
                    {SESSION_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => updateDay(d.weekday, { sessionType: t.key })}
                        className={`chip border ${
                          d.sessionType === t.key
                            ? 'border-brand-400 bg-brand-500/20 text-brand-200 shadow-neon'
                            : 'border-slate-500/25 bg-ink-800/60 text-slate-400 hover:border-brand-400/40 hover:text-brand-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {d.sessionType !== 'rest' && (
                    <>
                      <div>
                        <label className="label mb-1.5">Nombre de la sesión (opcional)</label>
                        <input
                          value={d.label}
                          onChange={(e) => updateDay(d.weekday, { label: e.target.value })}
                          placeholder={defaultLabel(d.sessionType)}
                          className="input"
                        />
                      </div>

                      {/* Blocks */}
                      <div className="space-y-3">
                        {d.blocks.map((b, i) => {
                          const ex = exercises.find((e) => e.id === b.exerciseId)
                          return (
                            <div key={i} className="rounded-xl border border-slate-500/15 bg-ink-900/60 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <p className="font-semibold text-sm">{ex?.name ?? b.exerciseId}</p>
                                <button onClick={() => removeBlock(d.weekday, i)} className="text-slate-400 hover:text-red-500">×</button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <Field label="Series">
                                  <input type="number" inputMode="numeric" value={b.sets} onChange={(e) => updateBlock(d.weekday, i, { sets: e.target.value })} className="input px-2 py-1.5 text-center" />
                                </Field>
                                <Field label="Reps">
                                  <input value={b.repsText} onChange={(e) => updateBlock(d.weekday, i, { repsText: e.target.value })} placeholder="8-12" className="input px-2 py-1.5 text-center" />
                                </Field>
                                <Field label="Descanso">
                                  <input value={b.restText} onChange={(e) => updateBlock(d.weekday, i, { restText: e.target.value })} placeholder="60-120 s" className="input px-2 py-1.5 text-center" />
                                </Field>
                                <Field label="Por lado">
                                  <button
                                    onClick={() => updateBlock(d.weekday, i, { perSide: !b.perSide })}
                                    className={`input flex items-center justify-center px-2 py-1.5 ${b.perSide ? 'border-brand-400/60 bg-brand-500/15 text-brand-300' : 'text-slate-400'}`}
                                  >
                                    {b.perSide ? 'Sí' : 'No'}
                                  </button>
                                </Field>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Add exercise */}
                      <AddExercise exercises={exercises} onAdd={(id) => addBlock(d.weekday, id)} />
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Guardando…' : 'Guardar rutina'}
        </button>
        {editing && !isTemplate && (
          <button onClick={handleDelete} className="btn border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20">
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

function AddExercise({ exercises, onAdd }) {
  const [sel, setSel] = useState('')
  const grouped = useMemo(() => {
    const m = {}
    for (const e of exercises) (m[e.category] ??= []).push(e)
    return m
  }, [exercises])

  return (
    <div className="flex gap-2">
      <select value={sel} onChange={(e) => setSel(e.target.value)} className="input flex-1">
        <option value="">Añadir ejercicio…</option>
        {Object.entries(grouped).map(([cat, items]) => (
          <optgroup key={cat} label={CATEGORIES[cat] ?? cat}>
            {items
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
          </optgroup>
        ))}
      </select>
      <button
        onClick={() => {
          if (sel) {
            onAdd(sel)
            setSel('')
          }
        }}
        className="btn-ghost"
      >
        Añadir
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </div>
  )
}

function TemplateView({ routine, exercises, navigate }) {
  const { saveRoutine } = useCatalog()
  async function duplicate() {
    const copy = {
      name: routine.name + ' (copia)',
      description: routine.description ?? '',
      days: (routine.days ?? []).map((d) => ({ ...d, blocks: (d.blocks ?? []).map((b) => ({ ...b })) })),
    }
    const id = await saveRoutine(copy)
    navigate(`/rutinas/${id}`)
  }
  return (
    <div className="space-y-5">
      <div className="card border-neon-amber/40 bg-neon-amber/10 p-4 text-sm text-neon-amber">
        Esta es la rutina plantilla y no se puede editar directamente. Duplícala para crear tu propia versión editable.
      </div>
      <h1 className="neon-title text-2xl text-brand-300">{routine.name}</h1>
      <p className="text-sm text-slate-500">{routine.description}</p>
      <div className="space-y-3">
        {(routine.days ?? [])
          .filter((d) => d.sessionType !== 'rest')
          .map((d) => {
            const meta = SESSION_TYPE_META[d.sessionType] ?? SESSION_TYPE_META.rest
            const wd = WEEKDAYS.find((w) => w.key === d.weekday)
            return (
              <div key={d.weekday} className="card p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${meta.color}`} />
                  <p className="font-bold">{wd?.label} · {d.label}</p>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {d.blocks.map((b, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{exercises.find((e) => e.id === b.exerciseId)?.name ?? b.exerciseId}</span>
                      <span className="font-semibold text-slate-400">{b.sets}×{b.repsText}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
      </div>
      <button onClick={duplicate} className="btn-primary w-full">Duplicar para editar</button>
    </div>
  )
}

function defaultLabel(type) {
  return SESSION_TYPE_META[type]?.label ?? 'Sesión'
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

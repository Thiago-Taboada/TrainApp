import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { SESSION_TYPE_META, WEEKDAYS } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

export default function Routines() {
  const {
    loading,
    routines,
    activeRoutineIds,
    setActiveRoutine,
    deleteRoutine,
  } = useCatalog()

  if (loading) return <Spinner />

  async function handleDelete(e, routine) {
    e.preventDefault()
    e.stopPropagation()
    if (routine.isTemplate) return
    if (!confirm(`¿Eliminar la rutina "${routine.name}"?`)) return
    await deleteRoutine(routine.id)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="neon-title text-2xl text-brand-300">Rutinas</h1>
          <p className="text-sm text-slate-500">
            Activa las que quieras seguir. Crea las tuyas con tus ejercicios.
          </p>
        </div>
      </div>

      {/* Create buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/rutinas/nueva" className="btn-primary">
          + Nueva rutina
        </Link>
        <Link to="/ejercicios/nuevo" className="btn-ghost">
          + Nuevo ejercicio
        </Link>
      </div>

      <div className="space-y-3">
        {routines.map((routine) => {
          const active = activeRoutineIds.includes(routine.id)
          const trainingDays = (routine.days ?? []).filter(
            (d) => d.sessionType !== 'rest' && d.blocks?.length > 0,
          )
          return (
            <Link
              key={routine.id}
              to={`/rutinas/${routine.id}`}
              className={`card block p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft ${active ? 'border-brand-400/60 shadow-neon-soft' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{routine.name}</h2>
                    {routine.isTemplate && (
                      <span className="chip border-slate-500/30 bg-ink-700/60 text-slate-400">Plantilla</span>
                    )}
                    {active && <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">Activa</span>}
                  </div>
                  {routine.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{routine.description}</p>
                  )}
                </div>

                {/* Active toggle */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveRoutine(routine.id, !active)
                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${active ? 'bg-brand-500 shadow-neon' : 'bg-ink-600'}`}
                  title={active ? 'Desactivar' : 'Activar'}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${active ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Day chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(routine.days ?? [])
                  .filter((d) => d.sessionType !== 'rest')
                  .map((d) => {
                    const meta = SESSION_TYPE_META[d.sessionType] ?? SESSION_TYPE_META.rest
                    const wd = WEEKDAYS.find((w) => w.key === d.weekday)
                    return (
                      <span key={d.weekday} className={`chip ${meta.soft} ${meta.text}`}>
                        {wd?.short}
                      </span>
                    )
                  })}
                <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">
                  {trainingDays.length} día{trainingDays.length === 1 ? '' : 's'}
                </span>
              </div>

              {!routine.isTemplate && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => handleDelete(e, routine)}
                    className="text-xs font-semibold text-neon-red/80 hover:text-neon-red"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { CATEGORIES, MUSCLE_GROUPS, WEEKDAYS } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

export default function ExerciseDetail() {
  const { exerciseId } = useParams()
  const { exercises, routines, loading } = useCatalog()

  if (loading) return <Spinner />

  const ex = exercises.find((e) => e.id === exerciseId)
  if (!ex) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Ejercicio no encontrado.</p>
        <Link to="/biblioteca" className="btn-primary mt-4">
          Volver a la biblioteca
        </Link>
      </div>
    )
  }

  // Where does this exercise appear across all routines (with its prescription)?
  const appearances = []
  for (const routine of routines) {
    for (const day of routine.days ?? []) {
      for (const block of day.blocks ?? []) {
        if (block.exerciseId === ex.id) {
          appearances.push({ routine, day, block })
        }
      }
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/biblioteca" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Biblioteca
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="neon-title text-2xl text-brand-300">{ex.name}</h1>
          <div className="flex items-center gap-2">
            {ex.isCustom && (
              <Link to={`/ejercicios/${ex.id}/editar`} className="chip border-slate-500/25 bg-ink-700/60 text-slate-300 hover:border-brand-400/40 hover:text-brand-200">
                Editar
              </Link>
            )}
            <span className="chip border-brand-400/40 bg-brand-500/10 text-brand-300">{CATEGORIES[ex.category]}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(ex.muscleGroups ?? []).map((m) => (
            <span key={m} className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">
              {MUSCLE_GROUPS[m] ?? m}
            </span>
          ))}
        </div>
        {ex.equipment?.length > 0 && (
          <p className="mt-3 text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Equipo:</span> {ex.equipment.join(', ')}
          </p>
        )}
        {ex.focus && (
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Enfoque:</span> {ex.focus}
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Guía de ejecución</h2>
        <p className="text-slate-300">{ex.description}</p>
        {ex.cues?.length > 0 && (
          <ul className="mt-4 space-y-2">
            {ex.cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400 shadow-neon" />
                {cue}
              </li>
            ))}
          </ul>
        )}
      </div>

      {appearances.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            En rutinas
          </h2>
          <div className="space-y-2">
            {appearances.map(({ routine, day, block }, i) => {
              const wd = WEEKDAYS.find((w) => w.key === day.weekday)
              return (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-500/15 bg-ink-900/60 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-200">{wd?.label}</p>
                    <p className="text-xs text-slate-400">{routine.name} · {day.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-brand-300">
                      {block.sets} × {block.repsText}
                      {block.perSide ? ' /lado' : ''}
                    </p>
                    {block.restText && block.restText !== '—' && (
                      <p className="text-xs text-slate-500">Descanso {block.restText}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { SESSION_TYPE_META } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

export default function Routines() {
  const { t } = useTranslation()
  const {
    loading,
    routines,
    routineSlots,
    activeRoutineIds,
    setActiveRoutine,
    deleteRoutine,
  } = useCatalog()

  if (loading) return <Spinner />

  const customCount = routines.filter((r) => r.isCustom).length
  const atLimit = customCount >= routineSlots

  async function handleDelete(e, routine) {
    e.preventDefault()
    e.stopPropagation()
    if (routine.isTemplate) return
    if (!confirm(t('routines.confirmDelete', { name: routine.name }))) return
    await deleteRoutine(routine.id)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="neon-title text-2xl text-brand-300">{t('routines.title')}</h1>
          <p className="text-sm text-slate-500">
            {t('routines.subtitle')}
          </p>
        </div>
      </div>

      {/* Create button + slot usage */}
      {atLimit ? (
        <div className="card border-neon-amber/40 bg-neon-amber/5 p-4">
          <p className="text-sm font-semibold text-neon-amber">{t('routines.limitReached')}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t('routines.limitDesc', { used: customCount, total: routineSlots })}
          </p>
          <Link to="/store" className="btn-primary mt-3 w-full">
            {t('routines.getMore')}
          </Link>
        </div>
      ) : (
        <div>
          <Link to="/routines/new" className="btn-primary w-full">
            {t('routines.newRoutine')}
          </Link>
          <p className="mt-1.5 text-center text-xs text-slate-500">
            {t('routines.slotsUsed', { used: customCount, total: routineSlots })}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {routines.map((routine) => {
          const active = activeRoutineIds.includes(routine.id)
          const trainingDays = (routine.days ?? []).filter(
            (d) => d.sessionType !== 'rest' && d.blocks?.length > 0,
          )
          return (
            <Link
              key={routine.id}
              to={`/routines/${routine.id}`}
              className={`card block p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft ${active ? 'border-brand-400/60 shadow-neon-soft' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{routine.name}</h2>
                    {routine.isTemplate && (
                      <span className="chip border-slate-500/30 bg-ink-700/60 text-slate-400">{t('routines.template')}</span>
                    )}
                    {active && <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">{t('routines.active')}</span>}
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
                  title={active ? t('routines.deactivate') : t('routines.activate')}
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
                    return (
                      <span key={d.weekday} className={`chip ${meta.soft} ${meta.text}`}>
                        {t('weekdaysShort.' + d.weekday)}
                      </span>
                    )
                  })}
                <span className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">
                  {t('routines.daysCount', { count: trainingDays.length })}
                </span>
              </div>

              {!routine.isTemplate && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => handleDelete(e, routine)}
                    className="text-xs font-semibold text-neon-red/80 hover:text-neon-red"
                  >
                    {t('routines.delete')}
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

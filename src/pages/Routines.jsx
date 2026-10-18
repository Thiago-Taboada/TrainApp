import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalog } from '../hooks/useCatalog'
import { SESSION_TYPE_META, MUSCLE_GROUPS } from '../data/seedData'
import { localized } from '../lib/i18nContent'
import Spinner from '../components/Spinner.jsx'

// Derive the set of muscle groups a routine works, from the exercises in its
// blocks. Used for the catalog filter chips.
function routineMuscles(routine, exerciseById) {
  const set = new Set()
  for (const d of routine.days ?? []) {
    for (const b of d.blocks ?? []) {
      const ex = exerciseById.get(b.exerciseId)
      for (const m of ex?.muscleGroups ?? []) set.add(m)
    }
  }
  return set
}

export default function Routines() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const {
    loading,
    routines,
    exercises,
    routineSlots,
    activeRoutineIds,
    setActiveRoutine,
    deleteRoutine,
  } = useCatalog()

  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('all')

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const customRoutines = useMemo(() => routines.filter((r) => r.isCustom), [routines])
  const baseRoutines = useMemo(() => routines.filter((r) => !r.isCustom), [routines])

  // Which muscle groups actually appear across the base catalog (for filter chips).
  const availableMuscles = useMemo(() => {
    const set = new Set()
    for (const r of baseRoutines) for (const m of routineMuscles(r, exerciseById)) set.add(m)
    return Object.keys(MUSCLE_GROUPS).filter((k) => set.has(k))
  }, [baseRoutines, exerciseById])

  // Filter the base catalog by text (name/description) and muscle area.
  const filteredBase = useMemo(() => {
    const term = search.trim().toLowerCase()
    return baseRoutines.filter((r) => {
      if (muscle !== 'all' && !routineMuscles(r, exerciseById).has(muscle)) return false
      if (term) {
        const hay = (localized(r.name, lang) + ' ' + localized(r.description, lang)).toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [baseRoutines, search, muscle, exerciseById, lang])

  if (loading) return <Spinner />

  const customCount = customRoutines.length
  const atLimit = customCount >= routineSlots

  async function handleDelete(e, routine) {
    e.preventDefault()
    e.stopPropagation()
    if (routine.isTemplate) return
    if (!confirm(t('routines.confirmDelete', { name: localized(routine.name, lang) }))) return
    await deleteRoutine(routine.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="neon-title text-2xl text-brand-300">{t('routines.title')}</h1>
        <p className="text-sm text-slate-500">{t('routines.subtitle')}</p>
      </div>

      {/* ---- My routines ------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          {t('routines.mine')} ({customCount})
        </h2>

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

        {customRoutines.length === 0 ? (
          <p className="card p-4 text-sm text-slate-500">{t('routines.noneOwn')}</p>
        ) : (
          customRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              active={activeRoutineIds.includes(routine.id)}
              lang={lang}
              t={t}
              onToggle={setActiveRoutine}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>

      {/* ---- Catalog (base routines) ------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          {t('routines.catalog')} ({baseRoutines.length})
        </h2>

        {/* Search */}
        <div className="relative">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('routines.search')}
            className="input pl-10"
          />
        </div>

        {/* Muscle-area filters */}
        {availableMuscles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <FilterChip active={muscle === 'all'} onClick={() => setMuscle('all')}>
              {t('routines.allAreas')}
            </FilterChip>
            {availableMuscles.map((key) => (
              <FilterChip key={key} active={muscle === key} onClick={() => setMuscle(key)}>
                {t('muscles.' + key)}
              </FilterChip>
            ))}
          </div>
        )}

        {filteredBase.length === 0 ? (
          <p className="card p-4 text-sm text-slate-500">{t('routines.noneFound')}</p>
        ) : (
          filteredBase.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              active={activeRoutineIds.includes(routine.id)}
              lang={lang}
              t={t}
              onToggle={setActiveRoutine}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>
    </div>
  )
}

function RoutineCard({ routine, active, lang, t, onToggle, onDelete }) {
  const trainingDays = (routine.days ?? []).filter(
    (d) => d.sessionType !== 'rest' && d.blocks?.length > 0,
  )
  return (
    <Link
      to={`/routines/${routine.id}`}
      className={`card block p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft ${active ? 'border-brand-400/60 shadow-neon-soft' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">{localized(routine.name, lang)}</h2>
            {routine.isTemplate && (
              <span className="chip border-slate-500/30 bg-ink-700/60 text-slate-400">{t('routines.template')}</span>
            )}
            {active && <span className="chip border-brand-400/50 bg-brand-500/15 text-brand-300 neon-text">{t('routines.active')}</span>}
          </div>
          {routine.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{localized(routine.description, lang)}</p>
          )}
        </div>

        {/* Active toggle */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggle(routine.id, !active)
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

      {routine.isCustom && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={(e) => onDelete(e, routine)}
            className="text-xs font-semibold text-neon-red/80 hover:text-neon-red"
          >
            {t('routines.delete')}
          </button>
        </div>
      )}
    </Link>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip shrink-0 border py-1.5 ${
        active
          ? 'border-brand-400 bg-brand-500/20 text-brand-200 shadow-neon'
          : 'border-slate-500/25 bg-ink-800/60 text-slate-400 hover:border-brand-400/40 hover:text-brand-200'
      }`}
    >
      {children}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
    </svg>
  )
}

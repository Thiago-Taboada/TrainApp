import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { CATEGORIES, MUSCLE_GROUPS } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

const CATEGORY_STYLE = {
  strength: 'bg-brand-500/10 text-brand-300 border-brand-400/40',
  mobility: 'bg-neon-amber/10 text-neon-amber border-neon-amber/40',
  staticStretch: 'bg-neon-pink/10 text-neon-pink border-neon-pink/40',
  activeFlex: 'bg-neon-purple/10 text-neon-purple border-neon-purple/40',
}

export default function Library() {
  const { exercises, loading } = useCatalog()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [muscle, setMuscle] = useState('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (category !== 'all' && ex.category !== category) return false
      if (muscle !== 'all' && !(ex.muscleGroups ?? []).includes(muscle)) return false
      if (term && !ex.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [exercises, search, category, muscle])

  const grouped = useMemo(() => {
    const map = {}
    for (const ex of filtered) {
      ;(map[ex.category] ??= []).push(ex)
    }
    return map
  }, [filtered])

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="neon-title text-2xl text-brand-300">Biblioteca de ejercicios</h1>
          <p className="text-sm text-slate-500">Guía de técnica, con búsqueda y filtros.</p>
        </div>
        <Link to="/ejercicios/nuevo" className="btn-primary shrink-0 px-3 py-2 text-xs">
          + Nuevo
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio…"
          className="input pl-10"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
          Todas
        </FilterChip>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <FilterChip key={key} active={category === key} onClick={() => setCategory(key)}>
            {label}
          </FilterChip>
        ))}
      </div>

      {/* Muscle group filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <FilterChip small active={muscle === 'all'} onClick={() => setMuscle('all')}>
          Todos los grupos
        </FilterChip>
        {Object.entries(MUSCLE_GROUPS).map(([key, label]) => (
          <FilterChip key={key} small active={muscle === key} onClick={() => setMuscle(key)}>
            {label}
          </FilterChip>
        ))}
      </div>

      <p className="text-xs font-medium text-slate-400">
        {filtered.length} ejercicio{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No se encontraron ejercicios con esos filtros.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                {CATEGORIES[cat] ?? cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((ex) => (
                  <Link
                    key={ex.id}
                    to={`/biblioteca/${ex.id}`}
                    className="card flex flex-col gap-2 p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 font-semibold leading-tight">
                        {ex.name}
                        {ex.isCustom && <span className="chip border-neon-purple/40 bg-neon-purple/10 text-neon-purple">Mío</span>}
                      </h3>
                      <span className={`chip ${CATEGORY_STYLE[ex.category] ?? 'bg-ink-700 text-slate-400'}`}>
                        {CATEGORIES[ex.category]}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500">{ex.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(ex.muscleGroups ?? []).map((m) => (
                        <span key={m} className="chip border-slate-500/20 bg-ink-700/60 text-slate-400">
                          {MUSCLE_GROUPS[m] ?? m}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, small, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip shrink-0 border ${small ? 'py-1' : 'py-1.5'} ${
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

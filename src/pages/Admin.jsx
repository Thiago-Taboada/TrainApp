import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { CATEGORIES } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth()
  const {
    loading,
    exercises,
    routines,
    catalogSeeded,
    seedCatalog,
  } = useCatalog()

  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  if (authLoading || loading) return <Spinner />

  // Guard: only admins. Everyone else is bounced to Home.
  if (!isAdmin) return <Navigate to="/" replace />

  const baseExercises = exercises.filter((e) => !e.isCustom)
  const baseRoutines = routines.filter((r) => !r.isCustom)

  async function handleSeed() {
    if (!confirm('¿Cargar el catálogo base en Firestore desde los datos de ejemplo?')) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await seedCatalog()
      setSeedMsg(`Catálogo cargado: ${res.exercises} ejercicios y ${res.routines} rutina.`)
    } catch (err) {
      setSeedMsg('Error: ' + (err?.message ?? 'no se pudo cargar'))
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="neon-title text-2xl text-brand-300">Administración</h1>
        <p className="text-sm text-slate-500">Gestión del catálogo base y usuarios.</p>
      </div>

      <Link to="/admin/usuarios" className="card flex items-center justify-between p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft">
        <div>
          <p className="font-semibold text-slate-100">Usuarios</p>
          <p className="text-sm text-slate-400">Ver rutinas y ejercicios que crean.</p>
        </div>
        <span className="text-xs font-semibold text-brand-400">Ver</span>
      </Link>

      {/* Seed / status */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100">Catálogo base</p>
            <p className="text-sm text-slate-400">
              {catalogSeeded
                ? 'Cargado en Firestore. Los cambios llegan a todos los usuarios.'
                : 'Aún no está en Firestore. La app usa los datos de ejemplo del código.'}
            </p>
          </div>
          <span className={`chip ${catalogSeeded ? 'border-brand-400/50 bg-brand-500/15 text-brand-300' : 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber'}`}>
            {catalogSeeded ? 'En Firestore' : 'Sin cargar'}
          </span>
        </div>

        {!catalogSeeded && (
          <button onClick={handleSeed} disabled={seeding} className="btn-primary mt-4 w-full">
            {seeding ? 'Cargando…' : 'Cargar catálogo base en Firestore'}
          </button>
        )}
        {seedMsg && <p className="mt-3 text-sm text-brand-300">{seedMsg}</p>}
      </div>

      {/* Base routines */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          Rutinas base ({baseRoutines.length})
        </h2>
        <div className="space-y-2">
          {baseRoutines.map((r) => (
            <Link
              key={r.id}
              to={`/admin/rutina/${r.id}`}
              className="card flex items-center justify-between p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft"
            >
              <div>
                <p className="font-semibold text-slate-100">{r.name}</p>
                <p className="text-xs text-slate-400">id: {r.id}</p>
              </div>
              <span className="text-xs font-semibold text-brand-400">Editar</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Base exercises */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          Ejercicios base ({baseExercises.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {baseExercises.map((ex) => (
            <Link
              key={ex.id}
              to={`/admin/ejercicio/${ex.id}`}
              className="card flex items-center justify-between gap-2 p-3 transition hover:border-brand-400/60"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-200">{ex.name}</span>
                <span className="block text-xs text-slate-500">{CATEGORIES[ex.category] ?? ex.category}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-brand-400">Editar</span>
            </Link>
          ))}
        </div>
        <Link to="/admin/ejercicio/nuevo" className="btn-ghost mt-3 w-full">
          + Nuevo ejercicio base
        </Link>
      </section>
    </div>
  )
}

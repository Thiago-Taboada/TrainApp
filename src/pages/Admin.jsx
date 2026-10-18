import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import Spinner from '../components/Spinner.jsx'

export default function Admin() {
  const { t } = useTranslation()
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
    if (!confirm(t('admin.confirmSeed'))) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await seedCatalog()
      setSeedMsg(t('admin.seedDone', { exercises: res.exercises, routines: res.routines }))
    } catch (err) {
      setSeedMsg(t('admin.seedError') + (err?.message ?? t('admin.seedErrorFallback')))
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="neon-title text-2xl text-brand-300">{t('admin.title')}</h1>
        <p className="text-sm text-slate-500">{t('admin.subtitle')}</p>
      </div>

      <Link to="/admin/usuarios" className="card flex items-center justify-between p-4 transition hover:border-brand-400/60 hover:shadow-neon-soft">
        <div>
          <p className="font-semibold text-slate-100">{t('admin.users')}</p>
          <p className="text-sm text-slate-400">{t('admin.usersDesc')}</p>
        </div>
        <span className="text-xs font-semibold text-brand-400">{t('admin.view')}</span>
      </Link>

      {/* Seed / status */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100">{t('admin.baseCatalog')}</p>
            <p className="text-sm text-slate-400">
              {catalogSeeded ? t('admin.catalogSeeded') : t('admin.catalogNotSeeded')}
            </p>
          </div>
          <span className={`chip ${catalogSeeded ? 'border-brand-400/50 bg-brand-500/15 text-brand-300' : 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber'}`}>
            {catalogSeeded ? t('admin.inFirestore') : t('admin.notSeeded')}
          </span>
        </div>

        {!catalogSeeded && (
          <button onClick={handleSeed} disabled={seeding} className="btn-primary mt-4 w-full">
            {seeding ? t('admin.seeding') : t('admin.seedCatalog')}
          </button>
        )}
        {seedMsg && <p className="mt-3 text-sm text-brand-300">{seedMsg}</p>}
      </div>

      {/* Base routines */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          {t('admin.baseRoutines', { count: baseRoutines.length })}
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
              <span className="text-xs font-semibold text-brand-400">{t('admin.edit')}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Base exercises */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          {t('admin.baseExercises', { count: baseExercises.length })}
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
                <span className="block text-xs text-slate-500">{t('categories.' + ex.category)}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-brand-400">{t('admin.edit')}</span>
            </Link>
          ))}
        </div>
        <Link to="/admin/ejercicio/nuevo" className="btn-ghost mt-3 w-full">
          {t('admin.newBaseExercise')}
        </Link>
      </section>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { fetchUserContent, fetchUsers } from '../lib/adminData'
import { SESSION_TYPE_META } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

export default function AdminUserDetail() {
  const { t } = useTranslation()
  const { uid } = useParams()
  const { isAdmin, loading: authLoading } = useAuth()
  const { exercises: baseExercises } = useCatalog()
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([fetchUserContent(uid), fetchUsers()])
      .then(([content, users]) => {
        setData(content)
        setProfile(users.find((u) => u.uid === uid) ?? null)
      })
      .catch((err) => setError(err?.message ?? t('admin.loadError')))
  }, [isAdmin, uid])

  // Resolve exercise names: base catalog + this user's custom exercises.
  const nameById = useMemo(() => {
    const m = new Map()
    for (const e of baseExercises) m.set(e.id, e.name)
    for (const e of data?.exercises ?? []) m.set(e.id, e.name)
    return m
  }, [baseExercises, data])

  if (authLoading) return <Spinner />
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="space-y-5">
      <Link to="/admin/usuarios" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> {t('admin.users')}
      </Link>

      <div>
        <h1 className="neon-title text-2xl text-brand-300">{profile?.displayName || t('admin.user')}</h1>
        <p className="text-sm text-slate-500">{profile?.email}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">{error}</p>
      )}

      {data === null && !error ? (
        <Spinner label={t('admin.loadingContent')} />
      ) : (
        <>
          {/* Routines */}
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              {t('admin.ownRoutines', { count: data?.routines.length ?? 0 })}
            </h2>
            {data?.routines.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">{t('admin.noRoutines')}</p>
            ) : (
              <div className="space-y-3">
                {data?.routines.map((r) => (
                  <div key={r.id} className="card p-4">
                    <p className="font-semibold text-slate-100">{r.name}</p>
                    {r.description && <p className="mt-0.5 text-xs text-slate-400">{r.description}</p>}
                    <div className="mt-3 space-y-2">
                      {(r.days ?? [])
                        .filter((d) => d.sessionType !== 'rest' && (d.blocks?.length ?? 0) > 0)
                        .map((d) => {
                          const meta = SESSION_TYPE_META[d.sessionType] ?? SESSION_TYPE_META.rest
                          return (
                            <div key={d.weekday} className="rounded-lg border border-slate-500/15 bg-ink-900/60 p-3">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                                <p className="text-sm font-semibold text-slate-200">{t('weekdays.' + d.weekday)} · {d.label}</p>
                              </div>
                              <ul className="mt-1.5 space-y-1 text-sm text-slate-400">
                                {(d.blocks ?? []).map((b, i) => (
                                  <li key={i} className="flex justify-between">
                                    <span>{nameById.get(b.exerciseId) ?? t('admin.deletedExercise')}</span>
                                    <span className="font-mono text-slate-500">{b.sets}×{b.repsText}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exercises */}
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              {t('admin.ownExercisesCount', { count: data?.exercises.length ?? 0 })}
            </h2>
            {data?.exercises.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">{t('admin.noOwnExercises')}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {data?.exercises.map((ex) => (
                  <div key={ex.id} className="card p-3">
                    <p className="text-sm font-semibold text-slate-200">{ex.name}</p>
                    <p className="text-xs text-slate-500">{t('categories.' + ex.category)}</p>
                    {ex.description && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{ex.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchUsers } from '../lib/adminData'
import Spinner from '../components/Spinner.jsx'

export default function AdminUsers() {
  const { t } = useTranslation()
  const { isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err?.message ?? t('admin.loadUsersError')))
  }, [isAdmin])

  if (authLoading) return <Spinner />
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> {t('admin.back')}
      </Link>

      <div>
        <h1 className="neon-title text-2xl text-brand-300">{t('admin.users')}</h1>
        <p className="text-sm text-slate-500">{t('admin.usersSubtitle')}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">{error}</p>
      )}

      {users === null && !error ? (
        <Spinner label={t('admin.loadingUsers')} />
      ) : (
        <>
          <p className="text-xs font-medium text-slate-400">{t('admin.usersCount', { count: users?.length ?? 0 })}</p>
          <div className="space-y-2">
            {users?.map((u) => (
              <Link
                key={u.uid}
                to={`/admin/usuarios/${u.uid}`}
                className="card flex items-center gap-3 p-3 transition hover:border-brand-400/60"
              >
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="h-9 w-9 rounded-full border border-brand-400/30" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-400/30 bg-ink-800 text-sm font-semibold text-brand-300">
                    {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-200">{u.displayName || t('admin.noName')}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-brand-400">{t('admin.view')}</span>
              </Link>
            ))}
          </div>
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

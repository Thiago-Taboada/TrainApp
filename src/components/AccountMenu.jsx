import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { exportUserData } from '../lib/exportData'
import { CoinIcon } from './icons.jsx'

export default function AccountMenu() {
  const { user, isAdmin, signOut } = useAuth()
  const { exercises, routines, activeRoutineIds } = useCatalog()
  const { logs, weights } = useLogs()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  function handleExport() {
    setOpen(false)
    exportUserData({
      user,
      logs,
      weights,
      customExercises: exercises.filter((e) => e.isCustom),
      customRoutines: routines.filter((r) => r.isCustom),
      activeRoutineIds,
    })
  }

  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-full outline-none ring-brand-400/60 transition focus-visible:ring-2"
        title="Cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className={`h-8 w-8 rounded-full border border-brand-400/40 ring-1 transition ${open ? 'ring-brand-400 shadow-neon' : 'ring-brand-500/20'}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/40 bg-ink-800 text-sm font-semibold text-brand-300 ${open ? 'shadow-neon' : ''}`}>
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-brand-500/30 bg-ink-850/95 shadow-neon-soft backdrop-blur-md"
        >
          {/* Header: identity */}
          <div className="flex items-center gap-3 border-b border-brand-500/15 p-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full border border-brand-400/40" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/40 bg-ink-800 font-semibold text-brand-300">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{user?.displayName || 'Atleta'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Items */}
          <div className="p-1.5">
            <MenuItem onClick={() => go('/cuenta')} icon={<UserIcon />}>Mi cuenta</MenuItem>
            <MenuItem onClick={() => go('/tienda')} icon={<CoinIcon className="h-5 w-5" />}>Tienda</MenuItem>
            <MenuItem onClick={() => go('/rutinas')} icon={<ListIcon />}>Rutinas</MenuItem>
            <MenuItem onClick={handleExport} icon={<DownloadIcon />}>Exportar mis datos</MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => go('/admin')} icon={<ShieldIcon />}>Administración</MenuItem>
            )}
          </div>

          <div className="border-t border-brand-500/15 p-1.5">
            <MenuItem onClick={signOut} icon={<LogoutIcon />} danger>
              Cerrar sesión
            </MenuItem>
          </div>

          <p className="px-4 pb-3 pt-1 text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
            Vortx · v0.1.0
          </p>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, children, onClick, danger }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
        danger
          ? 'text-neon-red/90 hover:bg-neon-red/10 hover:text-neon-red'
          : 'text-slate-300 hover:bg-brand-500/10 hover:text-brand-200'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {children}
    </button>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0 4-4m-4 4 4 4M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6" />
    </svg>
  )
}

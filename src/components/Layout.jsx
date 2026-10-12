import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/', label: 'Hoy', icon: HomeIcon, end: true },
  { to: '/biblioteca', label: 'Ejercicios', icon: BookIcon },
  { to: '/rutinas', label: 'Rutinas', icon: ListIcon },
  { to: '/cronograma', label: 'Semana', icon: CalendarIcon },
  { to: '/analisis', label: 'Análisis', icon: ChartIcon },
]

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/')) ?? NAV[0]

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-brand-500/20 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-400/50 bg-ink-900 shadow-neon">
              <svg viewBox="0 0 48 48" className="h-5 w-5 fill-brand-400">
                <rect x="9" y="21" width="5" height="6" rx="1.5" />
                <rect x="34" y="21" width="5" height="6" rx="1.5" />
                <rect x="14" y="18" width="4" height="12" rx="1.5" />
                <rect x="30" y="18" width="4" height="12" rx="1.5" />
                <rect x="18" y="22.5" width="12" height="3" rx="1.5" />
              </svg>
            </div>
            <span className="neon-title text-lg text-brand-300">TrainApp</span>
            <span className="ml-1 hidden font-mono text-xs uppercase tracking-widest text-neon-pink sm:inline">
              // {current.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-300 neon-text'
                        : 'text-slate-400 hover:text-brand-200'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full border border-brand-400/40 ring-1 ring-brand-500/20" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/40 bg-ink-800 text-sm font-semibold text-brand-300">
                  {(user?.displayName ?? '?').charAt(0)}
                </div>
              )}
              <button onClick={signOut} title="Cerrar sesión" className="rounded-lg p-2 text-slate-500 transition hover:bg-ink-800 hover:text-neon-pink">
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:pb-10">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-500/20 bg-ink-950/90 backdrop-blur-md md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                    isActive ? 'text-brand-300 neon-text' : 'text-slate-500'
                  }`
                }
              >
                <Icon />
                {n.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2zM8 7h7M8 11h7" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 15v-4m4 4V8m4 7v-6" />
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

import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AccountMenu from './AccountMenu.jsx'

const NAV = [
  { to: '/', key: 'today', icon: HomeIcon, end: true },
  { to: '/biblioteca', key: 'exercises', icon: BookIcon },
  { to: '/rutinas', key: 'routines', icon: ListIcon },
  { to: '/cronograma', key: 'schedule', icon: CalendarIcon },
  { to: '/analisis', key: 'analysis', icon: ChartIcon },
]

// Labels for routes that aren't in the main nav (shown in the header subtitle).
const EXTRA_LABELS = [
  { to: '/cuenta', key: 'account' },
  { to: '/tienda', key: 'store' },
  { to: '/admin', key: 'admin' },
  { to: '/sesion', key: 'session' },
  { to: '/entrenar', key: 'workout' },
]

export default function Layout({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const path = location.pathname
  const current =
    NAV.find((n) => (n.end ? path === n.to : path.startsWith(n.to) && n.to !== '/')) ??
    EXTRA_LABELS.find((n) => path.startsWith(n.to)) ??
    (path === '/' ? NAV[0] : null)

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-brand-500/20 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="brand-font text-2xl leading-none text-brand-300">Vortx</span>
            {current && (
              <span className="ml-1 hidden font-mono text-xs uppercase tracking-widest text-neon-pink sm:inline">
                // {t(`nav.${current.key}`)}
              </span>
            )}
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
                        ? 'text-brand-300 neon-text underline decoration-2 decoration-brand-400 underline-offset-4'
                        : 'text-slate-400 hover:text-brand-200'
                    }`
                  }
                >
                  {t(`nav.${n.key}`)}
                </NavLink>
              ))}
            </nav>
            <AccountMenu />
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
                {t(`nav.${n.key}`)}
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

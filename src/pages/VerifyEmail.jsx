import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function VerifyEmail() {
  const { user, resendVerification, reloadUser, signOut, error } = useAuth()
  const [checking, setChecking] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [notYet, setNotYet] = useState(false)
  const pollRef = useRef(null)

  // Auto-poll every 5s so that if the user verifies in another tab, the app
  // lets them in without manual action.
  useEffect(() => {
    pollRef.current = setInterval(() => {
      reloadUser()
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [reloadUser])

  // Cooldown timer for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleResend() {
    const ok = await resendVerification()
    if (ok) {
      setResent(true)
      setCooldown(45)
    }
  }

  async function handleCheck() {
    setChecking(true)
    setNotYet(false)
    const verified = await reloadUser()
    setChecking(false)
    if (!verified) setNotYet(true)
    // If verified, App re-renders and shows the app automatically.
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brand-500/10 to-transparent animate-scan" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-brand-500/30 bg-ink-850/80 p-8 shadow-neon-soft backdrop-blur-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-400/50 bg-ink-900 text-brand-300 shadow-neon">
            <MailIcon />
          </div>
          <h1 className="neon-title text-xl text-brand-300">Verifica tu correo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enviamos un enlace de verificación a
          </p>
          <p className="font-mono text-sm text-brand-200">{user?.email}</p>
          <p className="mt-3 text-xs text-slate-500">
            Abre el enlace y luego vuelve aquí. Revisa también spam.
          </p>
        </div>

        {resent && (
          <p className="mb-3 rounded-lg border border-brand-400/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-300">
            Correo reenviado. Revisa tu bandeja.
          </p>
        )}
        {notYet && (
          <p className="mb-3 rounded-lg border border-neon-amber/40 bg-neon-amber/10 px-3 py-2 text-sm text-neon-amber">
            Aún no detectamos la verificación. Abre el enlace y reintenta.
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
            {error}
          </p>
        )}

        <button onClick={handleCheck} disabled={checking} className="btn-primary w-full">
          {checking ? 'Comprobando…' : 'Ya verifiqué mi correo'}
        </button>

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="btn-ghost mt-3 w-full"
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar correo'}
        </button>

        <button
          onClick={signOut}
          className="mt-5 w-full text-center text-xs font-semibold text-slate-500 hover:text-neon-pink"
        >
          Usar otra cuenta
        </button>
      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  )
}

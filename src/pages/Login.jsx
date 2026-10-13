import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { signInWithGoogle, error } = useAuth()

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-5">
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brand-500/10 to-transparent animate-scan" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-brand-500/30 bg-ink-850/80 p-8 shadow-neon-soft backdrop-blur-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <h1 className="brand-font animate-flicker text-6xl text-brand-300">Train App</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-neon-pink">
            // Libera tu potencial
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Registra, mide y evoluciona.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="btn w-full border border-brand-400/50 bg-ink-900/80 text-slate-100 hover:bg-ink-800 hover:shadow-neon"
        >
          <GoogleIcon />
          Entrar con Google
        </button>

        {error && (
          <p className="mt-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
            {error}
          </p>
        )}

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-slate-500">
          datos cifrados en tu cuenta
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.4 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}

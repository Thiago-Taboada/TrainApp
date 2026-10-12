export default function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink-700 border-t-brand-400 shadow-neon" />
      <p className="font-mono text-xs uppercase tracking-widest">{label}</p>
    </div>
  )
}

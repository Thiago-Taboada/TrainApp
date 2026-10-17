import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { useLogs } from '../hooks/useLogs'
import { exportUserData, parseImportFile } from '../lib/exportData'
import { fromISODate } from '../lib/dates'
import { computeStreak } from '../lib/streak'
import Spinner from '../components/Spinner.jsx'
import { FlameIcon } from '../components/icons.jsx'

export default function Account() {
  const { user, signOut, providerLabel, isPasswordUser, updateDisplayName, deleteAccount, error, clearError } = useAuth()
  const { exercises, routines, activeRoutines, activeRoutineIds, loading, importCatalog } = useCatalog()
  const { logs, weights, loading: logsLoading, importLogsAndWeights } = useLogs()
  const navigate = useNavigate()

  const stats = useMemo(() => computeStats(logs), [logs])
  const streak = useMemo(() => computeStreak(logs, activeRoutines), [logs, activeRoutines])

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reauthNeeded, setReauthNeeded] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const fileInputRef = useRef(null)

  if (loading || logsLoading) return <Spinner />

  function handleExport() {
    exportUserData({
      user,
      logs,
      weights,
      customExercises: exercises.filter((e) => e.isCustom),
      customRoutines: routines.filter((r) => r.isCustom),
      activeRoutineIds,
    })
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setImportError('')
    setImportDone(false)
    setImportPreview(null)
    try {
      const payload = await parseImportFile(file)
      setImportPreview(payload)
    } catch (err) {
      setImportError(err?.message ?? 'No se pudo leer el archivo.')
    }
  }

  async function runImport() {
    if (!importPreview) return
    setImporting(true)
    setImportError('')
    try {
      await importLogsAndWeights(importPreview.logs, importPreview.weights)
      await importCatalog({
        customExercises: importPreview.customExercises,
        customRoutines: importPreview.customRoutines,
        activeRoutineIds: importPreview.activeRoutineIds,
      })
      setImportPreview(null)
      setImportDone(true)
    } catch (err) {
      setImportError(err?.message ?? 'No se pudo importar.')
    } finally {
      setImporting(false)
    }
  }

  function cancelImport() {
    setImportPreview(null)
    setImportError('')
  }

  function startEdit() {
    setName(user?.displayName ?? '')
    setEditing(true)
  }

  async function saveName() {
    if (!name.trim()) return
    setSavingName(true)
    const ok = await updateDisplayName(name)
    setSavingName(false)
    if (ok) setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    // Pass the reauth password only when email account + reauth is being asked.
    const res = await deleteAccount(isPasswordUser ? reauthPassword : undefined)
    setDeleting(false)
    if (res.ok) {
      navigate('/') // signed out automatically after deletion
    } else if (res.needsReauth) {
      // Google reauth happens via popup inside deleteAccount; if it still needs
      // reauth it means the popup was cancelled or the password is required.
      setReauthNeeded(true)
    }
  }

  function cancelDelete() {
    setConfirmDelete(false)
    setReauthNeeded(false)
    setReauthPassword('')
    clearError()
  }

  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-5">
      <h1 className="neon-title text-2xl text-brand-300">Mi cuenta</h1>

      {/* Identity */}
      <div className="card flex items-center gap-4 p-5">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="h-16 w-16 shrink-0 rounded-full border border-brand-400/50 shadow-neon" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand-400/50 bg-ink-800 text-2xl font-bold text-brand-300 shadow-neon">
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="input py-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveName} disabled={savingName || !name.trim()} className="btn-primary px-3 py-1.5 text-xs">
                  {savingName ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost px-3 py-1.5 text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-bold text-slate-100">{user?.displayName || 'Atleta'}</p>
                <button onClick={startEdit} title="Editar nombre" className="shrink-0 text-slate-500 hover:text-brand-300">
                  <PencilIcon />
                </button>
              </div>
              <p className="truncate text-sm text-slate-400">{user?.email}</p>
              {providerLabel && (
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-neon-pink">
                  {providerLabel}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Streak */}
      <div className="card flex items-center gap-4 p-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${streak.current > 0 ? 'border-neon-amber/50 text-neon-amber shadow-[0_0_18px_rgba(255,176,32,0.3)]' : 'border-slate-500/30 text-slate-500'}`}>
          <FlameIcon active={streak.current > 0} />
        </div>
        <div className="flex-1">
          <p className="label">Racha actual</p>
          <p className={`font-display text-3xl font-extrabold ${streak.current > 0 ? 'text-neon-amber' : 'text-slate-400'}`}>
            {streak.current} <span className="text-base font-semibold text-slate-500">día{streak.current === 1 ? '' : 's'}</span>
          </p>
          <p className="text-xs text-slate-500">
            Mejor racha: {streak.best} día{streak.best === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entrenamientos" value={stats.total} tone="brand" />
        <Stat label="Minutos totales" value={stats.totalMinutes} tone="pink" />
        <Stat label="Rutinas activas" value={activeRoutines.length} tone="brand" />
        <Stat label="Ejercicios propios" value={exercises.filter((e) => e.isCustom).length} tone="pink" />
      </div>

      {/* Activity summary */}
      <div className="card p-5">
        <h2 className="mb-3 font-display font-bold uppercase tracking-wide text-slate-100">Actividad</h2>
        <Row label="Primer registro" value={stats.firstDate ?? '—'} />
        <Row label="Último entrenamiento" value={stats.lastDate ?? '—'} />
        <Row label="Promedio por sesión" value={stats.avgMinutes ? `${stats.avgMinutes} min` : '—'} last />
      </div>

      {/* Actions */}
      <div className="card p-1.5">
        <ActionRow onClick={handleExport} icon={<DownloadIcon />} label="Exportar mis datos" />
        <div className="mx-3 border-t border-brand-500/15" />
        <ActionRow onClick={() => fileInputRef.current?.click()} icon={<UploadIcon />} label="Restaurar backup" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* Import confirmation */}
      {importPreview && (
        <div className="card border-neon-red/40 p-5">
          <h2 className="font-display font-bold uppercase tracking-wide text-neon-red">Restaurar backup</h2>

          <div className="mt-3 rounded-lg border border-neon-red/40 bg-neon-red/10 p-3 text-sm text-neon-red">
            <p className="font-semibold">Esto reemplazará TODOS tus datos actuales.</p>
            <p className="mt-1 text-neon-red/90">
              Tus registros de entrenamiento, pesos, rutinas y ejercicios propios se
              borrarán por completo y se sustituirán por los del archivo. Esta acción
              no se puede deshacer.
            </p>
          </div>

          <p className="mt-3 text-sm text-slate-400">El backup contiene:</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>· {importPreview.logs.length} registros de entrenamiento</li>
            <li>· {importPreview.weights.length} registros de peso</li>
            <li>· {importPreview.customRoutines.length} rutinas propias</li>
            <li>· {importPreview.customExercises.length} ejercicios propios</li>
          </ul>
          <p className="mt-3 text-xs text-neon-amber">
            Consejo: exporta tus datos actuales antes de continuar, por si quieres volver atrás.
          </p>
          <p className="mt-2 text-xs text-slate-500">No se importa nombre ni correo.</p>

          {importError && (
            <p className="mt-3 rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
              {importError}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={runImport}
              disabled={importing}
              className="btn flex-1 border border-neon-red/60 bg-neon-red/20 text-neon-red hover:bg-neon-red/30"
            >
              {importing ? 'Restaurando…' : 'Sí, reemplazar todo'}
            </button>
            <button onClick={cancelImport} className="btn-ghost flex-1">Cancelar</button>
          </div>
        </div>
      )}
      {importError && !importPreview && (
        <p className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
          {importError}
        </p>
      )}
      {importDone && (
        <p className="rounded-lg border border-brand-400/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-300">
          Backup restaurado correctamente.
        </p>
      )}

      <button
        onClick={signOut}
        className="btn w-full border border-slate-500/30 bg-ink-700/50 text-slate-300 hover:border-brand-400/40 hover:text-brand-200"
      >
        <LogoutIcon /> Cerrar sesión
      </button>

      {/* Danger zone */}
      <div className="card border-neon-red/30 p-5">
        <h2 className="font-display font-bold uppercase tracking-wide text-neon-red">Zona de peligro</h2>
        <p className="mt-1 text-sm text-slate-400">
          Borrar tu cuenta elimina tu perfil y es permanente. Tus registros y rutinas dejarán de estar disponibles.
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
            {error}
          </p>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn mt-4 w-full border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20"
          >
            <TrashIcon /> Borrar mi cuenta
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">¿Seguro? Esta acción no se puede deshacer.</p>

            {/* Reauth prompt: only for email accounts when the session is stale */}
            {reauthNeeded && isPasswordUser && (
              <div>
                <label className="label mb-1.5">Confirma tu contraseña para continuar</label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  autoFocus
                />
              </div>
            )}
            {reauthNeeded && !isPasswordUser && (
              <p className="text-xs text-neon-amber">
                Confirma en la ventana de Google para continuar.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting || (reauthNeeded && isPasswordUser && !reauthPassword)}
                className="btn flex-1 border border-neon-red/60 bg-neon-red/20 text-neon-red hover:bg-neon-red/30"
              >
                {deleting ? 'Borrando…' : reauthNeeded ? 'Confirmar y borrar' : 'Sí, borrar'}
              </button>
              <button onClick={cancelDelete} className="btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Vortx · v0.1.0
      </p>
    </div>
  )
}

function computeStats(logs) {
  const trained = logs.filter((l) => l.trained)
  const total = trained.length
  const totalMinutes = trained.reduce((a, l) => a + (Number(l.durationMinutes) || 0), 0)
  const withDuration = trained.filter((l) => Number(l.durationMinutes) > 0)
  const avgMinutes = withDuration.length
    ? Math.round(totalMinutes / withDuration.length)
    : 0

  const dates = trained.map((l) => l.date).sort()
  const firstDate = dates[0] ? fmt(dates[0]) : null
  const lastDate = dates.at(-1) ? fmt(dates.at(-1)) : null

  return {
    total,
    totalMinutes,
    avgMinutes,
    firstDate,
    lastDate,
  }
}

function fmt(iso) {
  return fromISODate(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Stat({ label, value, tone }) {
  const color = tone === 'pink' ? 'text-neon-pink neon-text-pink' : 'text-brand-300 neon-text'
  return (
    <div className="card p-4">
      <p className={`font-display text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  )
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b border-brand-500/10'}`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-200">{value}</span>
    </div>
  )
}

function ActionRow({ onClick, icon, label, sub }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-brand-500/10">
      <span className="text-brand-300">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-200">{label}</span>
        {sub && <span className="block text-xs text-slate-400">{sub}</span>}
      </span>
    </button>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  )
}
function UploadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V8m0 0 4 4m-4-4-4 4M5 4h14" />
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
function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

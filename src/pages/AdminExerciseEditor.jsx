import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../hooks/useCatalog'
import { CATEGORIES, MUSCLE_GROUPS, TRACKING_TYPES } from '../data/seedData'
import Spinner from '../components/Spinner.jsx'

const EMPTY = {
  name: '',
  category: 'strength',
  tracking: 'reps',
  muscleGroups: [],
  equipment: '',
  description: '',
  cues: '',
}

export default function AdminExerciseEditor() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { isAdmin, loading: authLoading } = useAuth()
  const { loading, exercises, saveBaseExercise, deleteBaseExercise } = useCatalog()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  const editing = Boolean(exerciseId)

  useEffect(() => {
    if (loading || ready) return
    if (editing) {
      const ex = exercises.find((e) => e.id === exerciseId)
      if (ex) {
        setForm({
          name: ex.name ?? '',
          category: ex.category ?? 'strength',
          tracking: ex.tracking ?? 'reps',
          muscleGroups: ex.muscleGroups ?? [],
          equipment: (ex.equipment ?? []).join(', '),
          description: ex.description ?? '',
          cues: (ex.cues ?? []).join('\n'),
          id: ex.id,
        })
      }
    }
    setReady(true)
  }, [loading, ready, editing, exerciseId, exercises])

  if (authLoading || loading) return <Spinner />
  if (!isAdmin) return <Navigate to="/" replace />

  function toggleMuscle(key) {
    setForm((f) => ({
      ...f,
      muscleGroups: f.muscleGroups.includes(key)
        ? f.muscleGroups.filter((m) => m !== key)
        : [...f.muscleGroups, key],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('Ponle un nombre al ejercicio.')
      return
    }
    setSaving(true)
    try {
      await saveBaseExercise({
        id: editing ? exerciseId : undefined,
        name: form.name.trim(),
        category: form.category,
        tracking: form.tracking,
        muscleGroups: form.muscleGroups,
        equipment: splitList(form.equipment, ','),
        description: form.description.trim(),
        cues: splitList(form.cues, '\n'),
      })
      navigate('/admin')
    } catch (err) {
      alert('No se pudo guardar: ' + (err?.message ?? 'error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este ejercicio base? Afecta a todos los usuarios.')) return
    await deleteBaseExercise(exerciseId)
    navigate('/admin')
  }

  return (
    <div className="space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> Administración
      </Link>

      <h1 className="neon-title text-2xl text-brand-300">
        {editing ? 'Editar ejercicio base' : 'Nuevo ejercicio base'}
      </h1>
      <p className="-mt-3 text-xs text-neon-amber">Los cambios afectan a todos los usuarios.</p>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label mb-1.5">Nombre</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>

        <div>
          <label className="label mb-1.5">Categoría</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label mb-1.5">Cómo se registra</label>
          <select value={form.tracking} onChange={(e) => setForm({ ...form, tracking: e.target.value })} className="input">
            {Object.entries(TRACKING_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label mb-2">Grupos musculares</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MUSCLE_GROUPS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => toggleMuscle(k)}
                className={`chip border ${
                  form.muscleGroups.includes(k)
                    ? 'border-brand-400 bg-brand-500/20 text-brand-200 shadow-neon'
                    : 'border-slate-500/25 bg-ink-800/60 text-slate-400 hover:border-brand-400/40 hover:text-brand-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-1.5">Equipo (separado por comas)</label>
          <input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} className="input" />
        </div>

        <div>
          <label className="label mb-1.5">Descripción / guía</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
        </div>

        <div>
          <label className="label mb-1.5">Notas clave (una por línea)</label>
          <textarea value={form.cues} onChange={(e) => setForm({ ...form, cues: e.target.value })} rows={3} className="input resize-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {editing && (
          <button onClick={handleDelete} className="btn border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20">
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

function splitList(str, sep) {
  return (str || '').split(sep).map((s) => s.trim()).filter(Boolean)
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

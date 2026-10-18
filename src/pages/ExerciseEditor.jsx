import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

export default function ExerciseEditor() {
  const { t } = useTranslation()
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { loading, exercises, saveExercise, deleteExercise } = useCatalog()
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
          isCustom: ex.isCustom,
        })
      }
    }
    setReady(true)
  }, [loading, ready, editing, exerciseId, exercises])

  if (loading) return <Spinner />

  const isBaseExercise = editing && form.isCustom === false
  const canEdit = !isBaseExercise

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
      alert(t('exerciseEditor.needName'))
      return
    }
    setSaving(true)
    try {
      await saveExercise({
        id: editing ? exerciseId : undefined,
        name: form.name.trim(),
        category: form.category,
        tracking: form.tracking,
        muscleGroups: form.muscleGroups,
        equipment: splitList(form.equipment, ','),
        description: form.description.trim(),
        cues: splitList(form.cues, '\n'),
      })
      navigate('/biblioteca')
    } catch (err) {
      console.error(err)
      alert(t('exerciseEditor.saveError') + (err?.message ?? t('exerciseEditor.saveErrorFallback')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(t('exerciseEditor.confirmDelete'))) return
    await deleteExercise(exerciseId)
    navigate('/biblioteca')
  }

  return (
    <div className="space-y-5">
      <Link to="/biblioteca" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-brand-300">
        <ChevronLeft /> {t('exerciseEditor.back')}
      </Link>

      <h1 className="neon-title text-2xl text-brand-300">
        {editing ? t('exerciseEditor.editTitle') : t('exerciseEditor.newTitle')}
      </h1>

      {isBaseExercise && (
        <div className="card border-neon-amber/40 bg-neon-amber/10 p-4 text-sm text-neon-amber">
          {t('exerciseEditor.baseWarning')}
        </div>
      )}

      <div className="card space-y-4 p-5">
        <div>
          <label className="label mb-1.5">{t('exerciseEditor.name')}</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!canEdit}
            placeholder={t('exerciseEditor.namePlaceholder')}
            className="input"
          />
        </div>

        <div>
          <label className="label mb-1.5">{t('exerciseEditor.category')}</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={!canEdit}
            className="input"
          >
            {Object.keys(CATEGORIES).map((k) => (
              <option key={k} value={k}>{t('categories.' + k)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label mb-1.5">{t('exerciseEditor.howTracked')}</label>
          <select
            value={form.tracking}
            onChange={(e) => setForm({ ...form, tracking: e.target.value })}
            disabled={!canEdit}
            className="input"
          >
            {Object.keys(TRACKING_TYPES).map((k) => (
              <option key={k} value={k}>{t('tracking.' + k)}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {form.tracking === 'reps' && t('exerciseEditor.trackReps')}
            {form.tracking === 'time' && t('exerciseEditor.trackTime')}
            {form.tracking === 'check' && t('exerciseEditor.trackCheck')}
          </p>
        </div>

        <div>
          <label className="label mb-2">{t('exerciseEditor.muscleGroups')}</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(MUSCLE_GROUPS).map((k) => (
              <button
                key={k}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleMuscle(k)}
                className={`chip border ${
                  form.muscleGroups.includes(k)
                    ? 'border-brand-400 bg-brand-500/20 text-brand-200 shadow-neon'
                    : 'border-slate-500/25 bg-ink-800/60 text-slate-400 hover:border-brand-400/40 hover:text-brand-200'
                }`}
              >
                {t('muscles.' + k)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-1.5">{t('exerciseEditor.equipment')}</label>
          <input
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            disabled={!canEdit}
            placeholder={t('exerciseEditor.equipmentPlaceholder')}
            className="input"
          />
        </div>

        <div>
          <label className="label mb-1.5">{t('exerciseEditor.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={!canEdit}
            rows={3}
            placeholder={t('exerciseEditor.descriptionPlaceholder')}
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label mb-1.5">{t('exerciseEditor.cues')}</label>
          <textarea
            value={form.cues}
            onChange={(e) => setForm({ ...form, cues: e.target.value })}
            disabled={!canEdit}
            rows={3}
            placeholder={t('exerciseEditor.cuesPlaceholder')}
            className="input resize-none"
          />
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? t('exerciseEditor.saving') : t('exerciseEditor.saveExercise')}
          </button>
          {editing && (
            <button onClick={handleDelete} className="btn border border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20">
              {t('exerciseEditor.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function splitList(str, sep) {
  return (str || '')
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean)
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

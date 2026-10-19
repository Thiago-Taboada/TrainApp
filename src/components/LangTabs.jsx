import { LANGUAGES } from '../i18n'

// A small tab bar to pick which language of a multilingual editor you're
// currently filling in. `value` is the active draft language code; `onChange`
// receives the new code.
export default function LangTabs({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && <span className="label mr-1">{label}</span>}
      <div className="inline-flex gap-1 rounded-xl border border-brand-500/20 bg-ink-900/60 p-1">
        {LANGUAGES.map((lng) => {
          const active = lng.code === value
          return (
            <button
              key={lng.code}
              type="button"
              onClick={() => onChange(lng.code)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? 'bg-brand-500/15 text-brand-300 neon-text'
                  : 'text-slate-400 hover:text-brand-200'
              }`}
            >
              {lng.code}
            </button>
          )
        })}
      </div>
    </div>
  )
}

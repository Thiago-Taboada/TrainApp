// Password policy: min 8 chars, at least one uppercase, one lowercase,
// one number and one special character.
export const PASSWORD_RULES = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Una minúscula', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Un número', test: (v) => /[0-9]/.test(v) },
  {
    key: 'special',
    label: 'Un carácter especial',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
]

export function checkPassword(value = '') {
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(value) }))
  return { results, valid: results.every((r) => r.ok) }
}

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

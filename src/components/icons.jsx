// Shared inline SVG icons. They use `currentColor` so the colour is controlled
// by the surrounding text colour (our neon palette via Tailwind classes).

export function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function RestIcon({ className = 'h-4 w-4' }) {
  // Crescent moon — "rest / recovery"
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export function ChartIcon({ className = 'h-10 w-10' }) {
  // Bar chart — empty state for analytics
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V5M4 20h16" />
      <rect x="7.5" y="12" width="2.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="12" y="8" width="2.5" height="9" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="16.5" y="10" width="2.5" height="7" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// A glowing status dot for the fatigue selector.
export function StatusDot({ className = '', tone = 'brand' }) {
  const toneClass =
    tone === 'spent'
      ? 'bg-neon-red shadow-[0_0_8px_rgba(255,59,92,0.8)]'
      : tone === 'ok'
        ? 'bg-neon-amber shadow-[0_0_8px_rgba(255,176,32,0.8)]'
        : 'bg-brand-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]'
  return <span className={`inline-block h-3.5 w-3.5 rounded-full ${toneClass} ${className}`} />
}

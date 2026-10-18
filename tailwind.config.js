/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Accent ("brand") — driven by CSS variables so themes can swap it.
        // Each var holds space-separated RGB channels (e.g. "0 240 255") so
        // Tailwind opacity modifiers like bg-brand-500/15 keep working.
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        // Magenta secondary accent
        neon: {
          pink: '#ff2bd6',
          purple: '#9d4bff',
          lime: '#c6ff00',
          amber: '#ffb020',
          red: '#ff3b5c',
        },
        // Dark surfaces
        ink: {
          950: '#05070e',
          900: '#0a0e1a',
          850: '#0f1424',
          800: '#141b31',
          700: '#1c2743',
          600: '#2a3761',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 5px rgb(var(--brand-500) / .5), 0 0 20px rgb(var(--brand-500) / .25)',
        'neon-pink': '0 0 5px rgba(255,43,214,.5), 0 0 20px rgba(255,43,214,.25)',
        'neon-soft': '0 0 0 1px rgb(var(--brand-500) / .25), 0 0 24px rgb(var(--brand-500) / .08)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '1' },
          '50%': { opacity: '.75' },
          '55%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        flicker: 'flicker 3s infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
}

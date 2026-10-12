/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Neon cyan = primary accent ("brand")
        brand: {
          50: '#e6ffff',
          100: '#b3fcff',
          200: '#80f9ff',
          300: '#4df6ff',
          400: '#1af2ff',
          500: '#00f0ff',
          600: '#00c2d6',
          700: '#0094a3',
          800: '#036d78',
          900: '#083e45',
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
        neon: '0 0 5px rgba(0,240,255,.5), 0 0 20px rgba(0,240,255,.25)',
        'neon-pink': '0 0 5px rgba(255,43,214,.5), 0 0 20px rgba(255,43,214,.25)',
        'neon-soft': '0 0 0 1px rgba(0,240,255,.25), 0 0 24px rgba(0,240,255,.08)',
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

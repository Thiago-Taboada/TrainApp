// Color themes. Each theme provides the `--brand-*` accent scale as RGB
// channel triplets (to match Tailwind's rgb(var(--x) / <alpha>) setup).
// `cyan` is the default and always owned/free.

export const THEMES = [
  {
    id: 'cyan',
    name: 'Cian',
    price: 0,
    swatch: '#00f0ff',
    vars: {
      50: '230 255 255',
      100: '179 252 255',
      200: '128 249 255',
      300: '77 246 255',
      400: '26 242 255',
      500: '0 240 255',
      600: '0 194 214',
      700: '0 148 163',
      800: '3 109 120',
      900: '8 62 69',
    },
  },
  {
    id: 'magenta',
    name: 'Magenta',
    price: 200,
    swatch: '#ff2bd6',
    vars: {
      50: '255 230 250',
      100: '255 191 240',
      200: '255 140 230',
      300: '255 97 221',
      400: '255 67 214',
      500: '255 43 214',
      600: '214 26 176',
      700: '163 16 134',
      800: '120 10 98',
      900: '69 6 57',
    },
  },
  {
    id: 'lime',
    name: 'Lima',
    price: 200,
    swatch: '#c6ff00',
    vars: {
      50: '246 255 214',
      100: '236 255 166',
      200: '223 255 110',
      300: '208 255 51',
      400: '198 255 0',
      500: '182 235 0',
      600: '150 194 0',
      700: '112 145 0',
      800: '78 101 0',
      900: '45 58 0',
    },
  },
  {
    id: 'amber',
    name: 'Ámbar',
    price: 200,
    swatch: '#ffb020',
    vars: {
      50: '255 244 224',
      100: '255 230 184',
      200: '255 212 133',
      300: '255 196 82',
      400: '255 176 32',
      500: '245 158 11',
      600: '202 126 6',
      700: '154 94 5',
      800: '110 66 4',
      900: '66 39 2',
    },
  },
  {
    id: 'violet',
    name: 'Violeta',
    price: 200,
    swatch: '#9d4bff',
    vars: {
      50: '240 230 255',
      100: '224 200 255',
      200: '204 164 255',
      300: '181 123 255',
      400: '157 75 255',
      500: '139 54 246',
      600: '112 40 210',
      700: '86 28 163',
      800: '61 19 118',
      900: '36 10 71',
    },
  },
  {
    id: 'red',
    name: 'Rojo',
    price: 200,
    swatch: '#ff3b5c',
    vars: {
      50: '255 228 233',
      100: '255 194 204',
      200: '255 148 165',
      300: '255 102 125',
      400: '255 71 98',
      500: '255 59 92',
      600: '214 36 66',
      700: '163 22 46',
      800: '120 14 32',
      900: '69 7 18',
    },
  },
]

export const DEFAULT_THEME = 'cyan'

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

// Apply a theme by writing its accent channels onto the document root.
export function applyTheme(id) {
  const theme = getTheme(id)
  const root = document.documentElement
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(`--brand-${k}`, v)
  }
  root.dataset.theme = theme.id
}

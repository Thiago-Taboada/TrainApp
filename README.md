# Train App

Aplicación web para seguir una rutina de fuerza y flexibilidad: catálogo de ejercicios, registro diario de entrenamiento y análisis de progreso. Pensada para entrenar en casa con enfoque en movilidad para patadas altas.

## Características

- **Biblioteca de ejercicios** con búsqueda y filtros por categoría y grupo muscular. Permite crear ejercicios propios.
- **Rutinas** activables/desactivables. Incluye una plantilla base y permite crear rutinas personalizadas por día.
- **Cronograma + check-in diario**: duración, nivel de fatiga, y por serie reps, peso, RIR y fallo.
- **Análisis**: constancia (heatmap), adherencia semanal, evolución de reps/carga, volumen por grupo muscular y esfuerzo vs. fatiga.
- Autenticación con Google; cada usuario solo accede a sus propios datos.

## Stack

React + Vite · Tailwind CSS · Firebase (Auth + Firestore + Hosting) · Recharts

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completa con la config de tu proyecto Firebase
npm run dev
```

La config de Firebase se obtiene en la consola: *Project settings → Your apps → SDK setup*.

En el proyecto de Firebase hay que habilitar **Google** en Authentication y crear una base de **Firestore**.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run seed` | Carga ejercicios y la rutina plantilla en Firestore (requiere permisos de escritura temporales) |

## Estructura

```
src/
  pages/        Vistas (Login, Today, Library, Routines, Schedule, SessionLog, Analysis, editores)
  components/   UI compartida (Layout, Spinner)
  hooks/        useCatalog (ejercicios/rutinas), useLogs (registros)
  context/      AuthContext
  lib/          firebase, helpers de fechas y sesiones
  data/         seedData (rutina y ejercicios base)
```

## Datos

- `exercises` y `routines` base viven en el código (`src/data/seedData.js`) y la app funciona aunque Firestore esté vacío.
- Lo que creas tú (ejercicios, rutinas, registros) se guarda bajo `users/{uid}/` y es privado.
- Las reglas de seguridad están en `firestore.rules`.

## Deploy

```bash
npm run build
firebase deploy --only firestore:rules,hosting
```

## Notas

- Los valores de `.env` son la config pública de cliente de Firebase, no secretos; se mantienen fuera del repo por orden. La protección real son las reglas de Firestore.

# Vortx

Aplicación web para seguir rutinas de entrenamiento: catálogo de ejercicios, registro diario y análisis de progreso.

**Deploy:** https://project-vortx.web.app

## Características

- **Biblioteca de ejercicios** con búsqueda y filtros por categoría y grupo muscular. Permite crear ejercicios propios.
- **Rutinas** personalizables por día, activables/desactivables.
- **Cronograma** con registro diario: duración, nivel de fatiga, y por serie reps, peso, RIR y fallo.
- **Análisis**: constancia (heatmap), adherencia semanal, evolución de reps/carga, volumen por grupo muscular y esfuerzo vs. fatiga.
- **Mi cuenta**: datos de la cuenta, estadísticas y exportación de los datos propios.
- **Peso corporal**: registro semanal con recordatorio y gráfico de evolución.
- Autenticación con Google o correo/contraseña; cada usuario solo accede a sus propios datos.
- **PWA instalable** con soporte offline (manifest + service worker).

## Stack

React + Vite · Tailwind CSS · Firebase (Auth + Firestore + Hosting) · Recharts · vite-plugin-pwa

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
| `npm run seed` | Carga los datos de ejemplo en Firestore (requiere permisos de escritura temporales) |

## Estructura

```
src/
  pages/        Vistas (Login, Today, Library, Routines, Schedule, SessionLog, Analysis, Account, editores)
  components/   UI compartida (Layout, AccountMenu, Spinner, icons)
  hooks/        CatalogProvider/useCatalog (ejercicios/rutinas), LogsProvider/useLogs (registros)
  context/      AuthContext
  lib/          firebase, helpers de fechas/sesiones, exportData
  data/         seedData (ejercicios y rutina de ejemplo)
```

## Datos

- Los `exercises` y `routines` de ejemplo viven en el código (`src/data/seedData.js`), así la app funciona aunque Firestore esté vacío.
- Lo que creas tú (ejercicios, rutinas, registros) se guarda bajo `users/{uid}/` y es privado.
- Las reglas de seguridad están en `firestore.rules`.

## Deploy

```bash
firebase deploy
```

El build se ejecuta automáticamente antes de subir (hook `predeploy` en `firebase.json`).

## Notas

- Los valores de `.env` son la config pública de cliente de Firebase, no secretos; se mantienen fuera del repo por orden. La protección real son las reglas de Firestore.

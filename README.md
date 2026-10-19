# Vortx

**Languages / Idiomas:** [🇪🇸 Español](#-español) · [🇬🇧 English](#-english) · [🇧🇷 Português](#-português)

**Deploy:** https://project-vortx.web.app

---

## 🇪🇸 Español

Aplicación web (PWA) para seguir rutinas de entrenamiento: catálogo de ejercicios, registro diario, análisis de progreso y recompensas. Interfaz multiidioma (español, inglés y portugués).

### Características

- **Biblioteca de ejercicios** con búsqueda y filtros por categoría y grupo muscular. Permite crear ejercicios propios.
- **Rutinas** separadas en *Mis rutinas* (las que creas tú) y *Catálogo* (rutinas base), con búsqueda y filtro por área trabajada. Se activan/desactivan desde la lista.
- **Cronograma** con registro diario: duración, nivel de fatiga, y por serie reps, peso, esfuerzo y fallo.
- **Entrenamiento guiado** paso a paso con temporizador de descanso y de ejercicios por tiempo.
- **Análisis**: constancia (heatmap), adherencia semanal, evolución de reps/carga, volumen por grupo muscular, esfuerzo y distribución de esfuerzo.
- **Recompensas**: ganas *Vortx Points* entrenando y manteniendo tu racha; en la **Tienda** canjeas espacios de rutina extra y temas de color.
- **Mi cuenta**: datos de la cuenta, estadísticas, selector de idioma y tema, exportación e importación (backup) de tus datos.
- **Peso corporal**: registro semanal con recordatorio y gráfico de evolución.
- **Panel de administración** (con custom claim de admin): gestión del catálogo base de ejercicios y rutinas, y vista de usuarios.
- **Multiidioma** (es/en/pt): la interfaz y el contenido base se traducen; el idioma se detecta del navegador, se puede cambiar en Mi cuenta y se guarda en el perfil.
- Autenticación con Google o correo/contraseña (con verificación de correo); cada usuario solo accede a sus propios datos.
- **PWA instalable** con soporte offline (manifest + service worker).

### Stack

React + Vite · Tailwind CSS · Firebase (Auth + Firestore + Hosting) · react-i18next · Recharts · vite-plugin-pwa

### Puesta en marcha

```bash
npm install
cp .env.example .env   # completa con la config de tu proyecto Firebase
npm run dev
```

La config de Firebase se obtiene en la consola: *Project settings → Your apps → SDK setup*. En el proyecto hay que habilitar **Google** en Authentication y crear una base de **Firestore**.

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run seed` | Carga el catálogo base en Firestore (requiere permisos de escritura) |

### Internacionalización (i18n)

- Las traducciones de interfaz están en `src/i18n/locales/{es,en,pt}.json`.
- El contenido del catálogo base (nombres, descripciones, notas de ejercicios y rutinas) se guarda como objetos `{ es, en, pt }`; los editores tienen un conmutador de idioma para rellenar cada traducción.
- Idioma por defecto: se detecta del navegador; *fallback* a inglés. La preferencia se guarda en `localStorage` y en el perfil del usuario.

### Estructura

```
src/
  pages/        Vistas (Login, Today, Library, Routines, Schedule, SessionLog, Analysis, Account, Store, Admin, editores)
  components/   UI compartida (Layout, AccountMenu, Spinner, LangTabs, icons)
  hooks/        CatalogProvider/useCatalog (ejercicios/rutinas), LogsProvider/useLogs (registros)
  context/      AuthContext
  lib/          firebase, helpers de fechas/sesiones, i18nContent, points, themes, exportData
  i18n/         configuración i18n y locales es/en/pt
  data/         seedData (catálogo base de ejercicios y rutina)
```

### Datos

- El catálogo base vive en Firestore en `catalog/data/exercises` y `catalog/data/routines`; `src/data/seedData.js` es la fuente para sembrarlo y el *fallback* local.
- Lo que creas tú (ejercicios, rutinas, registros, peso) se guarda bajo `users/{uid}/` y es privado.
- Ninguna rutina viene activa por defecto: el usuario elige cuáles activar desde la lista.
- Las reglas de seguridad están en `firestore.rules` (el catálogo solo lo escribe un admin; el perfil solo su dueño).

### Deploy

```bash
firebase deploy
```

El build se ejecuta automáticamente antes de subir (hook `predeploy` en `firebase.json`). Tras desplegar cambios en el catálogo base, entra a **Administración → Actualizar catálogo base desde el código** (como admin) para publicar las traducciones.

### Notas

- Los valores de `.env` son la config pública de cliente de Firebase, no secretos; se mantienen fuera del repo por orden. La protección real son las reglas de Firestore.

[⬆ Volver arriba](#vortx)

---

## 🇬🇧 English

Web app (PWA) to follow training routines: exercise catalog, daily logging, progress analysis and rewards. Multilingual interface (Spanish, English and Portuguese).

### Features

- **Exercise library** with search and filters by category and muscle group. You can create your own exercises.
- **Routines** split into *My routines* (the ones you create) and *Catalog* (base routines), with search and a muscle-area filter. Activate/deactivate them from the list.
- **Schedule** with daily logging: duration, fatigue level, and per set reps, weight, effort and failure.
- **Guided workout** step by step with rest and timed-exercise timers.
- **Analysis**: consistency (heatmap), weekly adherence, reps/load progress, volume by muscle group, effort and effort distribution.
- **Rewards**: earn *Vortx Points* by training and keeping your streak; in the **Store** you redeem extra routine slots and color themes.
- **My account**: account data, stats, language and theme selectors, export and import (backup) of your data.
- **Body weight**: weekly entry with reminder and trend chart.
- **Admin panel** (with an admin custom claim): manage the base catalog of exercises and routines, and view users.
- **Multilingual** (es/en/pt): the UI and base content are translated; language is detected from the browser, can be changed in My account and is stored on the profile.
- Google or email/password authentication (with email verification); each user only accesses their own data.
- **Installable PWA** with offline support (manifest + service worker).

### Stack

React + Vite · Tailwind CSS · Firebase (Auth + Firestore + Hosting) · react-i18next · Recharts · vite-plugin-pwa

### Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase project config
npm run dev
```

Get the Firebase config from the console: *Project settings → Your apps → SDK setup*. In the project you must enable **Google** under Authentication and create a **Firestore** database.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run seed` | Load the base catalog into Firestore (requires write permissions) |

### Internationalization (i18n)

- UI translations live in `src/i18n/locales/{es,en,pt}.json`.
- Base-catalog content (exercise/routine names, descriptions, cues) is stored as `{ es, en, pt }` objects; the editors have a language switcher to fill in each translation.
- Default language: detected from the browser, falling back to English. The preference is saved in `localStorage` and on the user profile.

### Structure

```
src/
  pages/        Views (Login, Today, Library, Routines, Schedule, SessionLog, Analysis, Account, Store, Admin, editors)
  components/   Shared UI (Layout, AccountMenu, Spinner, LangTabs, icons)
  hooks/        CatalogProvider/useCatalog (exercises/routines), LogsProvider/useLogs (logs)
  context/      AuthContext
  lib/          firebase, date/session helpers, i18nContent, points, themes, exportData
  i18n/         i18n config and es/en/pt locales
  data/         seedData (base catalog of exercises and routine)
```

### Data

- The base catalog lives in Firestore at `catalog/data/exercises` and `catalog/data/routines`; `src/data/seedData.js` is the source to seed it and the local fallback.
- Anything you create (exercises, routines, logs, weight) is stored under `users/{uid}/` and is private.
- No routine is active by default: the user chooses which ones to activate from the list.
- Security rules are in `firestore.rules` (only an admin can write the catalog; only the owner writes their profile).

### Deploy

```bash
firebase deploy
```

The build runs automatically before uploading (`predeploy` hook in `firebase.json`). After deploying base-catalog changes, go to **Admin → Update base catalog from code** (as admin) to publish the translations.

### Notes

- The `.env` values are Firebase's public client config, not secrets; they are kept out of the repo for tidiness. The real protection is the Firestore rules.

[⬆ Back to top](#vortx)

---

## 🇧🇷 Português

Aplicativo web (PWA) para seguir rotinas de treino: catálogo de exercícios, registro diário, análise de progresso e recompensas. Interface multi-idioma (espanhol, inglês e português).

### Recursos

- **Biblioteca de exercícios** com busca e filtros por categoria e grupo muscular. Permite criar seus próprios exercícios.
- **Rotinas** separadas em *Minhas rotinas* (as que você cria) e *Catálogo* (rotinas base), com busca e filtro por área trabalhada. Ative/desative pela lista.
- **Cronograma** com registro diário: duração, nível de fadiga e, por série, reps, peso, esforço e falha.
- **Treino guiado** passo a passo com cronômetro de descanso e de exercícios por tempo.
- **Análise**: constância (heatmap), aderência semanal, evolução de reps/carga, volume por grupo muscular, esforço e distribuição de esforço.
- **Recompensas**: ganhe *Vortx Points* treinando e mantendo sua sequência; na **Loja** você troca por espaços de rotina extras e temas de cor.
- **Minha conta**: dados da conta, estatísticas, seletores de idioma e tema, exportação e importação (backup) dos seus dados.
- **Peso corporal**: registro semanal com lembrete e gráfico de evolução.
- **Painel de administração** (com custom claim de admin): gestão do catálogo base de exercícios e rotinas, e visão de usuários.
- **Multi-idioma** (es/en/pt): a interface e o conteúdo base são traduzidos; o idioma é detectado do navegador, pode ser alterado em Minha conta e é salvo no perfil.
- Autenticação com Google ou e-mail/senha (com verificação de e-mail); cada usuário acessa apenas seus próprios dados.
- **PWA instalável** com suporte offline (manifest + service worker).

### Stack

React + Vite · Tailwind CSS · Firebase (Auth + Firestore + Hosting) · react-i18next · Recharts · vite-plugin-pwa

### Primeiros passos

```bash
npm install
cp .env.example .env   # preencha com a config do seu projeto Firebase
npm run dev
```

Obtenha a config do Firebase no console: *Project settings → Your apps → SDK setup*. No projeto é preciso habilitar o **Google** em Authentication e criar um banco **Firestore**.

### Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run seed` | Carrega o catálogo base no Firestore (requer permissões de escrita) |

### Internacionalização (i18n)

- As traduções da interface ficam em `src/i18n/locales/{es,en,pt}.json`.
- O conteúdo do catálogo base (nomes, descrições e notas de exercícios e rotinas) é salvo como objetos `{ es, en, pt }`; os editores têm um alternador de idioma para preencher cada tradução.
- Idioma padrão: detectado do navegador, com *fallback* para o inglês. A preferência é salva no `localStorage` e no perfil do usuário.

### Estrutura

```
src/
  pages/        Telas (Login, Today, Library, Routines, Schedule, SessionLog, Analysis, Account, Store, Admin, editores)
  components/   UI compartilhada (Layout, AccountMenu, Spinner, LangTabs, icons)
  hooks/        CatalogProvider/useCatalog (exercícios/rotinas), LogsProvider/useLogs (registros)
  context/      AuthContext
  lib/          firebase, helpers de datas/sessões, i18nContent, points, themes, exportData
  i18n/         configuração i18n e locales es/en/pt
  data/         seedData (catálogo base de exercícios e rotina)
```

### Dados

- O catálogo base fica no Firestore em `catalog/data/exercises` e `catalog/data/routines`; `src/data/seedData.js` é a fonte para semear e o *fallback* local.
- Tudo o que você cria (exercícios, rotinas, registros, peso) é salvo em `users/{uid}/` e é privado.
- Nenhuma rotina vem ativa por padrão: o usuário escolhe quais ativar pela lista.
- As regras de segurança estão em `firestore.rules` (só um admin escreve o catálogo; só o dono escreve seu perfil).

### Deploy

```bash
firebase deploy
```

O build roda automaticamente antes do envio (hook `predeploy` no `firebase.json`). Após publicar mudanças no catálogo base, vá em **Administração → Atualizar catálogo base pelo código** (como admin) para publicar as traduções.

### Observações

- Os valores do `.env` são a config pública de cliente do Firebase, não segredos; ficam fora do repositório por organização. A proteção real são as regras do Firestore.

[⬆ Voltar ao topo](#vortx)

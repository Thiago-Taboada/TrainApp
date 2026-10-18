// Assigns (or revokes) the `admin` custom claim on a Firebase user.
// Run locally with the service account key — this NEVER runs in the browser.
//
// Usage:
//   node scripts/setAdmin.mjs <uid>            → grant admin
//   node scripts/setAdmin.mjs <uid> --revoke   → remove admin
//
// The service account key must be at secrets/serviceAccountKey.json
// (git-ignored). Generate it in: Firebase Console → Project settings →
// Service accounts → Generate new private key.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY_PATH = resolve(__dirname, '../secrets/serviceAccountKey.json')

const uid = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!uid) {
  console.error('Falta el UID.\nUso: node scripts/setAdmin.mjs <uid> [--revoke]')
  process.exit(1)
}

async function run() {
  let key
  try {
    key = JSON.parse(await readFile(KEY_PATH, 'utf8'))
  } catch {
    console.error('No se encontró secrets/serviceAccountKey.json')
    process.exit(1)
  }

  initializeApp({ credential: cert(key) })
  const auth = getAuth()

  await auth.setCustomUserClaims(uid, revoke ? { admin: null } : { admin: true })
  const user = await auth.getUser(uid)
  console.log(
    `${revoke ? '🚫 Admin revocado' : '✅ Admin asignado'} a ${user.email ?? uid}`,
  )
  console.log('Claims actuales:', user.customClaims ?? {})
  console.log('\nCierra sesión y vuelve a entrar en la app (o refresca el token) para que aplique.')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error:', err?.message ?? err)
  process.exit(1)
})

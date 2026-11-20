// Hors ligne : tout est servi depuis le cache, puis mis à jour en arrière-plan à chaque ouverture.
// La nouvelle page ne remplace l'ancienne qu'une fois tous ses fichiers en cache : jamais d'écran blanc.
// CouchDB (/db) n'est jamais intercepté.
const CACHE = 'caisse'

async function mettreAJour() {
  const page = await fetch('/', { cache: 'no-cache' })
  if (!page.ok) return
  const fichiers = ['/favicon.svg', '/manifest.webmanifest', ...new Set((await page.clone().text()).match(/\/assets\/[^"']+/g))]
  const cache = await caches.open(CACHE)
  await cache.addAll(fichiers)
  await cache.put('/', page)
  // Supprime les fichiers des versions précédentes
  for (const requete of await cache.keys()) {
    const chemin = new URL(requete.url).pathname
    if (chemin !== '/' && !fichiers.includes(chemin)) await cache.delete(requete)
  }
}

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(mettreAJour())
})
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/db/')) return

  const navigation = e.request.mode === 'navigate'
  if (navigation) e.waitUntil(mettreAJour().catch(() => {}))
  e.respondWith(caches.match(navigation ? '/' : e.request).then((copie) => copie || fetch(e.request)))
})

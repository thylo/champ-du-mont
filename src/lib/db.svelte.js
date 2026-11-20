import PouchDB from 'pouchdb-browser'
import { ogm, total } from './paiement.js'

/** Bases locales (IndexedDB) : la caisse fonctionne sans réseau. */
export const catalogue = new PouchDB('catalogue')
export const ventes = new PouchDB('ventes')

export const etat = $state({
  appareil: undefined, // undefined : chargement · null : téléphone pas encore installé
  articles: [],
  synchro: 'Hors ligne',
  panier: [],
  encours: null, // vente par virement en attente de paiement
  refusees: 0, // ventes refusées par le serveur (jamais renvoyées)
  motDePasseRefuse: false, // le mot de passe bénévole a changé sur le serveur
})

// Jamais de cookie : CouchDB privilégie un cookie de session (ex. Fauxton) sur l'auth basic
const sansCookie = { credentials: 'omit' }

/** Base CouchDB, via le proxy /db de la même origine. */
export const distante = (nom, utilisateur, motDePasse) =>
  new PouchDB(`${location.origin}/db/${nom}`, {
    skip_setup: true,
    auth: { username: utilisateur, password: motDePasse },
    fetch: (url, opts) => PouchDB.fetch(url, { ...opts, ...sansCookie }),
  })

/** Vérifie un mot de passe : l'utilisateur doit avoir le rôle du même nom. */
export async function verifier(utilisateur, motDePasse) {
  // Encodage UTF-8 comme PouchDB et CouchDB (sinon les accents ne passent pas)
  const jeton = btoa(unescape(encodeURIComponent(`${utilisateur}:${motDePasse}`)))
  let session
  try {
    const reponse = await fetch('/db/_session', { ...sansCookie, headers: { Authorization: `Basic ${jeton}` } })
    session = await reponse.json()
  } catch {
    throw new Error('Serveur injoignable : vérifiez le réseau.')
  }
  if (!session.userCtx?.roles.includes(utilisateur)) throw new Error('Mot de passe incorrect.')
}

export async function articlesDe(db) {
  const { rows } = await db.allDocs({ include_docs: true, startkey: 'article:', endkey: 'article:￰' })
  return rows
    .map((r) => r.doc)
    .sort((a, b) => a.categorie.localeCompare(b.categorie) || a.libelle.localeCompare(b.libelle))
}

/** Numéro suivant le plus grand appareil déjà installé. */
async function numeroLibre(db) {
  const { rows } = await db.allDocs({ startkey: 'appareil:￰', endkey: 'appareil:', descending: true, limit: 1 })
  return rows.length ? Number(rows[0].id.slice('appareil:'.length)) + 1 : 1
}

/**
 * Enregistre l'appareil sur le serveur sous le premier numéro libre (les 3 premiers chiffres
 * des communications structurées). Un numéro déjà pris est refusé (409) : on essaie le suivant.
 */
export async function installer(nom, motDePasse) {
  await verifier('benevole', motDePasse)
  const db = distante('ventes', 'benevole', motDePasse)
  let numero = await numeroLibre(db)
  for (;;) {
    try {
      await db.put({ _id: `appareil:${String(numero).padStart(3, '0')}`, nom, creeLe: new Date().toISOString() })
      break
    } catch (err) {
      if (err.status !== 409) throw err
      numero++
    }
  }
  await ventes.put({ _id: '_local/appareil', numero, nom, motDePasse })
  await demarrer()
}

export async function demarrer() {
  const appareil = await ventes.get('_local/appareil').catch(() => null)
  etat.appareil = appareil && { numero: appareil.numero, nom: appareil.nom }
  if (!appareil) return

  // Demande au navigateur de ne jamais effacer les ventes pas encore envoyées
  navigator.storage?.persist?.()

  const lire = async () => (etat.articles = await articlesDe(catalogue))
  lire()
  catalogue.changes({ since: 'now', live: true }).on('change', lire)

  synchroniser(appareil.motDePasse)
}

let replications = []

function synchroniser(motDePasse) {
  replications.forEach((r) => r.cancel())
  const options = { live: true, retry: true }
  replications = [
    catalogue.replicate.from(distante('catalogue', 'benevole', motDePasse), options),
    ventes.replicate.to(distante('ventes', 'benevole', motDePasse), options),
  ]
  etat.motDePasseRefuse = false
  replications.forEach(suivre)
}

/** Après un changement du mot de passe bénévole sur le serveur. */
export async function changerMotDePasse(motDePasse) {
  await verifier('benevole', motDePasse)
  await ventes.put({ ...(await ventes.get('_local/appareil')), motDePasse })
  synchroniser(motDePasse)
}

const heure = () => new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })

function suivre(replication) {
  const probleme = (err) => {
    if (err?.status === 401) etat.motDePasseRefuse = true
    return err
  }
  replication
    .on('active', () => (etat.synchro = 'Synchronisation…'))
    .on('paused', (err) => (etat.synchro = probleme(err) ? 'Hors ligne' : `Synchronisé à ${heure()}`))
    .on('denied', () => etat.refusees++)
    .on('error', (err) => (etat.synchro = `Erreur : ${probleme(err).message}`))
}

// Les ventes passent une par une pour qu'un double tap ne donne jamais deux fois le même numéro
let file = Promise.resolve()

async function incrementer() {
  const compteur = await ventes.get('_local/compteur').catch(() => ({ _id: '_local/compteur', valeur: 0 }))
  compteur.valeur++
  await ventes.put(compteur)
  return compteur.valeur
}

/** Prépare une vente avec une communication structurée unique. Elle n'est pas encore enregistrée. */
export async function nouvelleVente(lignes, mode) {
  file = file.catch(() => {}).then(incrementer)
  const compteur = await file
  return {
    _id: ogm(etat.appareil.numero, compteur),
    appareil: etat.appareil.nom,
    mode,
    total: total(lignes),
    lignes: $state.snapshot(lignes),
    creeLe: new Date().toISOString(),
  }
}

export const enregistrer = (vente) => ventes.put($state.snapshot(vente))

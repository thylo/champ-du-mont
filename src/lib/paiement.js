// Logique pure : montants en centimes, communication structurée (OGM), QR EPC.

const env = import.meta.env

/** Bénéficiaire des virements, fixé au build (.env). */
export const beneficiaire = {
  nom: env.VITE_BENEFICIAIRE ?? '',
  iban: (env.VITE_IBAN ?? '').replace(/\s/g, '').toUpperCase(),
  champRef: env.VITE_CHAMP_REF ?? 'structure',
}

export const somme = (liste, valeur) => liste.reduce((s, x) => s + valeur(x), 0)
export const total = (lignes) => somme(lignes, (l) => l.prix * l.qte)
export const resume = (lignes) => lignes.map((l) => `${l.qte}× ${l.libelle}`).join(', ')

const format = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' })
export const euros = (centimes) => format.format(centimes / 100)

/** « 12,5 » → 1250. null si la saisie n'est pas un montant. */
export function centimes(texte) {
  const m = String(texte).trim().replace(',', '.').match(/^(\d+)(?:\.(\d{1,2}))?$/)
  return m ? Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0')) : null
}

/** Communication structurée : appareil (3 chiffres) + compteur (7) + contrôle modulo 97 (97 si 0). */
export function ogm(appareil, compteur) {
  const base = String(appareil).padStart(3, '0') + String(compteur).padStart(7, '0')
  if (base.length !== 10) throw new Error(`Appareil ${appareil} ou compteur ${compteur} hors limites`)
  return base + String(Number(base) % 97 || 97).padStart(2, '0')
}

export const ogmLisible = (id) => `+++${id.slice(0, 3)}/${id.slice(3, 7)}/${id.slice(7)}+++`

/** Contenu du QR EPC (version 002, sans BIC). */
export function epc(centimes, id, { nom, iban, champRef } = beneficiaire) {
  const ref = champRef === 'libre' ? ['', ogmLisible(id)] : [id]
  return ['BCD', '002', '1', 'SCT', '', nom, iban, `EUR${(centimes / 100).toFixed(2)}`, '', ...ref].join('\n')
}

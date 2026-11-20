<script>
  import { articlesDe, distante, verifier } from './db.svelte.js'
  import { centimes, euros, ogmLisible, resume } from './paiement.js'

  let bases = $state(null)
  let articles = $state([])
  const categories = $derived([...new Set(articles.map((a) => a.categorie))])
  let erreur = $state('')

  const vide = () => ({ libelle: '', categorie: '', prix: '', actif: true })
  let fiche = $state(vide())

  async function essayer(action) {
    erreur = ''
    try {
      await action()
    } catch (err) {
      erreur = err.message
    }
  }

  const connecter = (e) =>
    essayer(async () => {
      e.preventDefault()
      const motDePasse = new FormData(e.currentTarget).get('motDePasse')
      await verifier('gestion', motDePasse)
      bases = { catalogue: distante('catalogue', 'gestion', motDePasse), ventes: distante('ventes', 'gestion', motDePasse) }
      articles = await articlesDe(bases.catalogue)
    })

  const modifier = (article) => (fiche = { ...article, prix: (article.prix / 100).toFixed(2).replace('.', ',') })

  const sauver = (e) =>
    essayer(async () => {
      e.preventDefault()
      const prix = centimes(fiche.prix)
      if (!prix) throw new Error('Prix invalide.')
      await bases.catalogue.put({
        ...$state.snapshot(fiche),
        _id: fiche._id ?? `article:${Date.now()}`,
        prix,
        maj: new Date().toISOString(),
      })
      fiche = vide()
      articles = await articlesDe(bases.catalogue)
    })

  const exporter = () =>
    essayer(async () => {
      const { rows } = await bases.ventes.allDocs({ include_docs: true, startkey: '0', endkey: '9￰' })
      const lignes = rows.map(({ doc: v }) => [
        ogmLisible(v._id), v.creeLe, v.appareil, v.mode, (v.total / 100).toFixed(2).replace('.', ','), resume(v.lignes),
      ])
      const csv = [['communication', 'date', 'appareil', 'mode', 'montant', 'articles'], ...lignes]
        .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
        .join('\n')
      const lien = document.createElement('a')
      lien.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
      lien.download = `ventes-${new Date().toISOString().slice(0, 16).replace(':', 'h')}.csv`
      lien.click()
    })
</script>

<h1>Gestion</h1>
{#if erreur}<p class="c-erreur">{erreur}</p>{/if}

{#if !bases}
  <form class="o-ligne" onsubmit={connecter}>
    <input name="motDePasse" type="password" placeholder="Mot de passe gestion" required autocomplete="current-password" />
    <button>Se connecter</button>
  </form>
{:else}
  <h2>Articles</h2>
  <div class="u-defile">
    <table>
      <thead><tr><th>Libellé</th><th class="u-droite">Prix</th><th>En vente</th><th></th></tr></thead>
      {#each categories as categorie}
        <tbody>
          <tr><th colspan="4" class="c-categorie">{categorie}</th></tr>
          {#each articles.filter((a) => a.categorie === categorie) as article (article._id)}
            <tr>
              <td>{article.libelle}</td>
              <td class="u-droite">{euros(article.prix)}</td>
              <td>{article.actif ? 'oui' : 'non'}</td>
              <td><button onclick={() => modifier(article)}>Modifier</button></td>
            </tr>
          {/each}
        </tbody>
      {/each}
    </table>
  </div>

  <h2>{fiche._id ? `Modifier « ${fiche.libelle} »` : 'Nouvel article'}</h2>
  <form onsubmit={sauver}>
    <label>Catégorie <input required list="categories" bind:value={fiche.categorie} placeholder="Boissons" /></label>
    <datalist id="categories">
      {#each categories as categorie}<option value={categorie}></option>{/each}
    </datalist>
    <label>Libellé <input required bind:value={fiche.libelle} placeholder="Vin chaud" /></label>
    <label>Prix <input required inputmode="decimal" bind:value={fiche.prix} placeholder="3,50" /></label>
    <label><input type="checkbox" bind:checked={fiche.actif} /> En vente (décocher en cas de rupture)</label>
    <p class="o-ligne">
      <button class="c-principal">Enregistrer</button>
      {#if fiche._id}<button type="button" onclick={() => (fiche = vide())}>Annuler</button>{/if}
    </p>
  </form>

  <h2>Ventes</h2>
  <p>Export pour le rapprochement avec l'extrait bancaire (communication structurée).</p>
  <button onclick={exporter}>Télécharger le CSV</button>
{/if}

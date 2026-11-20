<script>
  import { ventes } from './db.svelte.js'
  import { euros, ogmLisible, resume, somme } from './paiement.js'

  let liste = $state([])
  ventes.allDocs({ include_docs: true, descending: true }).then((r) => (liste = r.rows.map((r) => r.doc)))

  const totalMode = (mode) => euros(somme(liste.filter((v) => v.mode === mode), (v) => v.total))
  const heure = (iso) => new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
</script>

<h1>Ventes de cet appareil</h1>
<p>Virement : <strong>{totalMode('virement')}</strong> · Liquide : <strong>{totalMode('liquide')}</strong></p>

<div class="u-defile">
  <table>
    <thead>
      <tr><th>Heure</th><th>Mode</th><th class="u-droite">Montant</th><th>Articles</th><th>Communication</th></tr>
    </thead>
    <tbody>
      {#each liste as vente (vente._id)}
        <tr>
          <td>{heure(vente.creeLe)}</td>
          <td>{vente.mode}</td>
          <td class="u-droite">{euros(vente.total)}</td>
          <td>{resume(vente.lignes)}</td>
          <td>{ogmLisible(vente._id)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

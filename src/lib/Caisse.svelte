<script>
  import { etat, nouvelleVente, enregistrer } from './db.svelte.js'
  import { centimes, euros, total } from './paiement.js'

  const articles = $derived(etat.articles.filter((a) => a.actif))
  const categories = $derived([...new Set(articles.map((a) => a.categorie))])

  let libre = $state('')
  let message = $state('')
  let occupe = $state(false)

  function ajouter(libelle, prix) {
    message = ''
    const ligne = etat.panier.find((l) => l.libelle === libelle && l.prix === prix)
    if (ligne) ligne.qte++
    else etat.panier.push({ libelle, prix, qte: 1 })
  }

  function retirer(ligne) {
    if (--ligne.qte === 0) etat.panier.splice(etat.panier.indexOf(ligne), 1)
  }

  function ajouterLibre(e) {
    e.preventDefault()
    const prix = centimes(libre)
    if (!prix) return (message = 'Montant invalide.')
    ajouter('Montant libre', prix)
    libre = ''
  }

  async function payer(mode) {
    occupe = true
    try {
      const vente = await nouvelleVente(etat.panier, mode)
      if (mode === 'virement') {
        etat.encours = vente
        location.hash = '#/paiement'
      } else {
        await enregistrer(vente)
        etat.panier = []
        message = `Vente en liquide enregistrée : ${euros(vente.total)}.`
      }
    } catch (err) {
      message = `Vente non enregistrée : ${err.message}`
    } finally {
      occupe = false
    }
  }
</script>

{#each categories as categorie}
  <h2>{categorie}</h2>
  <ul class="c-articles">
    {#each articles.filter((a) => a.categorie === categorie) as article (article._id)}
      <li><button onclick={() => ajouter(article.libelle, article.prix)}>{article.libelle} · {euros(article.prix)}</button></li>
    {/each}
  </ul>
{:else}
  <p>Aucun article. Le catalogue arrive à la première synchronisation.</p>
{/each}

<form class="o-ligne" onsubmit={ajouterLibre}>
  <input inputmode="decimal" placeholder="Montant libre, ex. 4,50" bind:value={libre} />
  <button>Ajouter</button>
</form>

<h2>Panier</h2>
{#if etat.panier.length}
  <table>
    <tbody>
      {#each etat.panier as ligne}
        <tr>
          <td>{ligne.qte} × {ligne.libelle}</td>
          <td class="u-droite">{euros(ligne.prix * ligne.qte)}</td>
          <td class="u-droite"><button onclick={() => retirer(ligne)}>Retirer</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>Vide.</p>
{/if}

<p class="c-total">Total : {euros(total(etat.panier))}</p>
{#if message}<p>{message}</p>{/if}

<p class="o-ligne">
  <button class="c-principal" disabled={occupe || !etat.panier.length} onclick={() => payer('virement')}>Payer par virement</button>
  <button disabled={occupe || !etat.panier.length} onclick={() => payer('liquide')}>Payé en liquide</button>
</p>

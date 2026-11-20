<script>
  import { etat, demarrer, changerMotDePasse } from './lib/db.svelte.js'
  import Installation from './lib/Installation.svelte'
  import Caisse from './lib/Caisse.svelte'
  import Paiement from './lib/Paiement.svelte'
  import Historique from './lib/Historique.svelte'
  import Gestion from './lib/Gestion.svelte'

  const pages = { caisse: Caisse, paiement: Paiement, historique: Historique }
  const lireRoute = () => location.hash.slice(2) || 'caisse'

  let route = $state(lireRoute())
  const Page = $derived(route === 'gestion' ? Gestion : etat.appareil ? (pages[route] ?? Caisse) : Installation)

  const maj = $derived(etat.articles.reduce((max, a) => (a.maj > max ? a.maj : max), ''))
  const date = (iso) => new Date(iso).toLocaleString('fr-BE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })

  let erreurMotDePasse = $state('')

  async function nouveauMotDePasse(e) {
    e.preventDefault()
    try {
      await changerMotDePasse(new FormData(e.currentTarget).get('motDePasse'))
      erreurMotDePasse = ''
    } catch (err) {
      erreurMotDePasse = err.message
    }
  }

  demarrer()
</script>

<svelte:window onhashchange={() => (route = lireRoute())} />

<header class="c-entete">
  <nav><a href="#/caisse">Caisse</a> · <a href="#/historique">Historique</a> · <a href="#/gestion">Gestion</a></nav>
  <p class="c-entete__statut">
    {#if etat.appareil}{etat.appareil.nom} · {etat.synchro}{/if}
    {#if maj} · Catalogue du {date(maj)}{/if}
  </p>
  {#if etat.refusees}
    <p class="c-erreur">{etat.refusees} vente(s) refusée(s) par le serveur : prévenir la gestion, elles ne seront pas envoyées.</p>
  {/if}
  {#if etat.motDePasseRefuse}
    <p class="c-erreur">Le mot de passe bénévole a changé : saisissez le nouveau pour reprendre l'envoi des ventes.</p>
    <form class="o-ligne" onsubmit={nouveauMotDePasse}>
      <input name="motDePasse" type="password" required autocomplete="current-password" />
      <button>Valider</button>
    </form>
    {#if erreurMotDePasse}<p class="c-erreur">{erreurMotDePasse}</p>{/if}
  {/if}
</header>

<main>
  {#if etat.appareil !== undefined}<Page />{/if}
</main>

<script>
  import { installer } from './db.svelte.js'

  let erreur = $state('')
  let occupe = $state(false)

  // Valeurs lues dans le formulaire à l'envoi : fiable même avec le remplissage automatique du navigateur
  async function envoyer(e) {
    e.preventDefault()
    const champs = new FormData(e.currentTarget)
    occupe = true
    erreur = ''
    try {
      await installer(champs.get('nom').trim(), champs.get('motDePasse'))
    } catch (err) {
      erreur = err.message
    }
    occupe = false
  }
</script>

<h1>Installer ce téléphone</h1>
<p>À faire une seule fois, avant le marché, avec du réseau.</p>

<form onsubmit={envoyer}>
  <label>Nom de l'appareil
    <input name="nom" required autocomplete="off" placeholder="Bar gauche, Téléphone de Marie…" />
  </label>
  <label>Mot de passe bénévole
    <input name="motDePasse" type="password" required autocomplete="current-password" />
  </label>
  {#if erreur}<p class="c-erreur">{erreur}</p>{/if}
  <button class="c-principal" disabled={occupe}>Installer</button>
</form>

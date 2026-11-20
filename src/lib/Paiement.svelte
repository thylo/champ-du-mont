<script>
  import { renderSVG } from 'uqr'
  import { etat, enregistrer } from './db.svelte.js'
  import { beneficiaire, epc, euros, ogmLisible } from './paiement.js'

  const vente = etat.encours
  if (!vente) location.hash = '#/caisse'

  let occupe = $state(false)
  let erreur = $state('')

  async function paye() {
    occupe = true
    try {
      await enregistrer(vente)
      etat.panier = []
      terminer()
    } catch (err) {
      // Ne pas annuler : le client a peut-être déjà payé avec cette communication
      erreur = `Vente non enregistrée : ${err.message}. Réessayez.`
    } finally {
      occupe = false
    }
  }

  function terminer() {
    etat.encours = null
    location.hash = '#/caisse'
  }
</script>

{#if vente}
  <p class="c-total">{euros(vente.total)}</p>
  <div class="c-qr">{@html renderSVG(epc(vente.total, vente._id), { ecc: 'M', border: 2 })}</div>
  <p><strong>Scannez avec l'app de votre banque</strong>, pas avec l'appareil photo.</p>
  <p>
    Bénéficiaire : {beneficiaire.nom}<br />
    Communication : {ogmLisible(vente._id)}
  </p>
  {#if erreur}<p class="c-erreur">{erreur}</p>{/if}
  <p class="o-ligne">
    <button class="c-principal" disabled={occupe} onclick={paye}>Le client a payé</button>
    <button onclick={terminer}>Annuler</button>
  </p>
{/if}

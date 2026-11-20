function (doc, ancien, utilisateur) {
  if (utilisateur.roles.indexOf('_admin') !== -1) return;
  if (ancien || doc._deleted) throw({ forbidden: 'Une vente ne peut pas être modifiée.' });

  var id = doc._id;
  if (/^appareil:\d{3}$/.test(id)) return;
  if (!/^\d{12}$/.test(id) || (Number(id.slice(0, 10)) % 97 || 97) !== Number(id.slice(10))) {
    throw({ forbidden: 'Communication structurée invalide.' });
  }
  if (doc.mode !== 'virement' && doc.mode !== 'liquide') throw({ forbidden: 'Mode de paiement invalide.' });
  if (!(doc.total > 0) || doc.total % 1 !== 0) throw({ forbidden: 'Montant invalide (centimes > 0).' });
}

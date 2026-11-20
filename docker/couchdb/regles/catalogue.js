function (doc, ancien, utilisateur) {
  var roles = utilisateur.roles;
  if (roles.indexOf('_admin') === -1 && roles.indexOf('gestion') === -1) {
    throw({ forbidden: 'Le catalogue est réservé à la gestion.' });
  }
}

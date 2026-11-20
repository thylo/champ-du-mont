#!/bin/sh
# Sauvegarde JSON des bases. Usage : ./scripts/sauvegarde.sh https://caisse.exemple.be/db admin mot-de-passe
set -eu
dossier="sauvegardes/$(date +%Y-%m-%d_%H%M)"
mkdir -p "$dossier"
for base in catalogue ventes; do
  curl -fsS -u "$2:$3" "$1/$base/_all_docs?include_docs=true" -o "$dossier/$base.json"
done
echo "Sauvegardé dans $dossier"

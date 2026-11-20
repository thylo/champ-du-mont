#!/bin/sh
# Initialisation idempotente de CouchDB : bases, droits, règles de validation, utilisateurs.
set -eu

URL="${COUCHDB_URL:-http://couchdb:5984}"
AUTH="${COUCHDB_USER}:${COUCHDB_PASSWORD}"

req() {
  # $1 = méthode, $2 = chemin, $3 = corps JSON (optionnel)
  code=$(curl -s -o /tmp/out -w '%{http_code}' -u "$AUTH" -X "$1" \
    -H 'Content-Type: application/json' ${3:+-d "$3"} "$URL$2")
  echo "$1 $2 → $code $(cat /tmp/out)"
  case "$code" in 2*|412) return 0 ;; *) return 1 ;; esac
}

# PUT qui écrase le document s'il existe déjà (reprend son _rev)
put() {
  rev=$(curl -s -u "$AUTH" "$URL$1" | sed -n 's/.*"_rev":"\([^"]*\)".*/\1/p')
  req PUT "$1${rev:+?rev=$rev}" "$2"
}

echo "Attente de CouchDB…"
until curl -fs "$URL/_up" >/dev/null; do sleep 1; done

for base in catalogue ventes; do
  req PUT "/$base"
  req PUT "/$base/_security" '{"admins":{"names":[],"roles":["_admin"]},"members":{"names":[],"roles":["benevole","gestion"]}}'
  regle=$(sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' "/regles/$base.js" | tr '\n' ' ')
  put "/$base/_design/regles" "{\"validate_doc_update\":\"$regle\"}"
done

# Chaque utilisateur a le rôle de même nom
for nom in benevole gestion; do
  [ "$nom" = benevole ] && mdp="$BENEVOLE_PASSWORD" || mdp="$GESTION_PASSWORD"
  put "/_users/org.couchdb.user:$nom" "{\"name\":\"$nom\",\"password\":\"$mdp\",\"roles\":[\"$nom\"],\"type\":\"user\"}"
done

echo "CouchDB initialisé ✔"

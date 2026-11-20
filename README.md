# Caisse du marché

Caisse hors-ligne pour le bar du marché de Noël. On choisit des articles (ou un montant libre), le téléphone affiche un QR de virement EPC avec une communication structurée unique, et le client scanne avec l'app de sa banque. Les ventes en liquide sont aussi enregistrées.

```
téléphone ── PouchDB (IndexedDB) ──réplication──▶ /db ──▶ CouchDB
                                                   │
                            dev : proxy Vite ──────┤
                            prod : nginx (web) ────┘
```

- **catalogue** : serveur → téléphones. Seule la gestion écrit.
- **ventes** : téléphones → serveur. Création uniquement : une vente ne se modifie ni ne se supprime. Son `_id` est la communication structurée : appareil (3 chiffres) + compteur local (7) + modulo 97.

Les règles sont dans `docker/couchdb/regles/` et posées par `docker/couchdb/init.sh` (idempotent).

## Local

```bash
cp .env.example .env
npm install
npm run db:up      # CouchDB + bases, règles, utilisateurs benevole / gestion
npm run dev        # http://localhost:5173
npm test
```

1. Ouvrir `#/gestion`, se connecter (mot de passe `GESTION_PASSWORD`) et créer des articles.
2. Sur chaque téléphone : donner un nom (« Bar gauche ») et entrer le mot de passe `BENEVOLE_PASSWORD`. Le numéro qui préfixe les communications structurées est attribué automatiquement.

Fauxton : http://localhost:5984/_utils

## Déploiement (Coolify)

1. Nouvelle ressource « Docker Compose » depuis ce dépôt git, fichier `compose.yaml`.
2. Variables : toutes celles de `.env.example`, avec des mots de passe forts et `COUCHDB_SECRET` = `openssl rand -hex 32`.
3. Domaine HTTPS sur le service `web` (port 80). CouchDB reste interne et Fauxton est bloqué sur `/db/_utils`.
4. `couchdb-init` s'arrête une fois l'initialisation terminée : c'est normal.

Sans Coolify : `npm run prod:up` (app sur `127.0.0.1:APP_PORT`, mettre un reverse proxy HTTPS devant).

**Ne jamais déployer pendant le marché.** Le service worker sert la version en cache et télécharge la nouvelle (page + fichiers) pour le lancement suivant.

Si `BENEVOLE_PASSWORD` change, chaque téléphone affiche un champ pour saisir le nouveau mot de passe. Les ventes restent sur le téléphone en attendant.

## Sauvegarde

Les sauvegardes automatiques de Coolify ne couvrent pas ce service :

```bash
./scripts/sauvegarde.sh https://caisse.exemple.be/db admin MOT_DE_PASSE_ADMIN
```

## Avant le marché

- Scanner le QR avec les principales apps bancaires belges. Si la communication n'est pas reprise, rebuilder avec `VITE_CHAMP_REF=libre`.
- Vérifier `chrome://version` sur le plus vieux téléphone (Vite vise Chrome 111 par défaut, voir `vite.config.js`).
- Tester la 4G dans la grange : le client a besoin de réseau pour payer.
- Installer chaque téléphone avec du réseau, puis ouvrir l'app une fois en ligne pour qu'elle fonctionne hors ligne.

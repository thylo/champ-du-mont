# Config et script d'init intégrés aux images plutôt que montés :
# Coolify ne copie pas les fichiers du dépôt pour les volumes « ./… » (ils arrivent en dossiers vides).

FROM couchdb:3.4 AS couchdb
COPY 10-app.ini /opt/couchdb/etc/local.d/10-app.ini

FROM curlimages/curl:8.11.1 AS init
COPY init.sh /init.sh
COPY regles /regles
ENTRYPOINT ["sh", "/init.sh"]

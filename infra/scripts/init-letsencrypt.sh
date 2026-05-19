#!/bin/bash
# First-time Let's Encrypt certificate provisioning
# Run ONCE on the VPS after deploying nginx for the first time
# Usage: DOMAIN=crm.yourdomain.com EMAIL=admin@yourdomain.com ./infra/scripts/init-letsencrypt.sh

set -euo pipefail

DOMAIN="${DOMAIN:?DOMAIN env var required}"
EMAIL="${EMAIL:?EMAIL env var required}"
STAGING="${STAGING:-0}"  # set to 1 for testing to avoid rate limits

RSA_KEY_SIZE=4096
DATA_PATH="./infra/certbot"

echo "### Creating dummy certificate for $DOMAIN ..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"

docker compose run --rm --entrypoint "
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'
" certbot

echo "### Starting nginx ..."
docker compose up --force-recreate -d nginx

echo "### Deleting dummy certificate ..."
docker compose run --rm --entrypoint "
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf
" certbot

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
fi

echo "### Requesting Let's Encrypt certificate ..."
docker compose run --rm --entrypoint "
  certbot certonly --webroot \
    -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN
" certbot

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload

echo "### Done! Certificate issued for $DOMAIN"

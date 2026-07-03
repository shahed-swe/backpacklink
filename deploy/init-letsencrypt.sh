#!/usr/bin/env bash
# One-time: obtain the Let's Encrypt certificate, then start nginx.
# Run on the server (needs ports 80+443 open in the Azure NSG).
#   bash deploy/init-letsencrypt.sh
set -e
cd "$(dirname "$0")/.."

DOMAINS="-d backpacklink.com -d www.backpacklink.com -d api.backpacklink.com -d admin.backpacklink.com"
EMAIL="admin@backpacklink.com"

echo "==> Freeing port 80 (stop nginx if running)"
docker compose stop nginx 2>/dev/null || true

echo "==> Requesting certificate from Let's Encrypt (standalone on :80)"
docker compose run --rm -p 80:80 --entrypoint certbot certbot \
  certonly --standalone $DOMAINS \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive \
  --cert-name backpacklink.com --key-type rsa

echo "==> Starting nginx with the certificate"
docker compose up -d nginx

echo ""
echo "✅ HTTPS live:"
echo "   https://backpacklink.com"
echo "   https://api.backpacklink.com"
echo "   https://admin.backpacklink.com"

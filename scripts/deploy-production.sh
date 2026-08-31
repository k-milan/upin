#!/usr/bin/env bash

# Run on the production droplet as root. The GitHub workflow calls this file
# after each successful push to main; it is also safe to run manually.
set -Eeuo pipefail

APP_DIR="${UPIN_APP_DIR:-/var/www/upin}"
APP_USER="${UPIN_APP_USER:-upin}"

cd "$APP_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: $APP_DIR has uncommitted tracked changes."
  exit 1
fi

git pull --ff-only origin main

pnpm install --frozen-lockfile
NODE_OPTIONS="--max-old-space-size=1024" pnpm build
pnpm db:migrate

install -d -o "$APP_USER" -g "$APP_USER" storage/attachments
systemctl restart upin upin-mcp

systemctl is-active --quiet upin
systemctl is-active --quiet upin-mcp
curl --fail --silent --show-error --retry 6 --retry-connrefused http://127.0.0.1:3000/ >/dev/null

echo "UPin deployment complete: $(git rev-parse --short HEAD)"

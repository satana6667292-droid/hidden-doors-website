#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
  echo "Run as root: sudo bash ops/server-preflight.sh <deploy-user>"
  exit 1
fi

DEPLOY_USER="${1:-}"
if [ -z "${DEPLOY_USER}" ]; then
  echo "Usage: sudo bash ops/server-preflight.sh <deploy-user>"
  exit 1
fi

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "Deploy user '${DEPLOY_USER}' does not exist. Create it first; this script will not create accounts automatically."
  exit 1
fi

DEPLOY_GROUP="$(id -gn "${DEPLOY_USER}")"

install -d -m 0755 -o "${DEPLOY_USER}" -g "${DEPLOY_GROUP}" /srv/hidden-doors
install -d -m 0755 -o "${DEPLOY_USER}" -g "${DEPLOY_GROUP}" /srv/hidden-doors/releases

echo "Prepared /srv/hidden-doors for ${DEPLOY_USER}."
echo "Next: add the GitHub deploy public key to ~${DEPLOY_USER}/.ssh/authorized_keys"
echo "and configure the repository secrets listed in ops/server-migration-2026-09-30.md."

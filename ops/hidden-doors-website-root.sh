#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="hidden-doors-website"
IMAGE_REPO="hidden-doors-website"
NETWORK="hidden-doors-website-net"
NETWORK_ALIAS="hidden-doors-website"

PREVIEW_HOST="hidden-doors-site.138.124.69.108.sslip.io"
PRODUCTION_HOST="hidden-doors.ru"
WWW_HOST="www.hidden-doors.ru"
SERVER_IP="138.124.69.108"
VPN_ALLOWED_IP="5.183.253.169"

CADDY_RUNTIME_FILE="/data/runtime/hidden-doors-website.caddy"
LOCK_FILE="/var/lock/hidden-doors-website.lock"

log(){ printf '\n[%s] %s\n' "$(date -Is)" "$*"; }
die(){ echo "ERROR: $*" >&2; exit 1; }

acquire_lock(){
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "Another website operation is already running."
}

production_container(){
  local service="$1"
  local short
  short="$(docker ps --filter "label=com.docker.compose.service=$service" --format '{{.ID}}' | head -n1)"
  [[ -n "$short" ]] || return 0
  docker inspect --format '{{.Id}}' "$short" 2>/dev/null || true
}

container_health(){
  local id="$1"
  [[ -n "$id" ]] || { echo absent; return 0; }
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || true
}

assert_core_stack(){
  local app="$1" db="$2" proxy="$3"
  [[ -n "$app" && -n "$db" && -n "$proxy" ]] || die "Production app/postgres/reverse-proxy containers were not found."

  [[ "$(docker inspect --format '{{.Id}}' "$app")" == "$app" ]] || die "Production app container changed."
  [[ "$(docker inspect --format '{{.Id}}' "$db")" == "$db" ]] || die "Production database container changed."
  [[ "$(docker inspect --format '{{.Id}}' "$proxy")" == "$proxy" ]] || die "Production reverse proxy container changed."

  case "$(container_health "$app")" in healthy|running) ;; *) die "Production app is not healthy.";; esac
  case "$(container_health "$db")" in healthy|running) ;; *) die "Production PostgreSQL is not healthy.";; esac
  case "$(container_health "$proxy")" in healthy|running) ;; *) die "Production Caddy is not healthy.";; esac
}

validate_workspace(){
  local source_dir="$1"
  local expected_sha="$2"
  source_dir="$(readlink -f "$source_dir")"

  [[ -d "$source_dir/.git" ]] || die "Runner workspace is not a Git checkout: $source_dir"
  [[ "$(git -C "$source_dir" rev-parse HEAD)" == "$expected_sha" ]] || die "Runner workspace SHA mismatch."

  local remote_url
  remote_url="$(git -C "$source_dir" config --get remote.origin.url || true)"
  [[ "$remote_url" == *"satana6667292-droid/hidden-doors-website"* ]] || die "Unexpected runner workspace origin."

  [[ -z "$(git -C "$source_dir" status --porcelain)" ]] || die "Runner workspace is not clean."
  [[ -s "$source_dir/site/index.html" ]] || die "site/index.html is missing."
  [[ -s "$source_dir/site/robots.txt" ]] || die "site/robots.txt is missing."
  [[ -s "$source_dir/site/sitemap.xml" ]] || die "site/sitemap.xml is missing."
  [[ -s "$source_dir/site/404.html" ]] || die "site/404.html is missing."

  printf '%s\n' "$source_dir"
}

ensure_network(){
  docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null
}

wait_healthy(){
  for _ in $(seq 1 45); do
    case "$(container_health "$CONTAINER")" in
      healthy) return 0;;
      unhealthy|exited|dead)
        docker logs --tail 120 "$CONTAINER" || true
        return 1
        ;;
    esac
    sleep 2
  done
  return 1
}

assert_runtime_import(){
  local proxy="$1"
  docker exec "$proxy" sh -lc "grep -Fq 'import /data/runtime/*.caddy' /etc/caddy/Caddyfile" \
    || die "Production Caddyfile is missing runtime import."
}

write_route(){
  local mode="$1"
  local proxy="$2"
  local old_file
  old_file="$(mktemp)"

  if docker exec "$proxy" sh -lc "test -f '$CADDY_RUNTIME_FILE' && cat '$CADDY_RUNTIME_FILE'" >"$old_file" 2>/dev/null; then
    :
  else
    : >"$old_file"
  fi

  assert_runtime_import "$proxy"

  case "$mode" in
    preview)
      docker exec -i "$proxy" sh -lc "umask 077; mkdir -p /data/runtime; cat > '$CADDY_RUNTIME_FILE'" <<EOF
$PREVIEW_HOST {
  encode zstd gzip

  @vpn remote_ip $VPN_ALLOWED_IP
  handle @vpn {
    reverse_proxy $NETWORK_ALIAS:8080
  }

  handle {
    respond "Forbidden" 403
  }

  header {
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    X-Frame-Options SAMEORIGIN
    -Server
  }

  log {
    output file /data/hidden-doors-website-access.log {
      roll_size 5MB
      roll_keep 3
    }
  }
}
EOF
      ;;
    production)
      docker exec -i "$proxy" sh -lc "umask 077; mkdir -p /data/runtime; cat > '$CADDY_RUNTIME_FILE'" <<EOF
$WWW_HOST {
  redir https://$PRODUCTION_HOST{uri} permanent
}

$PRODUCTION_HOST {
  encode zstd gzip

  @legacy path /hiddendoors /hiddendoors/
  redir @legacy /hidden-doors/ 301

  reverse_proxy $NETWORK_ALIAS:8080

  header {
    Strict-Transport-Security "max-age=31536000"
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    X-Frame-Options SAMEORIGIN
    -Server
  }

  log {
    output file /data/hidden-doors-website-access.log {
      roll_size 5MB
      roll_keep 3
    }
  }
}
EOF
      ;;
    *)
      rm -f "$old_file"
      die "Unknown route mode: $mode"
      ;;
  esac

  if ! docker exec "$proxy" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
    log "Caddy validation failed; restoring previous website route."
    if [[ -s "$old_file" ]]; then
      docker exec -i "$proxy" sh -lc "cat > '$CADDY_RUNTIME_FILE'" <"$old_file"
    else
      docker exec "$proxy" rm -f "$CADDY_RUNTIME_FILE" || true
    fi
    rm -f "$old_file"
    die "Caddy validation failed."
  fi

  if ! docker exec "$proxy" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
    log "Caddy reload failed; restoring previous website route."
    if [[ -s "$old_file" ]]; then
      docker exec -i "$proxy" sh -lc "cat > '$CADDY_RUNTIME_FILE'" <"$old_file"
    else
      docker exec "$proxy" rm -f "$CADDY_RUNTIME_FILE" || true
    fi
    docker exec "$proxy" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
    rm -f "$old_file"
    die "Caddy reload failed."
  fi

  rm -f "$old_file"
}

run_site_container(){
  local image="$1"

  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    --cap-drop ALL \
    --cap-add CHOWN \
    --cap-add SETGID \
    --cap-add SETUID \
    --security-opt no-new-privileges:true \
    --memory 128m \
    --cpus 0.50 \
    --pids-limit 96 \
    --log-driver json-file \
    --log-opt max-size=5m \
    --log-opt max-file=3 \
    --network "$NETWORK" \
    --network-alias "$NETWORK_ALIAS" \
    "$image" >/dev/null
}

deploy_preview(){
  local workspace="$1"
  local expected_sha="$2"
  local source_dir
  source_dir="$(validate_workspace "$workspace" "$expected_sha")"

  local prod_app prod_db proxy
  prod_app="$(production_container app)"
  prod_db="$(production_container postgres)"
  proxy="$(production_container reverse-proxy)"
  assert_core_stack "$prod_app" "$prod_db" "$proxy"

  acquire_lock
  ensure_network

  docker network connect "$NETWORK" "$proxy" >/dev/null 2>&1 || true
  docker network inspect "$NETWORK" --format '{{json .Containers}}' | grep -q "$proxy" \
    || die "Production Caddy could not be attached to website network."

  if docker inspect "$CONTAINER" >/dev/null 2>&1; then
    old_image="$(docker inspect --format '{{.Image}}' "$CONTAINER")"
    docker tag "$old_image" "$IMAGE_REPO:rollback"
  fi

  log "Building corporate website image from $expected_sha"
  docker build \
    --label com.hidden-doors.service=corporate-website \
    -t "$IMAGE_REPO:${expected_sha:0:12}" \
    -t "$IMAGE_REPO:latest" \
    -f "$source_dir/ops/website/Dockerfile" \
    "$source_dir"

  run_site_container "$IMAGE_REPO:${expected_sha:0:12}"

  if ! wait_healthy; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    if docker image inspect "$IMAGE_REPO:rollback" >/dev/null 2>&1; then
      log "Restoring rollback image."
      run_site_container "$IMAGE_REPO:rollback"
      wait_healthy || true
    fi
    die "New website container failed its health check."
  fi

  assert_core_stack "$prod_app" "$prod_db" "$proxy"
  write_route preview "$proxy"
  assert_core_stack "$prod_app" "$prod_db" "$proxy"

  log "Preview ready: https://$PREVIEW_HOST/"
}

promote_production(){
  local confirmation="${1:-}"
  [[ "$confirmation" == "PRODUCTION" ]] || die "Explicit PRODUCTION confirmation required."

  getent ahostsv4 "$PRODUCTION_HOST" | awk '{print $1}' | grep -Fxq "$SERVER_IP" \
    || die "$PRODUCTION_HOST does not resolve to $SERVER_IP yet."
  getent ahostsv4 "$WWW_HOST" | awk '{print $1}' | grep -Fxq "$SERVER_IP" \
    || die "$WWW_HOST does not resolve to $SERVER_IP yet."

  local prod_app prod_db proxy
  prod_app="$(production_container app)"
  prod_db="$(production_container postgres)"
  proxy="$(production_container reverse-proxy)"
  assert_core_stack "$prod_app" "$prod_db" "$proxy"

  acquire_lock
  [[ "$(container_health "$CONTAINER")" == "healthy" ]] || die "Website container is not healthy."
  ensure_network
  docker network connect "$NETWORK" "$proxy" >/dev/null 2>&1 || true

  write_route production "$proxy"
  assert_core_stack "$prod_app" "$prod_db" "$proxy"

  log "Production route enabled for $PRODUCTION_HOST and $WWW_HOST."
}

rollback(){
  local prod_app prod_db proxy
  prod_app="$(production_container app)"
  prod_db="$(production_container postgres)"
  proxy="$(production_container reverse-proxy)"
  assert_core_stack "$prod_app" "$prod_db" "$proxy"

  acquire_lock
  docker image inspect "$IMAGE_REPO:rollback" >/dev/null 2>&1 || die "Rollback image is not available."

  current_image=""
  if docker inspect "$CONTAINER" >/dev/null 2>&1; then
    current_image="$(docker inspect --format '{{.Image}}' "$CONTAINER")"
  fi

  run_site_container "$IMAGE_REPO:rollback"
  wait_healthy || die "Rollback image failed health check."

  if [[ -n "$current_image" ]]; then
    docker tag "$current_image" "$IMAGE_REPO:failed" || true
  fi

  assert_core_stack "$prod_app" "$prod_db" "$proxy"
  log "Rollback container is healthy. Existing Caddy route was preserved."
}

status(){
  local prod_app prod_db proxy
  prod_app="$(production_container app)"
  prod_db="$(production_container postgres)"
  proxy="$(production_container reverse-proxy)"

  echo "Hidden Doors corporate website status"
  echo "Website container: $(container_health "$CONTAINER")"
  echo "Preview: https://$PREVIEW_HOST/"
  echo "Production: https://$PRODUCTION_HOST/"
  echo "Production app: $(container_health "$prod_app")"
  echo "Production DB: $(container_health "$prod_db")"
  echo "Production proxy: $(container_health "$proxy")"
  echo "Website network:"
  docker network inspect "$NETWORK" --format '{{json .Containers}}' 2>/dev/null || echo absent
}

case "${1:-}" in
  status)
    status
    ;;
  deploy-preview)
    [[ "$#" -eq 3 ]] || die "Usage: $0 deploy-preview <workspace> <expected-sha>"
    deploy_preview "$2" "$3"
    ;;
  promote-production)
    [[ "$#" -eq 2 ]] || die "Usage: $0 promote-production PRODUCTION"
    promote_production "$2"
    ;;
  rollback)
    rollback
    ;;
  *)
    die "Usage: $0 {status|deploy-preview <workspace> <expected-sha>|promote-production PRODUCTION|rollback}"
    ;;
esac

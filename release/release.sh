#!/bin/bash
# Safe release for the B2B portal (luxella-b2b.vercel.app).
#   release.sh            -> stage -> syntax check -> local smoke -> deploy (domain not moved)
#                            -> point domain -> live smoke -> auto-rollback on failure -> log
#   release.sh rollback [deployment_id]  -> point domain back to the last good (or given) deployment
# Needs env: VT (Vercel token), TEAM, LX_SMOKE_EM, LX_SMOKE_PW. Nothing secret lives in this repo.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(dirname "$HERE")"
BASE=/home/claude/luxella-b2b            # holds assets/ and vendor/ for the site
STATE="${LX_RELEASE_STATE:-$HOME/.lx-release}"; mkdir -p "$STATE"
LIVE=https://luxella-b2b.vercel.app
V="python3 $HERE/vercel.py"
log(){ echo "[release] $*"; }

if [ "${1:-}" = rollback ]; then
  T0=$(date +%s)
  TARGET="${2:-$(cat "$STATE/last_good_prev" 2>/dev/null || true)}"
  [ -n "$TARGET" ] || { echo "no previous good deployment recorded; pass an id"; exit 1; }
  $V alias "$TARGET"
  echo "$TARGET" > "$STATE/last_good"
  log "rolled back to $TARGET in $(( $(date +%s)-T0 ))s"; exit 0
fi

COMMIT=$(git -C "$REPO" rev-parse --short HEAD)
DIRTY=$(git -C "$REPO" status --porcelain -- b2b.js b2b-site | wc -l)
SRV=""; STAGE=$(mktemp -d); trap 'rm -rf "$STAGE"; kill $SRV 2>/dev/null || true' EXIT
cp -r "$BASE/assets" "$BASE/vendor" "$STAGE/"
cp "$REPO/b2b.js" "$REPO/b2b-site/index.html" "$REPO/b2b-site/vercel.json" "$STAGE/"
SHA=$(sha1sum "$STAGE/b2b.js" | cut -c1-12)
log "commit $COMMIT (uncommitted portal files: $DIRTY) b2b.js $SHA"

log "1/5 syntax check"; node --check "$STAGE/b2b.js"

log "2/5 local smoke"
PORT=$((8700 + RANDOM % 200)); (cd "$STAGE" && exec python3 -m http.server $PORT >/dev/null 2>&1) & SRV=$!
sleep 1
node "$HERE/smoke.js" "http://127.0.0.1:$PORT/" || { log "BLOCKED: local smoke failed, production untouched"; exit 1; }

log "3/5 deploy (live domain not moved yet)"
PREV=$($V current); DEP=$($V deploy "$STAGE")
log "new $DEP, live is still $PREV"

log "4/5 point domain + verify live file"
$V alias "$DEP"
for i in $(seq 1 30); do
  L=$(curl -s "$LIVE/b2b.js?v=$(date +%s%N)" | sha1sum | cut -c1-12); [ "$L" = "$SHA" ] && break; sleep 2
done
[ "$L" = "$SHA" ] || { log "live file mismatch -> rollback"; $V alias "$PREV"; exit 1; }

log "5/5 live smoke"
REC=$(printf '{"at":"%s","commit":"%s","dirty":%s,"sha":"%s","dep":"%s","prev":"%s"}' "$(date -u +%FT%TZ)" "$COMMIT" "$DIRTY" "$SHA" "$DEP" "$PREV")
if node "$HERE/smoke.js" "$LIVE/" --log "$REC"; then
  echo "$PREV" > "$STATE/last_good_prev"; echo "$DEP" > "$STATE/last_good"
  log "RELEASED $DEP (rollback target: $PREV)"
else
  log "live smoke failed -> rollback to $PREV"; $V alias "$PREV"; exit 1
fi

#!/bin/sh
set -eu

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

api_base="$(json_escape "${VITE_API_BASE:-}")"

cat > /usr/share/nginx/html/env.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE: "${api_base}",
};
EOF

exec nginx -g "daemon off;"

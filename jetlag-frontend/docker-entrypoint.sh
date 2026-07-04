#!/bin/sh
set -eu

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

runtime_api_base="${PUBLIC_API_BASE:-${RUNTIME_API_BASE:-${VITE_API_BASE:-}}}"
api_base="$(json_escape "$runtime_api_base")"

cat > /usr/share/nginx/html/env.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE: "${api_base}",
};
EOF

exec nginx -g "daemon off;"

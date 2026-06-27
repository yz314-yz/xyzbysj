#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE: "${VITE_API_BASE:-}",
};
EOF

exec nginx -g "daemon off;"

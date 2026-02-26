#!/bin/sh
set -e

# Write runtime config from environment variables into the served config.js.
# Angular reads window.__env at startup — no rebuild required.
cat > /usr/share/nginx/html/config.js <<EOF
window.__env = {
  apiUrl: '${API_URL:-http://localhost:3000/api}',
  sentryDsn: '${SENTRY_DSN:-}',
};
EOF

echo "Runtime config written:"
cat /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'

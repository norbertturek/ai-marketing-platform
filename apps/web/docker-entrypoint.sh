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

# Railway injects PORT; update nginx to listen on it (default 80).
PORT="${PORT:-80}"
sed -i "s/listen 80/listen ${PORT}/" /etc/nginx/conf.d/default.conf
sed -i "s/listen \[::\]:80/listen [::]:${PORT}/" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

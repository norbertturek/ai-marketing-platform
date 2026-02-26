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

# Railway injects PORT for the web service (e.g. 4000); replace placeholder so nginx listens on it.
PORT="${PORT:-4000}"
sed "s/__PORT__/${PORT}/g" /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf
echo "Nginx will listen on port ${PORT}"
exec nginx -g 'daemon off;'

#!/bin/sh
set -e

PORT="${PORT:-4000}"

# Write runtime config from environment variables into the served config.js.
# Angular reads window.__env at startup — no rebuild required.
cat > /usr/share/nginx/html/config.js <<ENVEOF
window.__env = {
  apiUrl: '${API_URL:-http://localhost:3000/api}',
  sentryDsn: '${SENTRY_DSN:-}',
};
ENVEOF

echo "Runtime config written; nginx will listen on port ${PORT}"

# Write nginx server config with PORT in place (no sed/tmp; works on Railway).
cat > /etc/nginx/conf.d/default.conf <<NGINXEOF
server {
    listen ${PORT} default_server;
    listen [::]:${PORT} default_server;
    root /usr/share/nginx/html;
    index index.html;

    location = /health {
        add_header Content-Type text/plain;
        return 200 "ok";
    }

    location = /config.js {
        add_header Cache-Control "no-store";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|woff2?|ttf|eot|svg|png|jpg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
NGINXEOF

exec nginx -g 'daemon off;'

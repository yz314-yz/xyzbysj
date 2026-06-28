FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.sh \
  && mkdir -p /run \
  && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /run /var/log/nginx /docker-entrypoint.sh

EXPOSE 8080
USER nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:8080/env.js >/dev/null || exit 1
ENTRYPOINT ["/docker-entrypoint.sh"]

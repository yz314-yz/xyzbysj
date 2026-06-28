FROM node:20-alpine AS frontend-build
WORKDIR /app/jetlag-frontend

COPY jetlag-frontend/package*.json ./
RUN npm ci

COPY jetlag-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-runtime
WORKDIR /app

# better-sqlite3 是原生模块，Alpine 需要编译工具链
RUN apk add --no-cache python3 make g++

COPY jetlag-backend/package*.json ./
RUN npm ci --omit=dev

COPY jetlag-backend/ ./
COPY --from=frontend-build /app/jetlag-frontend/dist ./public
RUN mkdir -p /app/data /app/logs /app/uploads
RUN chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=7860
ENV PUBLIC_API_BASE=

EXPOSE 7860

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 7860) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["npm", "start"]

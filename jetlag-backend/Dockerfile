FROM node:20-alpine
WORKDIR /app

# better-sqlite3 是原生模块，Alpine 需要编译工具链
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .
RUN mkdir -p /app/data /app/logs /app/uploads
RUN chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]

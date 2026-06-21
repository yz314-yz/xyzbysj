# Reference template: express.Dockerfile (v0.3)
# Adaptations for JetLag Sync (jetlag-backend):
# - Entry: src/server.js
# - Start command: npm start
# - PORT: 7860 (HuggingFace Spaces default)
# - NODE_ENV: production

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["node", "src/server.js"]

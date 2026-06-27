FROM node:20-alpine AS frontend-build
WORKDIR /app/jetlag-frontend

COPY jetlag-frontend/package*.json ./
RUN npm ci

COPY jetlag-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-runtime
WORKDIR /app

COPY jetlag-backend/package*.json ./
RUN npm ci --omit=dev

COPY jetlag-backend/ ./
COPY --from=frontend-build /app/jetlag-frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=7860
ENV PUBLIC_API_BASE=

EXPOSE 7860

CMD ["npm", "start"]

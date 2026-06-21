# Reference template only.
# Adapt this file based on the actual project structure, scripts, port, environment variables, and runtime requirements.
# Do not use blindly without checking the project files.

# React + Vite static frontend for Hugging Face Docker Space.
# If the build output is not dist, adjust the COPY path below.
# If the app needs an API base URL, handle it through build-time env vars or runtime configuration.

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

RUN sed -i 's/listen       80;/listen       7860;/' /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Hugging Face Spaces commonly use port 7860.
EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]

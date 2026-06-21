# Reference template only.
# Adapt this file based on the actual project structure, scripts, port, environment variables, and runtime requirements.
# Do not use blindly without checking the project files.

# NewAPI reference for Hugging Face Docker Space.
# NewAPI project structure may vary by version; adapt this file from the actual repository layout and docs.
# Aiven is a MySQL database service, not a backend server.
# Hugging Face Docker Space runs the NewAPI application container, which connects to Aiven MySQL when persistence is required.
# Prefer an existing upstream Dockerfile or official project deployment docs when present.

FROM node:20-alpine
WORKDIR /app

# Conservative Node-style reference only. If this NewAPI repository is not Node-based,
# replace the base image, install steps, build command, and start command.
COPY package*.json ./
RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi; \
    else \
      echo "Adapt this NewAPI template to the actual repository structure before building." && exit 1; \
    fi

COPY . .

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# Adapt this command to the actual NewAPI start command.
CMD ["npm", "start"]

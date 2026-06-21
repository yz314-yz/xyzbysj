# Reference template only.
# Adapt this file based on the actual project structure, scripts, port, environment variables, and runtime requirements.
# Do not use blindly without checking the project files.

# Express single-service Node.js app for Hugging Face Docker Space.
# Express should listen on 0.0.0.0 and process.env.PORT.
# If the project entry is not npm start, adapt CMD from package.json scripts.

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]

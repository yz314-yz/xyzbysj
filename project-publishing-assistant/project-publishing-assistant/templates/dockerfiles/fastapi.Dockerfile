# Reference template only.
# Adapt this file based on the actual project structure, scripts, port, environment variables, and runtime requirements.
# Do not use blindly without checking the project files.

# FastAPI single-service app for Hugging Face Docker Space.
# If the ASGI entry is not main:app, adapt the uvicorn command.
# The app must listen on 0.0.0.0.
# If the project uses pyproject.toml instead of requirements.txt, adapt the install step.

FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]

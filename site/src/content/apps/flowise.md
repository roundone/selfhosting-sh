---
title: "How to Self-Host Flowise with Docker Compose"
description: "Deploy Flowise with Docker for visual AI workflow building. No-code chatbots, RAG pipelines, and LLM agent creation guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - flowise
tags:
  - self-hosted
  - flowise
  - docker
  - ai
  - workflow
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Flowise?

[Flowise](https://flowiseai.com/) is a visual drag-and-drop tool for building LLM-powered chatbots, agents, and RAG pipelines. Instead of writing code, you connect nodes in a canvas — LLM providers, vector databases, document loaders, and tools — to create AI workflows. Built on LangChain.js, Flowise can connect to OpenAI, Anthropic, Ollama, and dozens of other LLM providers.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB+ RAM
- 5 GB free disk space
- An LLM backend ([Ollama](/apps/ollama), OpenAI API key, or similar)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  flowise:
    image: flowiseai/flowise:3.0.13
    container_name: flowise
    ports:
      - "3000:3000"
    volumes:
      - flowise_data:/root/.flowise
    environment:
      # Authentication
      - FLOWISE_USERNAME=admin
      - FLOWISE_PASSWORD=changeme-use-strong-password
      # API key storage
      - APIKEY_PATH=/root/.flowise
      - SECRETKEY_PATH=/root/.flowise
      # Database (SQLite by default)
      - DATABASE_PATH=/root/.flowise
      # Optional: Log level
      - LOG_LEVEL=info
      # Optional: Execution timeout (ms)
      - EXECUTION_TIMEOUT=300000
    restart: unless-stopped

volumes:
  flowise_data:
```

For production with PostgreSQL:

```yaml
services:
  flowise:
    image: flowiseai/flowise:3.0.13
    container_name: flowise
    ports:
      - "3000:3000"
    volumes:
      - flowise_data:/root/.flowise
    environment:
      - FLOWISE_USERNAME=admin
      - FLOWISE_PASSWORD=changeme-use-strong-password
      - DATABASE_TYPE=postgres
      - DATABASE_HOST=flowise-db
      - DATABASE_PORT=5432
      - DATABASE_USER=flowise
      - DATABASE_PASSWORD=flowise-db-password-change-this
      - DATABASE_NAME=flowise
      - APIKEY_PATH=/root/.flowise
      - SECRETKEY_PATH=/root/.flowise
    depends_on:
      flowise-db:
        condition: service_healthy
    restart: unless-stopped

  flowise-db:
    image: postgres:16-alpine
    container_name: flowise-db
    volumes:
      - flowise_db_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=flowise
      - POSTGRES_PASSWORD=flowise-db-password-change-this
      - POSTGRES_DB=flowise
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowise"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  flowise_data:
  flowise_db_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:3000` in your browser
2. Log in with the credentials you set in `FLOWISE_USERNAME` / `FLOWISE_PASSWORD`
3. Click **Chatflows** → **Add New** to create your first workflow
4. Drag nodes from the sidebar to build your pipeline

### Quick Start: Ollama Chatbot

1. Drag **ChatOllama** node onto the canvas
2. Set Base URL to `http://host.docker.internal:11434` (or your Ollama URL)
3. Set Model Name to `llama3.2`
4. Drag a **Conversational Agent** node and connect it
5. Click **Save** then **Chat** to test

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLOWISE_USERNAME` | | Username for UI authentication |
| `FLOWISE_PASSWORD` | | Password for UI authentication |
| `DATABASE_TYPE` | `sqlite` | Database type: `sqlite`, `postgres`, `mysql` |
| `DATABASE_PATH` | `/root/.flowise` | SQLite database location |
| `APIKEY_PATH` | `/root/.flowise` | API key storage path |
| `SECRETKEY_PATH` | `/root/.flowise` | Secret key storage path |
| `LOG_LEVEL` | `info` | Logging level: `error`, `info`, `verbose`, `debug` |
| `EXECUTION_TIMEOUT` | `300000` | Flow execution timeout in ms |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### Embedding a Chat Widget

Every chatflow gets an embed code. Click the **</> Embed** button to get a script tag you can paste into any website:

```html
<script type="module">
  import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
  Chatbot.init({
    chatflowid: "your-chatflow-id",
    apiHost: "https://flowise.example.com",
  })
</script>
```

## Advanced Configuration

### RAG Pipeline

Build a document-based Q&A chatbot:

1. **Document Loader** → PDF, CSV, or web page loader
2. **Text Splitter** → Recursive Character Text Splitter
3. **Embeddings** → Ollama Embeddings or OpenAI Embeddings
4. **Vector Store** → Chroma, Pinecone, or Qdrant
5. **Retrieval QA Chain** → Connects to your LLM

### API Access

Every chatflow is accessible via API:

```bash
curl -X POST http://localhost:3000/api/v1/prediction/your-chatflow-id \
  -H "Content-Type: application/json" \
  -d '{"question": "What is self-hosting?"}'
```

## Reverse Proxy

Configure your reverse proxy to forward to port 3000. WebSocket support is required for the chat interface. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the Flowise data volume:

```bash
docker run --rm -v flowise_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/flowise-backup.tar.gz /data
```

This contains chatflows, credentials, API keys, and the SQLite database (if using SQLite). See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Cannot Connect to Ollama

**Symptom:** ChatOllama node fails to connect.
**Fix:** Use `http://host.docker.internal:11434` on Docker Desktop, or the Docker bridge IP (`http://172.17.0.1:11434`) on Linux. Ensure Ollama is listening on `0.0.0.0`: set `OLLAMA_HOST=0.0.0.0:11434`.

### Chatflow Execution Times Out

**Symptom:** Flow returns timeout error.
**Fix:** Increase `EXECUTION_TIMEOUT` environment variable. Default is 300 seconds (5 minutes). Complex RAG pipelines with large documents may need more.

### Authentication Bypass

**Symptom:** UI accessible without login.
**Fix:** Ensure both `FLOWISE_USERNAME` and `FLOWISE_PASSWORD` are set. If either is empty, authentication is disabled.

## Resource Requirements

- **RAM:** 200-500 MB (Flowise itself is lightweight; LLM backends are separate)
- **CPU:** Low
- **Disk:** 1-5 GB depending on number of chatflows and stored documents

## Verdict

Flowise is the easiest way to build AI chatbots and RAG pipelines without writing code. The drag-and-drop interface makes it accessible to non-developers while remaining powerful enough for complex workflows. The embeddable chat widget is a killer feature for deploying AI chatbots to websites.

**Choose Flowise** for no-code chatbot building. **Choose [Langflow](/apps/langflow)** if you need Python custom components and more advanced multi-agent orchestration.

## Related

- [How to Self-Host Langflow](/apps/langflow)
- [Flowise vs Langflow](/compare/flowise-vs-langflow)
- [How to Self-Host Ollama](/apps/ollama)
- [How to Self-Host Open WebUI](/apps/open-webui)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Docker Compose Basics](/foundations/docker-compose-basics)

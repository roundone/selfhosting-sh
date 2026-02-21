---
title: "How to Self-Host Langflow with Docker Compose"
description: "Deploy Langflow with Docker for visual AI workflow building. Multi-agent orchestration, Python components, and API deployment."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - langflow
tags:
  - self-hosted
  - langflow
  - docker
  - ai
  - workflow
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Langflow?

[Langflow](https://www.langflow.org/) is a visual AI workflow builder that lets you create LLM-powered applications by connecting components in a drag-and-drop canvas. Built on LangChain, it supports multi-agent orchestration, RAG pipelines, and custom Python components. Flows can be deployed as REST APIs or MCP servers, making Langflow both a prototyping tool and a deployment platform.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB+ RAM
- 5 GB free disk space
- An LLM backend ([Ollama](/apps/ollama/), OpenAI API key, or similar)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  langflow:
    image: langflowai/langflow:1.7.3
    container_name: langflow
    ports:
      - "7860:7860"
    volumes:
      - langflow_data:/app/langflow
    environment:
      # Database (SQLite by default)
      - LANGFLOW_DATABASE_URL=sqlite:////app/langflow/langflow.db
      - LANGFLOW_CONFIG_DIR=/app/langflow
      # Authentication (optional)
      - LANGFLOW_AUTO_LOGIN=false
      - LANGFLOW_SUPERUSER=admin
      - LANGFLOW_SUPERUSER_PASSWORD=changeme-use-strong-password
      # Worker settings
      - LANGFLOW_WORKERS=1
    restart: unless-stopped

volumes:
  langflow_data:
```

For production with PostgreSQL:

```yaml
services:
  langflow:
    image: langflowai/langflow:1.7.3
    container_name: langflow
    ports:
      - "7860:7860"
    volumes:
      - langflow_data:/app/langflow
    environment:
      - LANGFLOW_DATABASE_URL=postgresql://langflow:langflow-db-password@langflow-db:5432/langflow
      - LANGFLOW_CONFIG_DIR=/app/langflow
      - LANGFLOW_AUTO_LOGIN=false
      - LANGFLOW_SUPERUSER=admin
      - LANGFLOW_SUPERUSER_PASSWORD=changeme-use-strong-password
    depends_on:
      langflow-db:
        condition: service_healthy
    restart: unless-stopped

  langflow-db:
    image: postgres:16-alpine
    container_name: langflow-db
    volumes:
      - langflow_db_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=langflow
      - POSTGRES_PASSWORD=langflow-db-password
      - POSTGRES_DB=langflow
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U langflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  langflow_data:
  langflow_db_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:7860` in your browser
2. Log in with the superuser credentials
3. Click **New Flow** to create your first workflow
4. Use the sidebar to drag components onto the canvas

### Quick Start: Ollama Chat

1. Drag **Ollama** from the Models section
2. Set Base URL to `http://host.docker.internal:11434`
3. Set Model Name to `llama3.2`
4. Drag a **Chat Output** component
5. Connect Ollama's output to Chat Output's input
6. Click the **Playground** button to test

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LANGFLOW_DATABASE_URL` | SQLite | Database connection string |
| `LANGFLOW_CONFIG_DIR` | `/app/langflow` | Config and data directory |
| `LANGFLOW_AUTO_LOGIN` | `true` | Skip login (disable for production) |
| `LANGFLOW_SUPERUSER` | | Admin username |
| `LANGFLOW_SUPERUSER_PASSWORD` | | Admin password |
| `LANGFLOW_WORKERS` | `1` | Number of worker processes |
| `LANGFLOW_PORT` | `7860` | Server port |
| `LANGFLOW_HOST` | `0.0.0.0` | Server bind address |

## Advanced Configuration

### Custom Python Components

Langflow supports custom Python components. Create a component that adds custom logic:

```python
from langflow.custom import Component
from langflow.io import MessageTextInput, Output

class MyComponent(Component):
    display_name = "Custom Processor"
    inputs = [MessageTextInput(name="input_text", display_name="Input")]
    outputs = [Output(display_name="Output", name="output", method="process")]

    def process(self) -> str:
        return self.input_text.upper()
```

Place custom components in the Langflow data directory and they appear in the sidebar.

### Deploy as API

Every flow automatically gets an API endpoint:

```bash
curl -X POST http://localhost:7860/api/v1/run/your-flow-id \
  -H "Content-Type: application/json" \
  -d '{"input_value": "What is self-hosting?", "output_type": "chat"}'
```

### MCP Server Deployment

Langflow can deploy flows as MCP (Model Context Protocol) servers, allowing AI assistants to use your flows as tools.

## Reverse Proxy

Configure your reverse proxy to forward to port 7860. WebSocket support is required for the interactive playground. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the Langflow data volume:

```bash
docker run --rm -v langflow_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/langflow-backup.tar.gz /data
```

This contains flows, credentials, custom components, and the SQLite database. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Cannot Connect to Ollama

**Symptom:** Ollama component fails to connect.
**Fix:** Use `http://host.docker.internal:11434` on Docker Desktop, or `http://172.17.0.1:11434` on Linux. Ensure Ollama has `OLLAMA_HOST=0.0.0.0:11434`.

### Flow Runs Slowly

**Symptom:** Playground responses take a long time.
**Fix:** Check that your LLM backend is running efficiently. Increase `LANGFLOW_WORKERS` for better concurrency. Ensure sufficient RAM for the Langflow process.

### Login Page Loops

**Symptom:** Login redirects back to login page.
**Fix:** Clear browser cookies. Ensure `LANGFLOW_SUPERUSER` and `LANGFLOW_SUPERUSER_PASSWORD` are set correctly. Check `LANGFLOW_AUTO_LOGIN` is set to `false` (not an empty string).

## Resource Requirements

- **RAM:** 300-600 MB (Langflow itself; LLM backends are separate)
- **CPU:** Low-medium
- **Disk:** 1-5 GB depending on stored flows and custom components

## Verdict

Langflow is the more powerful visual AI builder. Its Python component system, multi-agent support, and API deployment capabilities make it a real development platform, not just a chatbot builder. The trade-off is a higher learning curve and heavier resource footprint compared to [Flowise](/apps/flowise/).

**Choose Langflow** for building AI applications with custom logic and API deployment. **Choose [Flowise](/apps/flowise/)** for simpler chatbot building with a lower barrier to entry.

## Related

- [How to Self-Host Flowise](/apps/flowise/)
- [Flowise vs Langflow](/compare/flowise-vs-langflow/)
- [How to Self-Host Ollama](/apps/ollama/)
- [How to Self-Host Open WebUI](/apps/open-webui/)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt/)
- [Best Self-Hosted AI Tools](/best/ai-ml/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

---
title: "How to Self-Host Open WebUI with Docker"
description: "Set up Open WebUI with Docker Compose for a self-hosted ChatGPT-like interface. Connect to Ollama, manage models, and chat with local LLMs."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ai-ml"
apps:
  - open-webui
tags:
  - self-hosted
  - open-webui
  - docker
  - ai
  - llm
  - chatgpt-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Open WebUI?

[Open WebUI](https://github.com/open-webui/open-webui) is a self-hosted web interface for interacting with large language models. It provides a ChatGPT-like experience — conversation history, model switching, file uploads, web search, and multi-user support — all running on your own hardware. It connects to [Ollama](/apps/ollama) for local models and supports OpenAI-compatible APIs for cloud models.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB of RAM minimum (8 GB+ recommended with Ollama)
- 5 GB of free disk space (plus model storage)
- [Ollama](/apps/ollama) running locally or accessible on the network

## Docker Compose Configuration

Create a `docker-compose.yml` file:

### Open WebUI + Ollama (Recommended)

```yaml
services:
  ollama:
    image: ollama/ollama:0.16.1
    container_name: ollama
    volumes:
      # Stores downloaded LLM models
      - ollama_data:/root/.ollama
    restart: unless-stopped
    # Uncomment for NVIDIA GPU support
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]

  open-webui:
    image: ghcr.io/open-webui/open-webui:v0.8.3
    container_name: open-webui
    ports:
      - "3000:8080"
    volumes:
      # Stores database, uploads, and user data
      - open-webui_data:/app/backend/data
    environment:
      # Connect to the Ollama container by service name
      - OLLAMA_BASE_URL=http://ollama:11434
      # CHANGE THIS — used for JWT token signing
      - WEBUI_SECRET_KEY=change-this-to-a-random-64-char-string
      # Disable telemetry
      - SCARF_NO_ANALYTICS=true
      - DO_NOT_TRACK=true
      - ANONYMIZED_TELEMETRY=false
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
  open-webui_data:
```

### Open WebUI Only (Connecting to Existing Ollama)

If Ollama is already running on the host or another server:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:v0.8.3
    container_name: open-webui
    ports:
      - "3000:8080"
    volumes:
      - open-webui_data:/app/backend/data
    environment:
      # Point to Ollama on the host machine
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - WEBUI_SECRET_KEY=change-this-to-a-random-64-char-string
      - SCARF_NO_ANALYTICS=true
      - DO_NOT_TRACK=true
      - ANONYMIZED_TELEMETRY=false
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

volumes:
  open-webui_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000`
2. Click **Sign Up** to create the first account. The first user automatically becomes the admin.
3. After signing in, pull a model if Ollama has none:
   - Go to **Settings** (gear icon) > **Models**
   - Enter a model name (e.g., `llama3.1`) and click the download icon
   - Wait for the download to complete
4. Start chatting by selecting a model from the dropdown and typing a message

## Configuration

### User Management

- **First user is admin.** All subsequent users are regular users by default.
- Admin can promote users at **Admin Panel** > **Users**
- To pre-create an admin account on first startup, set:

```yaml
environment:
  - WEBUI_ADMIN_EMAIL=admin@example.com
  - WEBUI_ADMIN_PASSWORD=your-strong-password
```

### Single-User Mode (No Login)

For personal servers where only you have network access:

```yaml
environment:
  - WEBUI_AUTH=False
```

**Warning:** This cannot be changed after first startup without resetting the database. Decide before your first launch.

### Connecting to OpenAI API

Open WebUI can also use OpenAI or any OpenAI-compatible API alongside Ollama:

```yaml
environment:
  - OPENAI_API_BASE_URL=https://api.openai.com/v1
  - OPENAI_API_KEY=sk-your-api-key
```

This lets you use GPT-4, Claude (via compatible proxies), or any other OpenAI-compatible endpoint alongside your local models.

### Database Configuration

By default, Open WebUI uses SQLite stored in the data volume. For production with multiple users, switch to PostgreSQL:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:v0.8.3
    environment:
      - DATABASE_URL=postgresql://openwebui:password@db:5432/openwebui
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    container_name: open-webui-db
    environment:
      - POSTGRES_DB=openwebui
      - POSTGRES_USER=openwebui
      - POSTGRES_PASSWORD=change-this-strong-password
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  db_data:
```

### Key Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL. Use service name in Compose |
| `WEBUI_SECRET_KEY` | `t0p-s3cr3t` | JWT signing key. **Must change in production** |
| `WEBUI_AUTH` | `True` | Set `False` for single-user mode |
| `CORS_ALLOW_ORIGIN` | `*` | Restrict to your domain in production |
| `OFFLINE_MODE` | `False` | Disable outbound version checks |
| `SAFE_MODE` | `False` | Restricted operation mode |

## Advanced Configuration (Optional)

### RAG (Retrieval-Augmented Generation)

Open WebUI supports uploading documents and using them as context for conversations:

1. In a chat, click the **+** button and upload a PDF, TXT, or other document
2. The content is automatically chunked and indexed
3. The model uses the document as context when answering questions

For large document collections, configure a vector database in the admin settings.

### Web Search Integration

Enable web search so models can access current information:

1. Go to **Admin Panel** > **Settings** > **Web Search**
2. Configure a search provider (SearXNG, Google, Brave, etc.)
3. If you're self-hosting [SearXNG](/apps/searxng), point it to your instance

### Model Presets and Customization

Create custom model configurations:

1. Go to **Workspace** > **Models**
2. Click **Create a Model**
3. Set a system prompt, temperature, and other parameters
4. Save and use it as a named model in chats

### Authentication with OAuth/OIDC

For enterprise setups, configure SSO:

```yaml
environment:
  - OAUTH_PROVIDER_NAME=Authentik
  - OPENID_PROVIDER_URL=https://auth.example.com/application/o/open-webui/.well-known/openid-configuration
  - OAUTH_CLIENT_ID=your-client-id
  - OAUTH_CLIENT_SECRET=your-client-secret
  - OAUTH_SCOPES=openid email profile
```

## Reverse Proxy

Forward port 3000 (or your chosen host port) through your reverse proxy.

Nginx config snippet:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # WebSocket support for streaming responses
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # Increase timeout for long model responses
    proxy_read_timeout 300s;
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

Back up the data volume:

```bash
docker compose stop open-webui
docker run --rm -v open-webui_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/open-webui-backup.tar.gz /data
docker compose start open-webui
```

The data volume contains the database (conversations, users, settings), uploaded files, and custom configurations.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### "Ollama is not reachable"

**Symptom:** Open WebUI shows Ollama connection error.

**Fix:** Verify `OLLAMA_BASE_URL` is set correctly:
- If Ollama is in the same Compose file: `http://ollama:11434`
- If Ollama is on the host: `http://host.docker.internal:11434` (with `extra_hosts` configured)
- If Ollama is on another server: `http://192.168.1.x:11434`

Test from inside the container:
```bash
docker exec open-webui curl http://ollama:11434/api/tags
```

### No models appear in dropdown

**Symptom:** Model selector is empty.

**Fix:** Models need to be downloaded into Ollama first:
```bash
docker exec ollama ollama pull llama3.1
```
Then refresh the Open WebUI page.

### Login page keeps redirecting

**Symptom:** Sign-in redirects back to the login page.

**Fix:** This usually means `WEBUI_SECRET_KEY` changed between restarts, invalidating all sessions. Set a persistent key in your Compose file and restart:
```bash
docker compose down && docker compose up -d
```

### Streaming responses not working behind proxy

**Symptom:** Responses appear all at once instead of streaming word-by-word.

**Fix:** Ensure your reverse proxy supports Server-Sent Events. In Nginx:
```nginx
proxy_buffering off;
proxy_cache off;
```

### Data lost after container recreation

**Symptom:** Conversations and settings disappear.

**Fix:** The data volume must persist. Use a named volume (`open-webui_data:/app/backend/data`), not an anonymous volume. If you used `docker run` without `-v`, migrate to a Compose file with named volumes.

## Resource Requirements

- **RAM:** ~500 MB for Open WebUI alone. Add Ollama's requirements (model size + 2-4 GB).
- **CPU:** Low for the web UI. Model inference is handled by Ollama.
- **Disk:** ~2 GB for the application, plus conversation history and uploaded files.

## Verdict

Open WebUI is the best self-hosted ChatGPT alternative. The interface is polished, feature-rich, and actively developed. Combined with [Ollama](/apps/ollama), you get a fully local AI assistant with zero data leaving your network. Multi-user support, conversation history, document uploads, and web search make it genuinely useful for daily work.

If you want a simpler text-generation interface without the ChatGPT-style features, [Text Generation WebUI](/apps/text-generation-webui) gives more low-level control. But for most people, Open WebUI + Ollama is the right stack.

## Related

- [How to Self-Host Ollama](/apps/ollama)
- [How to Self-Host LocalAI](/apps/localai)
- [Ollama vs LocalAI](/compare/ollama-vs-localai)
- [Open WebUI vs Text Generation WebUI](/compare/open-webui-vs-text-generation-webui)
- [Self-Hosted Alternatives to ChatGPT](/replace/chatgpt)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [GPU Passthrough in Docker](/foundations/gpu-passthrough-docker)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

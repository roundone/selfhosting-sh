---
title: "How to Self-Host Karakeep (Hoarder)"
description: "Step-by-step guide to self-hosting Karakeep (formerly Hoarder) with Docker Compose for bookmarking, read-later, and AI tagging."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "bookmarks-read-later"
apps:
  - hoarder
tags:
  - self-hosted
  - hoarder
  - karakeep
  - bookmarks
  - docker
  - read-later
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Karakeep?

[Karakeep](https://karakeep.app/) (formerly Hoarder) is a self-hosted bookmark-everything app with AI-powered tagging. Save links, notes, and images — Karakeep automatically archives pages, takes screenshots, and uses AI to categorize your saves. It's a self-hosted alternative to Pocket, Raindrop, and Instapaper with the added benefit of full-text search via Meilisearch. The project was renamed from Hoarder to Karakeep in early 2026.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of free disk space (plus storage for archived pages)
- 1 GB of RAM (minimum)
- A domain name (optional, for remote access)
- An OpenAI API key or local Ollama instance (optional, for AI tagging)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir karakeep && cd karakeep
```

Create a `.env` file:

```bash
# REQUIRED — Authentication secret for NextAuth.js
# Generate with: openssl rand -base64 36
NEXTAUTH_SECRET=CHANGE_ME_GENERATE_A_RANDOM_STRING

# REQUIRED — Meilisearch master key for search indexing
# Generate with: openssl rand -base64 36
MEILI_MASTER_KEY=CHANGE_ME_GENERATE_ANOTHER_RANDOM_STRING

# REQUIRED — URL where Karakeep will be accessed
# Change to your domain if using a reverse proxy
NEXTAUTH_URL=http://localhost:3000

# Version — pin to a specific release
KARAKEEP_VERSION=0.30.0

# OPTIONAL — OpenAI API key for AI-powered auto-tagging
# Omit if using Ollama or if you don't want AI tagging
# OPENAI_API_KEY=sk-...

# OPTIONAL — Use Ollama instead of OpenAI for AI tagging
# OLLAMA_BASE_URL=http://host.docker.internal:11434
# INFERENCE_TEXT_MODEL=llama3
# INFERENCE_IMAGE_MODEL=llava
```

Create `docker-compose.yml`:

```yaml
services:
  web:
    image: ghcr.io/karakeep-app/karakeep:${KARAKEEP_VERSION:-0.30.0}
    container_name: karakeep
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - data:/data
    environment:
      MEILI_ADDR: http://meilisearch:7700
      BROWSER_WEB_URL: http://chrome:9222
      DATA_DIR: /data
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      # Uncomment for OpenAI tagging:
      # OPENAI_API_KEY: ${OPENAI_API_KEY}
      # Uncomment for Ollama tagging:
      # OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}
      # INFERENCE_TEXT_MODEL: ${INFERENCE_TEXT_MODEL}
      # INFERENCE_IMAGE_MODEL: ${INFERENCE_IMAGE_MODEL}
    depends_on:
      - meilisearch
      - chrome

  chrome:
    image: gcr.io/zenika-hub/alpine-chrome:124
    container_name: karakeep-chrome
    restart: unless-stopped
    command:
      - --no-sandbox
      - --disable-gpu
      - --disable-dev-shm-usage
      - --remote-debugging-address=0.0.0.0
      - --remote-debugging-port=9222
      - --hide-scrollbars

  meilisearch:
    image: getmeili/meilisearch:v1.13.3
    container_name: karakeep-meilisearch
    restart: unless-stopped
    volumes:
      - meilisearch:/meili_data
    environment:
      MEILI_NO_ANALYTICS: "true"
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}

volumes:
  data:
  meilisearch:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Open `http://your-server-ip:3000` in a browser. You'll see a registration page — create your admin account. Karakeep supports multiple users, but the first account is the admin.

After logging in:

1. **Install the browser extension** — available for Chrome and Firefox. This is the primary way to save bookmarks.
2. **Configure AI tagging** (optional) — go to Settings and enter your OpenAI API key, or configure Ollama for local inference.
3. **Try saving a link** — use the browser extension or paste a URL in the web UI. Karakeep will archive the page, take a screenshot, and auto-tag it if AI is configured.

## Configuration

### AI Tagging Options

Karakeep's standout feature is automatic AI tagging. Two options:

**OpenAI (cloud):** Add `OPENAI_API_KEY` to your `.env`. Uses GPT to analyze saved content and generate tags. Costs a few cents per hundred bookmarks.

**Ollama (local):** Point `OLLAMA_BASE_URL` to your Ollama instance. Set `INFERENCE_TEXT_MODEL` (e.g., `llama3`) for text analysis and `INFERENCE_IMAGE_MODEL` (e.g., `llava`) for image analysis. Free but requires GPU or patience.

### Mobile Access

Karakeep has iOS and Android apps available. The share sheet integration lets you save links directly from your phone's browser.

### Full-Text Search

Meilisearch indexes all saved content for instant search. No configuration needed — it works out of the box. Search covers page titles, descriptions, extracted text, tags, and notes.

## Advanced Configuration (Optional)

### Custom Data Directory

To use a bind mount instead of a Docker volume:

```yaml
volumes:
  - /path/to/karakeep/data:/data
```

### Running Behind a Reverse Proxy

Update `NEXTAUTH_URL` in `.env` to your public URL:

```bash
NEXTAUTH_URL=https://bookmarks.example.com
```

Karakeep uses NextAuth.js — the URL must exactly match what users type in their browser, including the protocol. Mismatch causes authentication failures.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for Nginx Proxy Manager or Traefik configuration.

## Reverse Proxy

Karakeep runs on port 3000. Point your reverse proxy to `http://karakeep:3000`. No special headers or WebSocket configuration needed for basic use.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full instructions.

## Backup

Back up two Docker volumes:

- `data` — all bookmarks, user data, archives, screenshots
- `meilisearch` — search index (can be rebuilt, but slow for large libraries)

```bash
docker compose down
docker run --rm -v karakeep_data:/data -v $(pwd):/backup alpine \
  tar -czf /backup/karakeep-data-$(date +%Y%m%d).tar.gz /data
docker run --rm -v karakeep_meilisearch:/meili_data -v $(pwd):/backup alpine \
  tar -czf /backup/karakeep-meilisearch-$(date +%Y%m%d).tar.gz /meili_data
docker compose up -d
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Pages Not Archiving or Screenshots Missing

**Symptom:** Saved links show no screenshot or archived content.

**Fix:** The Chrome container handles archiving. Check its logs:

```bash
docker compose logs chrome
```

If Chrome is crashing, increase shared memory or add `--disable-dev-shm-usage` (already included in the config above). Ensure the Chrome container has enough RAM — at least 512 MB.

### AI Tagging Not Working

**Symptom:** Bookmarks save but no tags are generated.

**Fix:** Verify your AI configuration. For OpenAI, check that `OPENAI_API_KEY` is set correctly. For Ollama, ensure `OLLAMA_BASE_URL` is reachable from the Karakeep container. Test with:

```bash
docker exec karakeep wget -qO- http://host.docker.internal:11434/api/tags
```

### Search Returns No Results

**Symptom:** Full-text search finds nothing even for saved bookmarks.

**Fix:** Check Meilisearch is running and connected:

```bash
docker compose logs meilisearch
```

Verify `MEILI_MASTER_KEY` matches between the web and meilisearch services. If keys were changed after first start, delete the meilisearch volume and recreate.

### Authentication Errors After Changing URL

**Symptom:** Login fails or redirects in a loop after changing the domain.

**Fix:** `NEXTAUTH_URL` must exactly match the URL users access. Update it in `.env` and restart:

```bash
docker compose down && docker compose up -d
```

### Container Keeps Restarting

**Symptom:** The web container restart loops.

**Fix:** Check logs for the actual error:

```bash
docker compose logs web
```

Common causes: missing `NEXTAUTH_SECRET`, invalid `MEILI_MASTER_KEY`, or Meilisearch not ready yet (add `depends_on` health check or just wait and retry).

## Resource Requirements

- **RAM:** ~500 MB idle (web + Chrome + Meilisearch), ~800 MB under active use
- **CPU:** Low for bookmarking. Moderate spikes during AI tagging and page archiving
- **Disk:** ~200 MB for the application, plus storage for archived pages (varies widely — budget 1-5 GB per thousand bookmarks)

## Verdict

Karakeep is the best self-hosted bookmark manager if you want AI-powered auto-tagging and full-page archiving. The Meilisearch integration makes search fast, the browser extensions work well, and the mobile apps are solid. It's more resource-heavy than [Linkwarden](/apps/linkwarden/) or [Linkding](/apps/linkding/) due to the Chrome and Meilisearch containers, but the features justify the overhead.

If you just need simple bookmarks without AI or archiving, [Linkding](/apps/linkding/) is lighter. If you want a read-later app with article parsing, [Wallabag](/apps/wallabag/) is more focused. Karakeep sits in the sweet spot between bookmark manager and personal archive.

## Related

- [How to Self-Host Linkwarden](/apps/linkwarden/)
- [How to Self-Host Wallabag](/apps/wallabag/)
- [How to Self-Host Linkding](/apps/linkding/)
- [Best Self-Hosted Bookmarks & Read Later Apps](/best/bookmarks-read-later/)
- [Self-Hosted Alternatives to Pocket](/replace/pocket/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)

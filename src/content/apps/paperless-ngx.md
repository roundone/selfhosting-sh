---
title: "How to Self-Host Paperless-ngx with Docker Compose"
type: "app-guide"
app: "paperless-ngx"
category: "document-management"
replaces: "Adobe Acrobat"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Paperless-ngx to digitize, OCR, and organize all your documents with Docker Compose."
officialUrl: "https://docs.paperless-ngx.com"
githubUrl: "https://github.com/paperless-ngx/paperless-ngx"
defaultPort: 8000
minRam: "1GB"
---

## What is Paperless-ngx?

Paperless-ngx is a document management system that turns your physical documents into a searchable online archive. Scan or photograph documents, and Paperless-ngx will OCR them (extract text), auto-tag and categorize them using machine learning, and store them in a searchable database. Bills, receipts, letters, tax documents — all searchable, all organized, all under your control.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 1GB RAM ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- A scanner or smartphone camera for digitizing documents

## Docker Compose Configuration

```yaml
# docker-compose.yml for Paperless-ngx
# Tested with Paperless-ngx 2.6+

services:
  paperless:
    container_name: paperless
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data:/usr/src/paperless/data
      - ./media:/usr/src/paperless/media
      - ./export:/usr/src/paperless/export
      - ./consume:/usr/src/paperless/consume
    environment:
      PAPERLESS_REDIS: redis://redis:6379
      PAPERLESS_DBHOST: db
      PAPERLESS_DBNAME: paperless
      PAPERLESS_DBUSER: paperless
      PAPERLESS_DBPASS: ${DB_PASSWORD}
      PAPERLESS_SECRET_KEY: ${SECRET_KEY}
      PAPERLESS_URL: http://localhost:8000
      PAPERLESS_OCR_LANGUAGE: eng
      # Auto-create admin user
      PAPERLESS_ADMIN_USER: admin
      PAPERLESS_ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      # Time zone
      PAPERLESS_TIME_ZONE: America/New_York
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    container_name: paperless_db
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: paperless
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    container_name: paperless_redis
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  db_data:
```

Create a `.env` file:

```bash
# .env file for Paperless-ngx
DB_PASSWORD=change-this-password
ADMIN_PASSWORD=change-this-admin-password
# Generate with: python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
SECRET_KEY=your-generated-secret-key
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/paperless && cd ~/paperless
   ```

2. **Generate a secret key:**
   ```bash
   python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
   ```

3. **Create the `docker-compose.yml` and `.env` files.**

4. **Start the containers:**
   ```bash
   docker compose up -d
   ```

5. **Access the web UI** at `http://your-server-ip:8000`

6. **Add your first document:** Drop a PDF, image, or scanned document into the `consume` folder, or use the web UI upload button. Paperless will OCR it, extract text, and suggest tags and correspondents.

## Configuration Tips

- **Consume folder:** Any file dropped into the `consume` folder is automatically imported, OCR'd, and filed. Set up your scanner to save directly to this folder.
- **Email consumption:** Configure Paperless to check an email inbox and automatically import attached documents.
- **Auto-tagging:** Paperless uses machine learning to automatically assign tags, document types, and correspondents based on content. Train it by manually tagging a few documents — it learns from your corrections.
- **Multi-language OCR:** Set `PAPERLESS_OCR_LANGUAGE=eng+deu+fra` for multiple languages.
- **Reverse proxy:** For remote access, put Paperless behind a reverse proxy and update `PAPERLESS_URL`. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** Use the built-in document exporter: `docker exec paperless document_exporter ../export/`. This creates a portable backup of all documents and metadata.
- **The `media` folder** contains your original documents and thumbnails. The `data` folder has Paperless configuration. Both should be backed up.

## Troubleshooting

- **OCR not working:** Check that `PAPERLESS_OCR_LANGUAGE` includes the language of your documents. Some languages require additional packages.
- **Consume folder not processing:** Check file permissions — the container needs read/write access to the consume folder.
- **Slow processing:** OCR is CPU-intensive. Large batch imports will take time. Consider adding more CPU resources.

## Alternatives

[Stirling-PDF](/apps/stirling-pdf/) is lighter and focused on PDF manipulation (merge, split, OCR) rather than document management. See our full [Best Self-Hosted Document Management](/best/document-management/) roundup.

## Verdict

Paperless-ngx is transformative. Going from a drawer of paper documents to a searchable digital archive is genuinely life-changing. Drop in a utility bill, find it instantly years later by searching for the amount or date. If you deal with any paper documents, this is essential.

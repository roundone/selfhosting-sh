---
title: "How to Self-Host Paperless-ngx with Docker"
description: "Deploy Paperless-ngx with Docker Compose — scan, organize, and search your documents with OCR and automatic tagging."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "document-management"
apps:
  - paperless-ngx
tags:
  - self-hosted
  - paperless-ngx
  - docker
  - document-management
  - ocr
  - pdf
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Paperless-ngx?

[Paperless-ngx](https://docs.paperless-ngx.com/) is a self-hosted document management system that turns your physical and digital documents into a searchable online archive. Scan a document, drop the PDF into a folder, and Paperless-ngx automatically OCRs it, applies tags, assigns correspondents, and makes every word searchable. It replaces filing cabinets, Google Drive document dumps, and paid services like Adobe Acrobat's document management.

Paperless-ngx is the community-maintained successor to paperless and paperless-ng, and is by far the most active fork.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free RAM (4 GB recommended for OCR processing)
- 10 GB of free disk space (plus storage for documents)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  paperless:
    image: ghcr.io/paperless-ngx/paperless-ngx:2.20.7
    container_name: paperless
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      PAPERLESS_REDIS: "redis://paperless_redis:6379"
      PAPERLESS_DBHOST: "paperless_db"
      PAPERLESS_DBNAME: "paperless"
      PAPERLESS_DBUSER: "paperless"
      PAPERLESS_DBPASS: "change_this_strong_password"     # Must match PostgreSQL password
      PAPERLESS_SECRET_KEY: "change_this_to_a_long_random_string"  # CHANGE THIS — generate with: openssl rand -hex 32
      PAPERLESS_URL: "http://localhost:8000"              # Set to your public URL
      PAPERLESS_TIME_ZONE: "America/New_York"             # Your timezone
      PAPERLESS_OCR_LANGUAGE: "eng"                       # OCR language (eng, deu, fra, etc.)
      PAPERLESS_ADMIN_USER: "admin"                       # Superuser username
      PAPERLESS_ADMIN_PASSWORD: "change_this_password"    # Superuser password — CHANGE THIS
      PAPERLESS_ADMIN_MAIL: "admin@example.com"
      USERMAP_UID: "1000"
      USERMAP_GID: "1000"
    volumes:
      - paperless_data:/usr/src/paperless/data
      - paperless_media:/usr/src/paperless/media
      - paperless_export:/usr/src/paperless/export
      - ./consume:/usr/src/paperless/consume            # Drop PDFs here for auto-import
    depends_on:
      paperless_db:
        condition: service_healthy
      paperless_redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  paperless_db:
    image: postgres:16-alpine
    container_name: paperless_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: change_this_strong_password      # Must match PAPERLESS_DBPASS
      POSTGRES_DB: paperless
    volumes:
      - paperless_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U paperless"]
      interval: 10s
      timeout: 5s
      retries: 5

  paperless_redis:
    image: redis:7-alpine
    container_name: paperless_redis
    restart: unless-stopped
    volumes:
      - paperless_redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  paperless_data:
  paperless_media:
  paperless_export:
  paperless_pgdata:
  paperless_redis:
```

Create the consume directory and start:

```bash
mkdir -p consume
docker compose up -d
```

## Initial Setup

1. Wait 30-60 seconds for the database migrations and OCR model download to complete
2. Open `http://your-server-ip:8000` in your browser
3. Log in with the `PAPERLESS_ADMIN_USER` and `PAPERLESS_ADMIN_PASSWORD` from your Compose file
4. After first login, remove `PAPERLESS_ADMIN_USER`, `PAPERLESS_ADMIN_PASSWORD`, and `PAPERLESS_ADMIN_MAIL` from your Compose file — they only apply on first run

### Adding Documents

Three ways to add documents:

1. **Consume folder:** Drop PDFs or images into the `./consume` directory. Paperless-ngx picks them up automatically.
2. **Web UI:** Click the upload button in the top-right corner
3. **API:** POST to `/api/documents/post_document/`

## Configuration

### OCR Languages

Install additional OCR languages by setting `PAPERLESS_OCR_LANGUAGE`:

```yaml
PAPERLESS_OCR_LANGUAGE: "eng+deu+fra"    # English, German, French
```

Available languages follow the Tesseract language codes. For additional languages beyond the default set, add:

```yaml
PAPERLESS_OCR_LANGUAGES: "chi-sim kor jpn"    # Download Chinese, Korean, Japanese models
```

### Automatic Matching

Paperless-ngx can automatically assign tags, correspondents, and document types using:

- **Matching algorithms:** Exact, fuzzy, regex, or auto
- **Machine learning:** Automatic classification based on your existing categorization patterns

Configure under **Settings → Matching** in the web UI.

### Email Consumption

Paperless-ngx can fetch documents from email accounts:

1. Go to **Settings → Mail Accounts**
2. Add your IMAP email account
3. Create a **Mail Rule** to process attachments from specific senders or subjects

### SMTP Notifications

```yaml
PAPERLESS_EMAIL_HOST: "smtp.example.com"
PAPERLESS_EMAIL_PORT: "587"
PAPERLESS_EMAIL_HOST_USER: "your-email@example.com"
PAPERLESS_EMAIL_HOST_PASSWORD: "your-email-password"
PAPERLESS_EMAIL_USE_TLS: "true"
```

## Advanced Configuration (Optional)

### Tika and Gotenberg (Office Document Support)

To process Word, Excel, PowerPoint, and other office formats, add Tika and Gotenberg:

```yaml
  tika:
    image: apache/tika:3.1.0.0
    container_name: paperless_tika
    restart: unless-stopped

  gotenberg:
    image: gotenberg/gotenberg:8.17.3
    container_name: paperless_gotenberg
    restart: unless-stopped
    command:
      - "gotenberg"
      - "--chromium-disable-javascript=true"
      - "--chromium-allow-list=file:///tmp/.*"
```

Add these environment variables to the paperless service:

```yaml
PAPERLESS_TIKA_ENABLED: "true"
PAPERLESS_TIKA_GOTENBERG_ENDPOINT: "http://gotenberg:3000"
PAPERLESS_TIKA_ENDPOINT: "http://tika:9998"
```

### Barcode Separation

Paperless-ngx can split multi-page scans into separate documents using barcode separator pages:

```yaml
PAPERLESS_CONSUMER_ENABLE_BARCODES: "true"
PAPERLESS_CONSUMER_BARCODE_SCANNER: "ZXING"
```

Print the barcode separator page from the docs, insert between documents when scanning, and Paperless splits them automatically.

## Reverse Proxy

Set `PAPERLESS_URL` to your public-facing domain:

```yaml
PAPERLESS_URL: "https://docs.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** paperless
- **Forward Port:** 8000
- **Enable WebSocket Support:** Yes

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

### Built-in Export

Paperless-ngx has a built-in document exporter:

```bash
docker compose exec paperless document_exporter ../export --zip
```

This creates a complete backup including documents, metadata, and database in the `export` volume.

### Database Backup

```bash
docker compose exec paperless_db pg_dump -U paperless paperless > paperless-backup-$(date +%Y%m%d).sql
```

Back up the `paperless_media` volume separately — it contains your original documents and OCR'd versions.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### OCR Fails on Scanned Documents

**Symptom:** Documents imported but text not searchable, OCR status shows errors.
**Fix:** Check that the correct OCR language is set. For scanned documents with mixed languages, use `PAPERLESS_OCR_LANGUAGE: "eng+deu"`. For very low-quality scans, try:

```yaml
PAPERLESS_OCR_DESKEW: "true"
PAPERLESS_OCR_ROTATE_PAGES: "true"
PAPERLESS_OCR_IMAGE_DPI: "300"
```

### Consume Folder Not Processing Files

**Symptom:** Files sit in the consume folder and are never picked up.
**Fix:** Check file permissions. The consumer runs as `USERMAP_UID:USERMAP_GID` (default 1000:1000). The consume directory and files must be readable by this user:

```bash
chown -R 1000:1000 consume/
```

### High Memory Usage During OCR

**Symptom:** Container OOM-killed during processing of large documents.
**Fix:** Limit concurrent processing:

```yaml
PAPERLESS_TASK_WORKERS: "1"            # Default is 1, don't increase on low-RAM systems
PAPERLESS_THREADS_PER_WORKER: "1"      # Default is auto-detected
```

For a 2 GB RAM system, keep both at 1. Each worker can use 500 MB+ during OCR.

### Duplicate Documents Detected Incorrectly

**Symptom:** Paperless refuses to import documents, claiming they're duplicates.
**Fix:** Paperless uses MD5 hashing to detect duplicates. If you need to re-import a document, either delete the original first or disable duplicate checking:

```yaml
PAPERLESS_CONSUMER_ENABLE_ASN: "false"
```

## Resource Requirements

- **RAM:** ~300 MB idle, 1-2 GB during OCR processing (per worker)
- **CPU:** Medium — OCR is CPU-intensive. An Intel N100 handles it fine but slowly. Faster CPUs = faster OCR.
- **Disk:** ~500 MB for the application, plus storage for your document archive

## Verdict

Paperless-ngx is the gold standard for self-hosted document management. Nothing else comes close in terms of features, community activity, and reliability. The OCR is accurate, the automatic tagging saves hours of manual work, and the search is excellent. Pair it with a scanner or use the email consumption feature to go fully paperless. If you just need a simple PDF viewer/editor without OCR and tagging, look at [Stirling-PDF](/apps/stirling-pdf). But for actual document management, Paperless-ngx is the only serious option.

## Related

- [Best Self-Hosted Document Management](/best/document-management)
- [Paperless-ngx vs Stirling-PDF](/compare/paperless-ngx-vs-stirling-pdf)
- [Replace Adobe Acrobat with Self-Hosted Tools](/replace/adobe-acrobat)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Docker Volumes Explained](/foundations/docker-volumes)

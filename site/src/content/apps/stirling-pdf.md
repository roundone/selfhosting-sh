---
title: "How to Self-Host Stirling-PDF with Docker"
description: "Deploy Stirling-PDF with Docker Compose — a self-hosted PDF toolkit for merging, splitting, converting, and editing PDFs."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "document-management"
apps:
  - stirling-pdf
tags:
  - self-hosted
  - stirling-pdf
  - docker
  - pdf
  - document-management
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Stirling-PDF?

[Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) is a self-hosted web-based PDF manipulation tool. It handles everything you'd use Adobe Acrobat for: merge, split, rotate, compress, convert, add watermarks, OCR, sign, and dozens more operations — all through a clean web UI. No documents leave your server. It replaces Adobe Acrobat, Smallpdf, ILovePDF, and similar online PDF tools.

Stirling-PDF processes everything locally — your documents are never sent to third-party servers.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (1 GB recommended for OCR features)
- 2 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  stirling-pdf:
    image: stirlingtools/stirling-pdf:2.5.2
    container_name: stirling-pdf
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DOCKER_ENABLE_SECURITY: "false"      # Set to "true" to enable login
      LANGS: "en_GB"                       # UI language
      SYSTEM_DEFAULTLOCALE: "en-US"
    volumes:
      - stirling_data:/usr/share/tessdata   # OCR language data
      - stirling_config:/configs            # Custom settings
      - stirling_logs:/logs                 # Application logs
      - stirling_pipeline:/pipeline         # Automated pipelines
      - stirling_custom:/customFiles        # Custom HTML/CSS
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/api/v1/info/status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  stirling_data:
  stirling_config:
  stirling_logs:
  stirling_pipeline:
  stirling_custom:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. Stirling-PDF is ready to use immediately — no account setup required (unless you enabled security)
3. The home page shows all available PDF operations organized by category

If you enabled `DOCKER_ENABLE_SECURITY: "true"`:
- Default credentials: `admin` / `stirling`
- Change the admin password immediately after first login

## Configuration

### Authentication

Enable user authentication for multi-user or public-facing deployments:

```yaml
environment:
  DOCKER_ENABLE_SECURITY: "true"
  SECURITY_ENABLELOGIN: "true"
  SECURITY_INITIALLOGIN_USERNAME: "admin"
  SECURITY_INITIALLOGIN_PASSWORD: "change_this_password"
```

### OCR Languages

Stirling-PDF uses Tesseract for OCR. Additional languages are downloaded on first use, or you can pre-install them:

```yaml
environment:
  INSTALL_BOOK_AND_ADVANCED_HTML_OPS: "true"    # Enables Calibre-based conversions
  LANGS: "en_GB"
```

### Custom Branding

Customize the application name and UI:

```yaml
environment:
  APP_NAME: "Our PDF Tools"
```

Mount custom files to `/customFiles` for HTML/CSS overrides.

## Advanced Configuration (Optional)

### Pipeline Automation

Stirling-PDF supports automated pipelines — predefined sequences of PDF operations:

1. Create pipeline configs in the `/pipeline` volume
2. Upload a PDF → select a pipeline → get the processed result

### API Usage

Stirling-PDF exposes a REST API at `/api/v1/`. Every web UI operation is available programmatically:

```bash
# Merge two PDFs
curl -X POST "http://localhost:8080/api/v1/general/merge-pdfs" \
  -F "fileInput=@file1.pdf" \
  -F "fileInput=@file2.pdf" \
  -o merged.pdf

# OCR a PDF
curl -X POST "http://localhost:8080/api/v1/misc/ocr-pdf" \
  -F "fileInput=@scan.pdf" \
  -F "languages=eng" \
  -o ocr-output.pdf
```

Full API docs are available at `http://your-server:8080/swagger-ui/index.html`.

## Reverse Proxy

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** stirling-pdf
- **Forward Port:** 8080

For large file uploads, increase the proxy timeout and max body size. In Nginx:

```nginx
client_max_body_size 100M;
proxy_read_timeout 300s;
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

Stirling-PDF is mostly stateless — it processes files on-demand. Back up the `stirling_config` volume if you've customized settings, and `stirling_pipeline` if you've created automated pipelines.

```bash
docker run --rm -v stirling_config:/data -v $(pwd):/backup alpine \
  tar czf /backup/stirling-config-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### OCR Produces Empty or Garbled Text

**Symptom:** OCR output has no recognizable text or garbage characters.
**Fix:** Ensure the correct language is specified. For scanned documents in non-English languages, select the appropriate Tesseract language in the OCR operation settings.

### Large File Uploads Fail

**Symptom:** Uploading PDFs over 10 MB fails with a timeout or error.
**Fix:** If behind a reverse proxy, increase `client_max_body_size` and proxy timeout. Stirling-PDF itself has no upload limit — the bottleneck is usually the proxy.

### Container Uses High Memory During Conversion

**Symptom:** Container OOM-killed during complex operations.
**Fix:** LibreOffice-based conversions (DOCX→PDF, etc.) are memory-intensive. Ensure at least 1 GB RAM is available. For OCR on large documents, 2 GB is safer.

## Resource Requirements

- **RAM:** ~150 MB idle, 512 MB-1 GB during OCR or conversion operations
- **CPU:** Low idle, medium during active processing
- **Disk:** ~800 MB for the application image, minimal data storage (files are processed and not retained)

## Verdict

Stirling-PDF is the best self-hosted PDF tool. It handles everything Adobe Acrobat does without sending your documents to the cloud. The web UI is intuitive, the API makes automation easy, and it's completely stateless — no database, no complex setup. It doesn't replace [Paperless-ngx](/apps/paperless-ngx) for document management and archival — Stirling-PDF is a tool, not an archive. Use both: Paperless-ngx for organizing and searching your documents, Stirling-PDF for manipulating them.

## Related

- [Best Self-Hosted Document Management](/best/document-management)
- [Paperless-ngx vs Stirling-PDF](/compare/paperless-ngx-vs-stirling-pdf)
- [How to Self-Host Paperless-ngx](/apps/paperless-ngx)
- [Replace Adobe Acrobat with Self-Hosted Tools](/replace/adobe-acrobat)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

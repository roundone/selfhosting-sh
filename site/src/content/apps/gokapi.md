---
title: "How to Self-Host Gokapi with Docker Compose"
description: "Deploy Gokapi with Docker Compose — a lightweight, self-hosted file sharing server with expiring downloads and AWS S3 support."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - gokapi
tags:
  - self-hosted
  - gokapi
  - docker
  - file-sharing
  - file-transfer
  - wetransfer-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Gokapi?

[Gokapi](https://github.com/Forceu/Gokapi) is a lightweight, self-hosted file sharing server written in Go. Upload files via the admin interface or API, share download links with configurable expiry (time-based and download-count-based), and optionally store files in S3-compatible storage. Gokapi is designed for single-admin use — one person uploads, anyone with the link downloads.

Gokapi fills the gap between [PicoShare](/apps/picoshare) (minimal, no encryption) and [Send](/apps/send) (encrypted, needs Redis). It adds S3 support, end-to-end encryption (optional), and a clean admin dashboard without requiring external dependencies beyond a single container.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM (minimum)
- Disk space for uploaded files (or S3 storage)
- A domain name (optional but recommended)

## Docker Compose Configuration

Create a directory for Gokapi:

```bash
mkdir -p ~/gokapi && cd ~/gokapi
```

Create a `docker-compose.yml` file:

```yaml
services:
  gokapi:
    image: f0rc3/gokapi:v1.9.6
    container_name: gokapi
    ports:
      - "127.0.0.1:53842:53842"
    volumes:
      - gokapi-data:/app/data
      - gokapi-config:/app/config
    restart: unless-stopped

volumes:
  gokapi-data:
  gokapi-config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:53842` in your browser.
2. The setup wizard runs on first launch:
   - Set your admin username and password
   - Choose the storage backend: **local** (default) or **S3/S3-compatible**
   - Set the server URL (your domain or IP)
   - Configure encryption (optional — enables end-to-end encryption for stored files)
3. Log in to the admin dashboard.
4. Upload your first file and configure its expiry settings.

## Configuration

### Upload Settings

When uploading a file through the admin UI, configure:

- **Downloads allowed:** Number of times the file can be downloaded before auto-deletion
- **Expiry days:** Number of days before the file expires
- **Password protection:** Optional password for the download link
- **Unlimited downloads:** Disable download count limit
- **No expiry:** File never expires automatically

### API Uploads

Gokapi provides an API for programmatic uploads. Get your API key from the admin dashboard under **API Keys**:

```bash
curl -X POST "https://your-domain.com/api/files/add" \
  -H "apikey: your-api-key" \
  -F "file=@document.pdf" \
  -F "allowedDownloads=10" \
  -F "expiryDays=7" \
  -F "password=optional-password"
```

### Hotlink Protection

Gokapi can generate hotlinks — direct URLs to the file content instead of the download page. Useful for embedding images or sharing direct download links.

## Advanced Configuration (Optional)

### S3 Storage Backend

Store files in any S3-compatible service (AWS S3, MinIO, Backblaze B2):

During the setup wizard, choose "AWS S3" as the storage backend and provide:

- **Bucket name**
- **Region**
- **Access key ID**
- **Secret access key**
- **Endpoint** (for non-AWS S3-compatible services like MinIO)

S3 storage is ideal for large file volumes or when you want files to persist independently of the Docker container.

### End-to-End Encryption

Gokapi supports optional end-to-end encryption for stored files. Enable during setup or in the admin settings:

- Files are encrypted before storage using AES-256
- Encryption keys are stored in the config volume
- Encrypted files cannot be read from the filesystem or S3 bucket directly

### OAuth2/OIDC Authentication

Gokapi supports OAuth2 and OIDC for admin authentication, integrating with Authentik, Keycloak, or other identity providers. Configure during setup or in `config.json`.

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained)):

```
share.example.com {
    reverse_proxy localhost:53842
}
```

Update the server URL in Gokapi's admin settings to match your domain after setting up the reverse proxy.

## Backup

Back up these volumes:

- **gokapi-config** — Configuration, encryption keys, database
- **gokapi-data** — Uploaded files (skip if using S3)

```bash
# Backup both volumes
for vol in gokapi-config gokapi-data; do
  docker run --rm -v ${vol}:/data -v $(pwd):/backup alpine \
    tar czf /backup/${vol}-$(date +%Y%m%d).tar.gz /data
done
```

**Important:** If using encryption, the config volume contains the encryption keys. Losing the config volume means losing access to encrypted files — even if the data volume or S3 bucket is intact.

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Setup wizard keeps reappearing

**Symptom:** Every restart shows the setup wizard instead of the login page.
**Fix:** Ensure the `gokapi-config` volume persists. Check `docker volume ls | grep gokapi-config`. If missing, the config was lost — run setup again.

### S3 upload fails

**Symptom:** File uploads fail with S3-related errors.
**Fix:** Verify your S3 credentials and bucket permissions. The bucket must allow `PutObject`, `GetObject`, and `DeleteObject`. For MinIO, ensure the endpoint URL includes the port.

### Files not auto-deleting

**Symptom:** Expired files remain accessible.
**Fix:** Gokapi checks expiry on access, not on a schedule. Files are deleted when someone attempts to download them after expiry, or during periodic cleanup. This is by design.

### Large file upload timeout

**Symptom:** Files over 1 GB fail to upload.
**Fix:** Check reverse proxy timeouts and upload size limits. For Nginx: `client_max_body_size 0;` and `proxy_read_timeout 600;`. Caddy has no default limits.

## Resource Requirements

- **RAM:** ~30-50 MB idle
- **CPU:** Low
- **Disk:** ~20 MB for the application, plus storage for uploaded files

## Verdict

Gokapi is the best middle-ground file sharing tool. It's more capable than [PicoShare](/apps/picoshare) (adds S3 support, encryption, API, password protection) without the complexity of [Send](/apps/send) (no Redis required). The admin dashboard is clean, the API is straightforward, and S3 storage support is a significant advantage for large-volume use.

If you need end-to-end encryption with zero-knowledge design, use [Send](/apps/send). If you want absolute minimalism, use [PicoShare](/apps/picoshare). Gokapi sits between them and handles most file sharing needs elegantly.

## Frequently Asked Questions

### Is Gokapi multi-user?
No. Gokapi is designed for single-admin use. One person manages uploads; anyone with a link can download.

### Can I use Gokapi with ShareX?
Yes, via the API. Configure ShareX's custom uploader to POST to `/api/files/add` with your API key header.

### Does Gokapi support chunked uploads?
Not natively through the web UI. The API handles large files in a single request. For very large files, use S3 storage to avoid upload timeouts.

## Related

- [How to Self-Host PicoShare](/apps/picoshare)
- [How to Self-Host Send](/apps/send)
- [Send vs WeTransfer](/compare/send-vs-wetransfer)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer)
- [Self-Hosted Alternatives to Dropbox Transfer](/replace/dropbox-transfer)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [Docker Compose Basics](/foundations/docker-compose-basics)

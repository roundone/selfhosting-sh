---
title: "How to Self-Host MinIO with Docker Compose"
description: "Deploy MinIO for S3-compatible object storage with Docker Compose. Includes setup, configuration, and migration advice."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sync"
apps:
  - minio
tags:
  - self-hosted
  - minio
  - s3
  - object-storage
  - docker
  - file-sync-storage
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is MinIO?

[MinIO](https://min.io/) is a high-performance, S3-compatible object storage server. It provides the same API as Amazon S3, which means any tool, library, or application that works with S3 works with MinIO — backups, media storage, application data, container registry storage, you name it. MinIO was the go-to self-hosted object storage for years.

**Important: MinIO's GitHub repository was archived in February 2026.** Official Docker images were discontinued in October 2025. The software still works, but there are no new releases, security patches, or community support. For new deployments, strongly consider [Garage](/apps/garage) instead. This guide covers MinIO for existing users and those who need specific MinIO compatibility.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM (minimum)
- Disk space proportional to your storage needs
- A domain name (optional, for remote access)

## Docker Compose Configuration

Since official MinIO Docker images are no longer published, this guide uses the Bitnami-maintained image, which is the most widely available community alternative. The last available version is from mid-2025.

Create a `docker-compose.yml` file:

```yaml
services:
  minio:
    image: bitnami/minio:2025.4.22
    container_name: minio
    restart: unless-stopped
    ports:
      - "9000:9000"   # S3 API endpoint
      - "9001:9001"   # Web console
    environment:
      # Root credentials — change these before first start
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=changeme-strong-password-here
      # Server URL — set to your domain or IP for proper console redirects
      - MINIO_SERVER_URL=http://localhost:9000
      - MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
      # Optional: create default buckets on first start (comma-separated)
      - MINIO_DEFAULT_BUCKETS=backups,media
      # Optional: region for S3 compatibility
      - MINIO_REGION_NAME=us-east-1
    volumes:
      - minio-data:/bitnami/minio/data  # Object storage data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - minio

networks:
  minio:
    driver: bridge

volumes:
  minio-data:
```

Create a `.env` file alongside it:

```bash
# MinIO root credentials — S3 access key and secret key
# MUST be changed before first start. Password minimum 8 characters.
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=changeme-strong-password-here
```

If you prefer the original MinIO image (for existing deployments that already have it pulled), the configuration differs slightly:

```yaml
services:
  minio:
    image: minio/minio:RELEASE.2025-04-22T22-12-26Z
    container_name: minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"   # S3 API endpoint
      - "9001:9001"   # Web console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=changeme-strong-password-here
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - minio

networks:
  minio:
    driver: bridge

volumes:
  minio-data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open the MinIO Console at `http://your-server:9001`
2. Log in with your `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
3. Create buckets for your use cases (backups, media, application data)
4. Create access keys for applications:
   - Go to **Access Keys** in the sidebar
   - Click **Create Access Key**
   - Save the Access Key and Secret Key — these are your S3 credentials for applications

Never use root credentials in applications. Always create dedicated access keys with appropriate policies.

## Configuration

### Access Policies

MinIO supports fine-grained access control. Create policies that limit access keys to specific buckets:

1. Go to **Policies** in the console
2. Create a new policy using AWS IAM policy syntax:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::backups",
        "arn:aws:s3:::backups/*"
      ]
    }
  ]
}
```

3. Attach the policy when creating access keys.

### Bucket Versioning

Enable versioning on a bucket to keep previous versions of objects:

```bash
docker compose exec minio mc version enable local/backups
```

This is useful for backup buckets where you want protection against accidental overwrites.

### Lifecycle Rules

Automatically expire old objects:

```bash
docker compose exec minio mc ilm rule add --expire-days 90 local/backups
```

### TLS/HTTPS

For production use, put MinIO behind a reverse proxy with TLS. Update the environment variables:

```yaml
environment:
  - MINIO_SERVER_URL=https://s3.yourdomain.com
  - MINIO_BROWSER_REDIRECT_URL=https://console.yourdomain.com
```

## Reverse Proxy

MinIO needs two endpoints: the S3 API (port 9000) and the web console (port 9001). Configure your reverse proxy to handle both.

For Nginx Proxy Manager, create two proxy hosts:
- `s3.yourdomain.com` → `minio:9000`
- `console.yourdomain.com` → `minio:9001`

Enable WebSocket support for the console. For general reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

MinIO stores all data in its data volume. Back up the volume:

```bash
docker compose stop minio
# Back up the volume
docker run --rm -v minio-data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .
docker compose start minio
```

For live backups, use MinIO Client (`mc`) to mirror to another location:

```bash
docker compose exec minio mc mirror local/backups /tmp/backup-export/
```

For your broader backup strategy, see [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Console Not Loading

**Symptom:** S3 API works on port 9000 but console on port 9001 shows a blank page or connection refused.

**Fix:** Ensure the `--console-address ":9001"` flag is set in the command (for the official image). For the Bitnami image, port 9001 is configured automatically. Also verify your `MINIO_BROWSER_REDIRECT_URL` matches how you're accessing the console.

### Access Denied Errors

**Symptom:** S3 clients get `AccessDenied` when trying to read or write objects.

**Fix:** Verify the access key has a policy attached that grants the required permissions on the target bucket. Root credentials work everywhere — if root works but access keys don't, it's a policy issue.

### High Memory Usage

**Symptom:** MinIO consumes more RAM than expected.

**Fix:** MinIO uses memory for caching and erasure coding calculations. For single-node deployments, set limits in Docker Compose:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
```

### Bucket Not Found After Restart

**Symptom:** Buckets disappear after container restart.

**Fix:** Verify your volume mount is correct. For the Bitnami image, data goes to `/bitnami/minio/data`. For the official image, data goes to `/data`. Mixing these up means data is written to the container filesystem instead of the volume.

### Cannot Pull Image

**Symptom:** `docker pull minio/minio` fails because the image no longer exists on Docker Hub.

**Fix:** Switch to `bitnami/minio:2025.4.22` or build from source. If you already have the official image cached locally, it still works — but won't receive updates.

## Resource Requirements

- **RAM:** 512 MB minimum, 1+ GB recommended for active workloads
- **CPU:** Low for single-user; scales with concurrent S3 operations
- **Disk:** Depends entirely on stored data. MinIO itself uses <500 MB.
- **Network:** S3 API on port 9000, Console on port 9001

## Verdict

MinIO was the best self-hosted S3-compatible storage for years, and it still works. But with the project archived and no security patches coming, recommending it for new deployments is difficult.

**If you have an existing MinIO deployment:** It continues to work. No rush to migrate, but start planning a transition to [Garage](/apps/garage) or SeaweedFS before a security vulnerability surfaces that won't get patched.

**If you're starting fresh:** Use [Garage](/apps/garage). It's actively maintained, lighter on resources, and designed for self-hosted deployments. If you need near-complete S3 API compatibility for a specific tool, test against Garage first — it covers the most common operations.

**If you specifically need MinIO:** The Bitnami image (`bitnami/minio:2025.4.22`) works today. Pin to that version and accept the risk of running unmaintained software.

## Frequently Asked Questions

### Is MinIO still safe to use?

The software itself works, but no security patches are being published. For internal/home lab use where the instance isn't exposed to the internet, the risk is manageable. For production or internet-facing deployments, migrate to an actively maintained alternative.

### What's the best MinIO replacement?

[Garage](/apps/garage) for most self-hosted use cases. It's lightweight, S3-compatible, actively maintained, and designed for small to medium deployments. SeaweedFS is another option for larger-scale needs.

### Can I migrate my data from MinIO to Garage?

Yes. Use `mc mirror` to export all objects from MinIO, then use any S3-compatible client to import them into Garage. Both speak the S3 API, so tools like `rclone` work with either.

### Why was MinIO archived?

MinIO shifted focus to its commercial enterprise product and stopped supporting the open-source community edition. Docker images were pulled from registries in October 2025, and the GitHub repository was archived in February 2026.

## Related

- [MinIO vs Garage](/compare/minio-vs-garage)
- [Best Self-Hosted File Sync Solutions](/best/file-sync)
- [How to Self-Host Nextcloud](/apps/nextcloud)
- [How to Self-Host Seafile](/apps/seafile)
- [Self-Hosted Google Drive Alternatives](/replace/google-drive)
- [Self-Hosted Dropbox Alternatives](/replace/dropbox)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)

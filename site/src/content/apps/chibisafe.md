---
title: "How to Self-Host ChibiSafe with Docker Compose"
description: "Deploy ChibiSafe with Docker Compose — a modern, self-hosted file upload service with gallery, albums, and ShareX integration."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - chibisafe
tags:
  - self-hosted
  - chibisafe
  - docker
  - file-sharing
  - image-hosting
  - sharex
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ChibiSafe?

[ChibiSafe](https://github.com/chibisafe/chibisafe) is a modern, self-hosted file upload service (formerly known as lolisafe/safe.fiery.me). Upload files through the web UI, ShareX, or the API, organize them into albums, and share links. It features a polished Next.js frontend, user management, album sharing, and file tagging.

ChibiSafe focuses on the media gallery experience — clean thumbnails, album organization, and shareable galleries. It's more opinionated than [Zipline](/apps/zipline/) about presentation and less focused on URL shortening or paste bin features.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free RAM (minimum)
- Disk space for uploaded files
- A domain name (recommended)

## Docker Compose Configuration

Create a directory for ChibiSafe:

```bash
mkdir -p ~/chibisafe && cd ~/chibisafe
```

Create a `docker-compose.yml` file:

```yaml
services:
  chibisafe:
    image: chibisafe/chibisafe:v6.5.1
    container_name: chibisafe
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      # Base URL for the instance
      BASE_API_URL: http://chibisafe:8000
    volumes:
      - chibisafe-uploads:/home/node/chibisafe/uploads
      - chibisafe-database:/home/node/chibisafe/database
      - chibisafe-logs:/home/node/chibisafe/logs
    restart: unless-stopped

volumes:
  chibisafe-uploads:
  chibisafe-database:
  chibisafe-logs:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8000` in your browser.
2. Log in with the default admin credentials:
   - **Username:** admin
   - **Password:** admin
3. **Change the admin password immediately** in the dashboard settings.
4. Configure your instance settings:
   - Set the site name and description
   - Configure file size limits
   - Set allowed file types (or allow all)
5. Create additional user accounts if needed.

## Configuration

### Dashboard Settings

From the admin dashboard, configure:

- **Service name:** Custom name shown in the UI and embed metadata
- **Max file size:** Per-upload size limit
- **Chunk size:** For chunked uploads of large files
- **Allowed extensions:** Whitelist specific file types or allow all
- **User registration:** Enable or disable public registration
- **Default storage quota:** Per-user storage limit

### ShareX Integration

1. In ChibiSafe, go to your profile settings
2. Copy your API key
3. In ShareX → **Destinations** → **Custom Uploader Settings**:
   - **Request URL:** `https://your-domain.com/api/upload`
   - **Method:** POST
   - **Headers:** `x-api-key: your-api-key`
   - **Body:** Form data, file field name: `file`
   - **URL:** `$json:url$`

### Albums

Organize uploads into shareable albums:

1. Go to **Albums** → **Create Album**
2. Name the album and optionally set it as public
3. Add files by selecting them in the gallery and choosing the album
4. Share the album link — recipients see a gallery view

### User Management

ChibiSafe supports multi-user with role-based access:

- **Admin:** Full access, manage settings and users
- **User:** Upload files, manage own albums and files
- Each user has their own gallery, storage quota, and API key

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained/)):

```
files.example.com {
    reverse_proxy localhost:8000
}
```

For large file uploads with Nginx:

```nginx
client_max_body_size 500m;
proxy_read_timeout 300;
```

## Backup

Back up these volumes:

- **chibisafe-database** — SQLite database with user accounts, file metadata, and album info
- **chibisafe-uploads** — All uploaded files
- **chibisafe-logs** — Application logs (optional)

```bash
# Full backup
for vol in chibisafe-database chibisafe-uploads; do
  docker run --rm -v ${vol}:/data -v $(pwd):/backup alpine \
    tar czf /backup/${vol}-$(date +%Y%m%d).tar.gz /data
done
```

See [Backup Strategy](/foundations/backup-strategy/) for a complete approach.

## Troubleshooting

### Default login doesn't work

**Symptom:** admin/admin credentials are rejected.
**Fix:** If this isn't a fresh installation, the password was likely changed previously. Delete the database volume and restart for a fresh setup: `docker compose down && docker volume rm chibisafe-database && docker compose up -d`.

### Upload fails with large files

**Symptom:** Files over 100 MB fail to upload.
**Fix:** ChibiSafe uses chunked uploads for large files. Check that your reverse proxy allows the configured chunk size and doesn't timeout during upload. Increase Nginx `proxy_read_timeout` and `client_max_body_size`.

### Thumbnails not generating

**Symptom:** Gallery shows placeholder icons instead of thumbnails.
**Fix:** ChibiSafe generates thumbnails for images and videos. Ensure the container has enough RAM (1 GB minimum). Check container logs: `docker compose logs chibisafe`.

### CORS errors with API

**Symptom:** ShareX or custom integrations get CORS errors.
**Fix:** When accessing the API through a different domain than the web UI, CORS headers may be needed. Set `BASE_API_URL` to match your public domain.

## Resource Requirements

- **RAM:** ~100-200 MB idle, more during thumbnail generation
- **CPU:** Low-Medium (thumbnail generation for images/videos)
- **Disk:** ~150 MB for the application, plus storage for uploads

## Verdict

ChibiSafe offers the best gallery and album experience among self-hosted upload servers. If you want organized media collections with shareable album links, ChibiSafe does it well. The multi-user support and clean UI make it a good choice for teams or family use.

For raw feature count (URL shortener, paste bin, S3 support, embed metadata), [Zipline](/apps/zipline/) is more capable. For minimal file sharing without gallery features, [PicoShare](/apps/picoshare/) or [Gokapi](/apps/gokapi/) are lighter alternatives.

## Frequently Asked Questions

### Does ChibiSafe support S3 storage?
ChibiSafe v6 stores files locally. S3 support is not built-in. For S3 storage, use [Zipline](/apps/zipline/).

### Can I migrate from lolisafe?
ChibiSafe is the successor to lolisafe. Database migrations exist for upgrading from older versions — check the GitHub repo for migration guides.

### Does ChibiSafe work with Flameshot?
Yes, via the API. Configure Flameshot to POST to the upload endpoint with your API key header, similar to the ShareX integration.

## Related

- [Zipline vs XBackBone](/compare/zipline-vs-xbackbone/)
- [How to Self-Host Zipline](/apps/zipline/)
- [How to Self-Host XBackBone](/apps/xbackbone/)
- [Self-Hosted Alternatives to ShareX Server](/replace/sharex-server/)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

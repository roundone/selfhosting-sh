---
title: "How to Self-Host ownCloud oCIS with Docker"
description: "Deploy ownCloud Infinite Scale with Docker Compose. Single container, no database required, fast file sync with Spaces."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync-storage"
apps:
  - owncloud
tags:
  - self-hosted
  - file-sync
  - owncloud
  - ocis
  - docker
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ownCloud oCIS?

[ownCloud Infinite Scale (oCIS)](https://owncloud.com) is a complete rewrite of ownCloud in Go with a microservices architecture. Unlike the legacy PHP-based ownCloud 10 (now in maintenance mode), oCIS runs as a **single binary** with no external database required — metadata is stored in the filesystem. It's lighter, faster, and simpler to deploy than both its predecessor and [Nextcloud](/apps/nextcloud).

oCIS replaces Google Drive, Dropbox, and OneDrive with self-hosted file sync, sharing, Spaces (project-based collaboration), a modern web UI, and desktop/mobile sync clients. It includes a built-in identity provider and OIDC support.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB RAM minimum (4 GB recommended for production)
- 5 GB free disk space (plus storage for user files)
- A domain name (required — oCIS serves HTTPS by default)

## Docker Compose Configuration

oCIS is one of the simplest self-hosted apps to deploy — a single container with no database, no cache, no companion services.

Create a `docker-compose.yml` file:

```yaml
services:
  ocis:
    image: owncloud/ocis:7.1.3
    container_name: ocis
    restart: unless-stopped
    entrypoint: /bin/sh
    command: ["-c", "ocis init || true; ocis server"]
    environment:
      OCIS_URL: "https://cloud.example.com"          # Your public URL — MUST match exactly
      OCIS_LOG_LEVEL: "error"                         # Options: error, warn, info, debug
      PROXY_TLS: "false"                              # Disable TLS — reverse proxy handles it
      OCIS_INSECURE: "false"                          # Set true only for local testing
      IDM_ADMIN_PASSWORD: "change-this-password"      # CHANGE THIS — admin account password
      IDM_CREATE_DEMO_USERS: "false"                  # Demo users have known passwords — keep false
      PROXY_HTTP_ADDR: "0.0.0.0:9200"                 # Listen address
    volumes:
      - ocis-config:/etc/ocis                         # Configuration and secrets
      - ocis-data:/var/lib/ocis                       # User files and metadata
    ports:
      - "9200:9200"                                   # Web UI and API

volumes:
  ocis-config:
  ocis-data:
```

The `entrypoint` and `command` pattern handles first-run initialization automatically. `ocis init` generates configuration files with random secrets on first boot. On subsequent starts, it fails harmlessly (already initialized) and proceeds to `ocis server`.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait 10-15 seconds for initialization to complete
2. Open `https://cloud.example.com` (or `https://localhost:9200` for local testing with `OCIS_INSECURE: "true"`)
3. Log in with username `admin` and the password you set in `IDM_ADMIN_PASSWORD`
4. The web UI loads — you can immediately upload files, create folders, and manage shares

### Creating Users

oCIS includes a built-in identity manager (IDM):

1. Click the user menu (top-right) → **Administration settings**
2. Go to **Users** → **Create user**
3. Set username, display name, email, and password
4. Assign the user a role: Admin, Space Admin, or User

### Spaces

Spaces are project-based collaboration areas — a major feature that differentiates oCIS from Nextcloud:

1. In the left sidebar, click **Spaces**
2. Click **New Space** — give it a name and description
3. Add members with roles: Manager, Editor, or Viewer
4. Each Space has its own quota, members, and file structure

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCIS_URL` | — | Public URL (must match reverse proxy) |
| `PROXY_TLS` | `true` | Set `false` when behind a reverse proxy |
| `OCIS_INSECURE` | `false` | Allow self-signed certs (testing only) |
| `IDM_ADMIN_PASSWORD` | random | Admin password (set in env, overrides config) |
| `IDM_CREATE_DEMO_USERS` | `false` | Create demo users (Marie, Richard, etc.) |
| `OCIS_LOG_LEVEL` | `error` | Logging verbosity |
| `PROXY_HTTP_ADDR` | `0.0.0.0:9200` | Listen address and port |
| `PROXY_ENABLE_BASIC_AUTH` | `false` | Enable HTTP Basic Auth (for WebDAV clients) |

### File Quotas

Set per-user or per-Space quotas through the admin UI or environment variables:

```yaml
environment:
  FRONTEND_MAX_QUOTA: "10737418240"  # 10 GB max per user (in bytes)
```

### External Identity Provider

For enterprise deployments, replace the built-in IDP with Keycloak or another OIDC provider:

```yaml
environment:
  PROXY_OIDC_ISSUER: "https://keycloak.example.com/realms/ocis"
  PROXY_OIDC_CLIENT_ID: "ocis"
  IDM_CREATE_DEMO_USERS: "false"
  PROXY_AUTOPROVISION_ACCOUNTS: "true"
```

This disables the built-in IDP and delegates authentication to your external provider.

## Advanced Configuration

### Collaborative Editing

oCIS supports Collabora Online and OnlyOffice for document editing:

```yaml
services:
  collabora:
    image: collabora/code:24.04.13.2.1
    container_name: collabora
    restart: unless-stopped
    cap_add:
      - MKNOD
    environment:
      aliasgroup1: "https://cloud.example.com:443"
      extra_params: "--o:ssl.enable=false --o:ssl.termination=true"
    ports:
      - "9980:9980"
```

Then enable the collaboration app in oCIS by adding:

```yaml
environment:
  COLLABORATION_GRPC_ADDR: "0.0.0.0:9301"
  COLLABORATION_HTTP_ADDR: "0.0.0.0:9300"
  COLLABORATION_WOPI_SRC: "https://cloud.example.com"
  COLLABORATION_CS3API_DATAGATEWAY_INSECURE: "true"
```

### S3 Storage Backend

oCIS can store files on S3-compatible storage instead of the local filesystem:

```yaml
environment:
  STORAGE_USERS_DRIVER: "s3ng"
  STORAGE_USERS_S3NG_ENDPOINT: "https://s3.example.com"
  STORAGE_USERS_S3NG_BUCKET: "ocis-data"
  STORAGE_USERS_S3NG_ACCESS_KEY: "your-access-key"
  STORAGE_USERS_S3NG_SECRET_KEY: "your-secret-key"
```

## Reverse Proxy

oCIS runs on port 9200 by default. Put it behind a reverse proxy for HTTPS. Set `PROXY_TLS: "false"` in the Docker environment to let the reverse proxy handle TLS.

**Nginx configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name cloud.example.com;

    ssl_certificate /etc/letsencrypt/live/cloud.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloud.example.com/privkey.pem;

    client_max_body_size 0;

    location / {
        proxy_pass http://127.0.0.1:9200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

**Critical:** `OCIS_URL` must exactly match the URL users access (including protocol and port). Mismatches cause authentication failures and redirect loops.

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained) guide for Nginx Proxy Manager or Traefik configuration.

## Backup

Back up these two volumes:

- **ocis-config** (`/etc/ocis`) — configuration files, OIDC secrets, signing keys
- **ocis-data** (`/var/lib/ocis`) — all user files, metadata, Spaces data

```bash
# Stop for consistent backup
docker compose stop

# Back up volumes
docker run --rm -v ocis_ocis-config:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/ocis-config.tar.gz -C /data .

docker run --rm -v ocis_ocis-data:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/ocis-data.tar.gz -C /data .

# Restart
docker compose up -d
```

**Critical:** The config volume contains cryptographic secrets generated during `ocis init`. Without it, you cannot decrypt user data or restore sessions.

## Troubleshooting

### "Invalid or expired token" After Login

**Symptom:** Login succeeds but immediately shows an authentication error.
**Fix:** `OCIS_URL` must exactly match the URL in your browser — including `https://`, the correct domain, and port. Mismatches between the configured URL and the actual access URL break OIDC token validation.

### Upload Fails for Large Files

**Symptom:** Uploads hang or fail for files over a few hundred MB.
**Fix:** If using a reverse proxy, increase the client body size limit. In Nginx: `client_max_body_size 0;` (unlimited). In Traefik, increase the buffering middleware limit.

### Container Exits with "config already exists"

**Symptom:** Container restarts repeatedly with init errors.
**Fix:** The `ocis init || true` pattern in the entrypoint should handle this. If you see repeated errors, check that the config volume is properly mounted. `ocis init` fails when `/etc/ocis/ocis.yaml` already exists — this is expected and handled by `|| true`.

### WebDAV Clients Can't Connect

**Symptom:** Desktop sync clients or WebDAV apps fail to authenticate.
**Fix:** Enable HTTP Basic Auth: `PROXY_ENABLE_BASIC_AUTH: "true"`. Some WebDAV clients don't support OIDC and need Basic Auth as a fallback.

### Permission Denied Errors

**Symptom:** Container can't write to volume mounts.
**Fix:** The container runs as root by default (required for binding to privileged ports in some setups). If running as a non-root user (`user: 1000:1000`), ensure the mounted directories are owned by that UID/GID: `chown -R 1000:1000 /path/to/ocis-config /path/to/ocis-data`.

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB - 1 GB under active use
- **CPU:** Low — Go binary, no PHP/database overhead
- **Disk:** 1 GB for application, plus storage for user files
- **Startup time:** Fast — compiled binary starts in seconds

oCIS uses significantly fewer resources than Nextcloud (which requires PHP, PostgreSQL, Redis, and cron).

## Verdict

ownCloud oCIS is the **lightest and simplest** self-hosted file sync platform to deploy. One container, no database, fast startup, low resource usage. Spaces are a genuinely useful feature for team collaboration that Nextcloud doesn't natively offer.

However, oCIS is still catching up to Nextcloud in feature breadth. There's no calendar (CalDAV), no contacts (CardDAV), no video calling, and the app ecosystem is minimal compared to Nextcloud's 400+ apps. If you want a focused, fast file sync platform, oCIS is excellent. If you want a full Google Workspace replacement, [Nextcloud](/apps/nextcloud) is the better choice.

The legacy PHP-based ownCloud 10 should not be considered for new deployments — it's in maintenance mode with no future development. If choosing ownCloud, use oCIS.

## FAQ

### How does oCIS compare to Nextcloud?

oCIS is faster, lighter, and simpler to deploy. Nextcloud has far more features (calendar, contacts, mail, 400+ apps). For file sync only, oCIS wins on performance. For a full productivity platform, Nextcloud wins on features. See our [Nextcloud vs ownCloud](/compare/nextcloud-vs-owncloud) comparison.

### Can I migrate from ownCloud 10 to oCIS?

ownCloud provides migration documentation, but it's non-trivial. oCIS uses a completely different data storage format. Plan for a fresh deployment with manual data migration.

### Does oCIS support CalDAV/CardDAV?

No. oCIS focuses on file sync and sharing. For calendar and contacts, use [Nextcloud](/apps/nextcloud) or a dedicated CalDAV server like [Radicale](/apps/radicale).

### Is oCIS production-ready?

Yes, for file sync. ownCloud GmbH uses oCIS in their commercial offerings. The core file sync, sharing, and Spaces features are stable. Advanced integrations (Collabora, LDAP, external IDP) require more careful configuration.

### Can I use oCIS with my existing LDAP/AD?

Yes. oCIS supports LDAP and Active Directory for user management. Configure the LDAP proxy with `LDAP_URI`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, and related environment variables.

## Related

- [Nextcloud vs ownCloud](/compare/nextcloud-vs-owncloud)
- [How to Self-Host Nextcloud](/apps/nextcloud)
- [How to Self-Host Seafile](/apps/seafile)
- [How to Self-Host Syncthing](/apps/syncthing)
- [Nextcloud vs Seafile](/compare/nextcloud-vs-seafile)
- [Self-Hosted Alternatives to Google Drive](/replace/google-drive)
- [Self-Hosted Alternatives to Dropbox](/replace/dropbox)
- [Best Self-Hosted File Sync Solutions](/best/file-sync)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

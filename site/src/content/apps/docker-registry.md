---
title: "Self-Host a Docker Registry with Docker Compose"
description: "Deploy a private Docker Registry v3 with Docker Compose for storing and distributing container images on your own infrastructure."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - docker-registry
tags:
  - docker
  - registry
  - containers
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docker Registry?

Docker Registry is the official open-source container image registry from the CNCF Distribution project. It lets you store, distribute, and manage Docker images on your own infrastructure instead of relying on Docker Hub. Self-hosting a registry gives you full control over image storage, eliminates pull rate limits, and keeps proprietary images off third-party servers. [Official site](https://distribution.github.io/distribution/).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 10 GB+ of free disk space (depends on image count)
- 512 MB+ RAM
- A domain name (required for TLS in production)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  registry:
    image: registry:3.0.0
    container_name: registry
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      REGISTRY_HTTP_ADDR: "0.0.0.0:5000"
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
      REGISTRY_HTTP_HEADERS_X-Content-Type-Options: "[nosniff]"
      OTEL_TRACES_EXPORTER: "none"
    volumes:
      - registry-data:/var/lib/registry
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5000/v2/"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  registry-data:
```

### Production Setup with TLS and Authentication

For production use, add TLS certificates and basic auth:

```yaml
services:
  registry:
    image: registry:3.0.0
    container_name: registry
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      REGISTRY_HTTP_ADDR: "0.0.0.0:5000"
      REGISTRY_HTTP_TLS_CERTIFICATE: "/certs/fullchain.pem"
      REGISTRY_HTTP_TLS_KEY: "/certs/privkey.pem"
      REGISTRY_AUTH: "htpasswd"
      REGISTRY_AUTH_HTPASSWD_REALM: "Registry Realm"
      REGISTRY_AUTH_HTPASSWD_PATH: "/auth/htpasswd"
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
      REGISTRY_HTTP_HEADERS_X-Content-Type-Options: "[nosniff]"
      OTEL_TRACES_EXPORTER: "none"
    volumes:
      - registry-data:/var/lib/registry
      - ./certs:/certs:ro
      - ./auth:/auth:ro
    healthcheck:
      test: ["CMD", "wget", "--no-check-certificate", "--spider", "-q", "https://localhost:5000/v2/"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  registry-data:
```

Generate the htpasswd file before starting:

```bash
mkdir -p auth certs
# Install htpasswd utility
apt-get install -y apache2-utils
# Create credentials (replace username/password)
htpasswd -Bbn myuser MyStr0ngP@ssw0rd > auth/htpasswd
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

After starting the registry, verify it's running:

```bash
curl http://localhost:5000/v2/
```

You should see `{}` as the response. If using authentication:

```bash
curl -u myuser:MyStr0ngP@ssw0rd http://localhost:5000/v2/
```

### Push Your First Image

Tag and push an image to your registry:

```bash
# Tag an existing image
docker tag nginx:latest localhost:5000/my-nginx:1.0

# Push to your registry
docker push localhost:5000/my-nginx:1.0

# Pull it back
docker pull localhost:5000/my-nginx:1.0
```

### List Repositories

```bash
curl http://localhost:5000/v2/_catalog
```

## Configuration

The registry is configured entirely through environment variables. Every config key maps to an env var with the `REGISTRY_` prefix, using underscores for nesting.

Key configuration options:

| Environment Variable | Default | Purpose |
|---------------------|---------|---------|
| `REGISTRY_HTTP_ADDR` | `0.0.0.0:5000` | Listen address and port |
| `REGISTRY_STORAGE_DELETE_ENABLED` | `false` | Allow image deletion via API |
| `REGISTRY_STORAGE_CACHE_BLOBDESCRIPTOR` | `inmemory` | Layer cache backend |
| `REGISTRY_HTTP_TLS_CERTIFICATE` | — | Path to TLS certificate |
| `REGISTRY_HTTP_TLS_KEY` | — | Path to TLS private key |
| `REGISTRY_AUTH` | — | Authentication backend (`htpasswd`) |
| `REGISTRY_PROXY_REMOTEURL` | — | Enable pull-through cache mode |

### Storage Backends

The default filesystem storage works for most self-hosted setups. For larger deployments, the registry also supports S3-compatible storage (MinIO, Garage), Azure Blob, and Google Cloud Storage — configured via environment variables.

## Advanced Configuration (Optional)

### Pull-Through Cache

Run the registry as a caching proxy for Docker Hub to reduce bandwidth and avoid rate limits:

```yaml
services:
  registry:
    image: registry:3.0.0
    container_name: registry-cache
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      REGISTRY_HTTP_ADDR: "0.0.0.0:5000"
      REGISTRY_PROXY_REMOTEURL: "https://registry-1.docker.io"
      OTEL_TRACES_EXPORTER: "none"
    volumes:
      - cache-data:/var/lib/registry

volumes:
  cache-data:
```

Configure Docker clients to use the cache by adding to `/etc/docker/daemon.json`:

```json
{
  "registry-mirrors": ["http://your-server:5000"]
}
```

### Garbage Collection

Deleted images leave behind unreferenced blobs. Clean them up:

```bash
docker exec registry bin/registry garbage-collect /etc/distribution/config.yml
```

Run this periodically (via cron) to reclaim disk space. The registry must be stopped or set to read-only during garbage collection to avoid data corruption.

### S3 Backend Storage

```yaml
environment:
  REGISTRY_STORAGE: "s3"
  REGISTRY_STORAGE_S3_ACCESSKEY: "your-access-key"
  REGISTRY_STORAGE_S3_SECRETKEY: "your-secret-key"
  REGISTRY_STORAGE_S3_REGION: "us-east-1"
  REGISTRY_STORAGE_S3_BUCKET: "my-registry"
  REGISTRY_STORAGE_S3_REGIONENDPOINT: "http://minio:9000"
```

## Reverse Proxy

Put the registry behind a reverse proxy for TLS termination and domain-based access. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

Nginx Proxy Manager config: set the forward hostname to the registry container and port 5000. Enable WebSocket support. Set the maximum upload size high enough for large images (e.g., 2 GB).

Key proxy requirement: the `Host` header must be passed through correctly. Docker clients use it for authentication and redirect handling.

## Backup

Back up the registry data volume:

```bash
docker run --rm -v registry-data:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/registry-backup-$(date +%Y%m%d).tar.gz /data
```

The `/var/lib/registry` volume contains all image layers and metadata. This is the only volume you need to back up. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Cannot push images — "server gave HTTP response to HTTPS client"

**Symptom:** `docker push` fails with an error about HTTP vs HTTPS.
**Fix:** For local/development registries without TLS, add the registry to Docker's insecure registries list in `/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["your-server:5000"]
}
```

Then restart Docker: `sudo systemctl restart docker`. For production, always use TLS.

### Push fails with "blob unknown to registry"

**Symptom:** Intermittent push failures mentioning unknown blobs.
**Fix:** This usually indicates a storage driver issue. If using a network filesystem, switch to local storage or S3. Ensure the storage volume has sufficient disk space.

### Authentication errors after restart

**Symptom:** `401 Unauthorized` after restarting the registry.
**Fix:** Verify the `auth/htpasswd` file still exists and is mounted correctly. Regenerate credentials if needed:

```bash
htpasswd -Bbn myuser newpassword > auth/htpasswd
docker compose restart registry
```

### Disk space growing without bound

**Symptom:** The registry volume keeps growing even after deleting images.
**Fix:** Run garbage collection. Image deletion via the API only marks layers for deletion — garbage collection actually frees the space:

```bash
docker exec registry bin/registry garbage-collect /etc/distribution/config.yml
```

## Resource Requirements

- **RAM:** 50-100 MB idle, 200-500 MB under heavy push/pull load
- **CPU:** Low (most work is I/O bound)
- **Disk:** Depends entirely on stored images — budget 2-10x the total size of images you plan to store (layers are shared but garbage collection is needed)

## Verdict

A self-hosted Docker Registry is essential if you build custom images, run CI/CD pipelines, or want to avoid Docker Hub's pull rate limits. The official registry is lightweight, battle-tested, and straightforward to deploy. For small-to-medium self-hosting setups, the basic filesystem storage is all you need. If you want a web UI for browsing images, pair it with a registry frontend or use [Gitea](/apps/gitea), which includes a built-in container registry.

## FAQ

### Do I need a self-hosted registry?

If you only pull public images, a pull-through cache is more useful than a full registry. If you build and push custom images (for development, CI/CD, or private apps), a self-hosted registry eliminates Docker Hub rate limits and keeps your images under your control.

### Can I use this with Podman?

Yes. Podman is fully compatible with OCI registries. Use `podman push` and `podman pull` with the same `your-server:5000/image:tag` format. See our [Podman guide](/apps/podman).

### How does this compare to Harbor or Gitea's registry?

Docker Registry is a bare-bones image store — no UI, no vulnerability scanning, no RBAC. [Harbor](https://goharbor.io/) adds all of those on top of the Distribution project. [Gitea](/apps/gitea) bundles a container registry with Git hosting. Use plain Registry for simplicity; Harbor for enterprise features; Gitea if you want Git + images in one tool.

## Related

- [How to Self-Host Portainer](/apps/portainer)
- [How to Self-Host Dockge](/apps/dockge)
- [How to Self-Host Gitea](/apps/gitea)
- [Best Docker Management Tools](/best/docker-management)
- [Portainer vs Dockge](/compare/portainer-vs-dockge)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

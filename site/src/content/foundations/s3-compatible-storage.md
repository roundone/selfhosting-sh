---
title: "S3-Compatible Storage for Self-Hosting"
description: "Set up S3-compatible self-hosted storage on your own server with MinIO, Garage, or SeaweedFS — object storage for backups, app data, and media files."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "s3", "object-storage", "minio", "storage"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is S3-Compatible Storage?

S3-compatible object storage gives you an API-compatible alternative to Amazon S3 that runs on your own hardware. Instead of paying AWS per gigabyte, you store blobs, backups, photos, and application data on local disks behind the same API that thousands of tools already support. If you self-host apps like [Nextcloud](/apps/nextcloud/), [Immich](/apps/immich/), or any backup tool, S3-compatible self-hosted storage lets you centralize your data without cloud lock-in.

Object storage differs from filesystem storage. Rather than a hierarchy of directories and files, you have flat buckets containing objects identified by keys. Each object carries metadata alongside its data. This model is simpler for large-scale unstructured data — photos, backups, logs, media — and the S3 API has become the universal interface for accessing it.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started/)
- Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- At least 1 GB of free RAM (2 GB+ recommended for production)
- Dedicated storage volume for object data — see [Storage Planning](/foundations/storage-planning/)
- Basic understanding of Docker volumes — see [Docker Volumes](/foundations/docker-volumes/)

## Core Concepts

Before deploying anything, understand four concepts that every S3-compatible system uses.

### Buckets

A bucket is a top-level container for objects. Think of it as a namespace. You might create buckets like `backups`, `photos`, `app-data`. Bucket names must be globally unique within your server, lowercase, and between 3-63 characters. Most self-hosted apps create their own buckets automatically.

### Objects and Keys

An object is a file plus metadata. The key is the object's identifier within a bucket — it looks like a file path (`photos/2026/vacation/img001.jpg`) but it is flat. The `/` characters are cosmetic; there are no real directories. Objects can range from 1 byte to 5 TB per standard S3 spec.

### Access Keys and Secret Keys

Authentication uses a pair of credentials: an access key (like a username) and a secret key (like a password). You create key pairs for each application or user that needs access. Never share your root credentials with applications — create dedicated keys with scoped permissions.

### Bucket Policies and ACLs

Policies control who can do what. At minimum, you will set:
- **Private** (default): Only the bucket owner with valid credentials can access objects.
- **Public-read**: Anyone can download objects, but only authenticated users can upload. Useful for serving static assets.
- **Read-write per key**: Specific access/secret key pairs get read-write access to specific buckets.

For self-hosting, private buckets with application-specific access keys cover 95% of use cases.

## Self-Hosted S3 Providers

Three projects dominate self-hosted S3-compatible storage. Each targets different use cases.

### MinIO — Best for Most Self-Hosters

[MinIO](https://min.io) is the most widely deployed self-hosted S3 implementation. It has near-complete S3 API compatibility, solid performance on commodity hardware, and the broadest ecosystem support. If a self-hosted app says it supports "S3 storage," it was almost certainly tested against MinIO.

**Important caveat:** MinIO's GitHub repository was archived in February 2026, and the project stopped publishing official Docker images to Docker Hub in October 2025. The last official image with the full web console is `RELEASE.2025-04-22T22-12-26Z`. However, community-maintained images from [Bitnami](https://hub.docker.com/r/bitnami/minio) continue to receive updates. MinIO remains the pragmatic choice because of its unmatched compatibility and the massive existing documentation.

**Best for:** Single-node deployments, app backends (Nextcloud, Immich, Paperless-ngx), backups. The S3 API coverage is the most complete of any self-hosted option.

**Resource usage:** ~200 MB RAM idle, ~500 MB under moderate load. CPU usage is minimal except during erasure coding operations.

### Garage — Best for Distributed / Low-Resource Setups

[Garage](https://garagehq.deuxfleurs.fr) is a lightweight, geo-distributed S3-compatible store built in Rust. It is designed for clusters spread across multiple physical locations and runs on hardware as small as a Raspberry Pi.

**Best for:** Multi-node setups across locations, ARM devices, minimal resource footprint. Garage's replication model is specifically designed for nodes that go offline (home servers with unreliable connections).

**Resource usage:** ~100 MB RAM per node. Significantly lighter than MinIO.

**Trade-off:** S3 API coverage is narrower. Some advanced features (versioning, object locking, lifecycle policies) are missing or incomplete. Not all apps that work with MinIO will work with Garage without testing.

**Latest version:** v2.2.0 — Docker image `dxflrs/garage:v2.2.0`.

### SeaweedFS — Best for Large-Scale Storage

[SeaweedFS](https://github.com/seaweedfs/seaweedfs) is a distributed storage system optimized for billions of files with O(1) disk seek. It provides an S3 gateway on top of its native blob store.

**Best for:** Large media libraries (100K+ files), high-throughput workloads, tiered storage with cloud offloading.

**Resource usage:** ~300-500 MB RAM for the full stack (master + volume + filer + S3 gateway). More components to manage than MinIO.

**Trade-off:** More complex to deploy — requires multiple services (master, volume server, filer, S3 gateway). The S3 API is layered on top rather than native, so edge-case compatibility can vary.

**Latest version:** 4.05 — Docker image `chrislusf/seaweedfs:4.05`.

### Which Should You Pick?

| Criteria | MinIO | Garage | SeaweedFS |
|----------|-------|--------|-----------|
| S3 compatibility | Excellent | Good | Good |
| Single-node simplicity | Excellent | Good | Fair |
| Multi-node / geo-distributed | Good | Excellent | Excellent |
| RAM usage (idle) | ~200 MB | ~100 MB | ~300 MB |
| ARM support | Yes | Yes | Yes |
| Active development | Community forks | Active | Active |
| Ecosystem support | Best | Growing | Good |

**Pick MinIO** unless you have a specific reason not to. It has the broadest compatibility, the most documentation, and the simplest single-node setup. Use Garage if you need multi-site replication on low-power hardware. Use SeaweedFS if you are storing millions of files and need tiered storage.

## Setting Up MinIO with Docker Compose

This setup runs a single MinIO server with persistent storage, the web console, and sensible defaults for self-hosting.

Create a directory for your MinIO deployment:

```bash
mkdir -p /opt/minio && cd /opt/minio
```

Create a `docker-compose.yml` file:

```yaml
services:
  minio:
    image: bitnami/minio:2025.4.22
    container_name: minio
    restart: unless-stopped
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web console
    environment:
      # Root credentials — CHANGE THESE before first run
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=change-this-to-a-strong-password
      # Server URL — set to your domain or IP for correct presigned URLs
      - MINIO_SERVER_URL=http://localhost:9000
      # Console URL — set to your domain or IP
      - MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
      # Region — arbitrary, but some S3 clients require it
      - MINIO_DEFAULT_BUCKETS=backups,app-data
    volumes:
      - minio-data:/bitnami/minio/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  minio-data:
    driver: local
```

Start the server:

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose logs minio
```

You should see output indicating the S3 API is listening on port 9000 and the console on port 9001. Open `http://your-server-ip:9001` in a browser and log in with the root credentials you set.

### Configuration Notes

- **`MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`**: These are your root admin credentials. Change them before first boot. The root user has full access to everything — never use these credentials in applications.
- **`MINIO_SERVER_URL`**: Set this to the URL that external clients use to reach the S3 API. If you are behind a reverse proxy with a domain like `s3.example.com`, set this to `https://s3.example.com`. Incorrect values cause presigned URL failures.
- **`MINIO_BROWSER_REDIRECT_URL`**: The URL for the web console. If you serve the console through a reverse proxy on a different subdomain, set it here.
- **`MINIO_DEFAULT_BUCKETS`**: Comma-separated list of buckets to create on first startup. Useful for preprovisioning buckets for your apps.
- **`minio-data` volume**: All object data lives here. Back this up — see [Backup Strategy](/foundations/backup-3-2-1-rule/). For large datasets, use a bind mount to a dedicated disk instead of a named volume.

### Using a Bind Mount for Data

If you have a dedicated storage drive mounted at `/mnt/data`, replace the named volume with a bind mount:

```yaml
    volumes:
      - /mnt/data/minio:/bitnami/minio/data
```

Make sure the directory exists and has correct permissions:

```bash
mkdir -p /mnt/data/minio
# Bitnami images run as UID 1001
chown -R 1001:1001 /mnt/data/minio
```

## Using mc (MinIO Client) for Management

The MinIO Client (`mc`) is a command-line tool for managing any S3-compatible storage. Install it directly on your server — running it in a container adds unnecessary friction for a CLI tool.

### Install mc

```bash
curl -fSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc
mc --version
```

For ARM64 (Raspberry Pi 4/5):

```bash
curl -fSL https://dl.min.io/client/mc/release/linux-arm64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc
```

### Configure an Alias

An alias is a saved connection to an S3 endpoint:

```bash
mc alias set local http://localhost:9000 minioadmin change-this-to-a-strong-password
```

Verify the connection:

```bash
mc admin info local
```

### Common Operations

Create a bucket:

```bash
mc mb local/photos
```

Upload a file:

```bash
mc cp /path/to/file.jpg local/photos/
```

List bucket contents:

```bash
mc ls local/photos
```

Mirror a directory (recursive sync):

```bash
mc mirror /srv/backups local/backups/
```

Check disk usage:

```bash
mc du local/photos
```

Create a service account (access key for an application):

```bash
mc admin user svcacct add local minioadmin --name "nextcloud-s3" --description "Nextcloud S3 backend"
```

This outputs an access key and secret key. Save them — the secret key is shown only once.

Set a bucket policy to read-only public:

```bash
mc anonymous set download local/public-assets
```

### mc vs the Web Console

Use the web console for visual browsing and one-off tasks. Use mc for anything scriptable — automated backups, bucket provisioning, user management, monitoring. In production, mc should be your primary tool.

## Integrating with Self-Hosted Apps

Most self-hosted apps that support S3 need four values:

| Setting | Example Value |
|---------|--------------|
| Endpoint / URL | `http://minio:9000` (from Docker network) or `http://your-server-ip:9000` |
| Access Key | The access key from `mc admin user svcacct add` |
| Secret Key | The corresponding secret key |
| Bucket | The bucket name you created |
| Region | `us-east-1` (MinIO default, some clients require it) |
| Path Style | **Enable** — MinIO uses path-style URLs, not virtual-hosted style |

### Nextcloud

In Nextcloud's `config.php`, configure S3 as the primary storage backend:

```php
'objectstore' => [
    'class' => '\\OC\\Files\\ObjectStore\\S3',
    'arguments' => [
        'bucket' => 'nextcloud-data',
        'hostname' => 'minio',
        'port' => 9000,
        'key' => 'your-access-key',
        'secret' => 'your-secret-key',
        'use_ssl' => false,
        'use_path_style' => true,
        'region' => 'us-east-1',
    ],
],
```

The `hostname` is `minio` if Nextcloud and MinIO are on the same Docker network. Set `use_path_style` to `true` — this is required for MinIO. See the full [Nextcloud setup guide](/apps/nextcloud/) for Docker network configuration.

### Immich

Immich natively supports S3 storage for uploaded assets. In your Immich `.env` file or Docker Compose environment:

```yaml
UPLOAD_LOCATION=/usr/src/app/upload  # Local cache for processing
IMMICH_MEDIA_LOCATION=s3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=immich-uploads
S3_REGION=us-east-1
```

Check the [Immich guide](/apps/immich/) for the full Docker Compose configuration. Make sure MinIO is on the same Docker network as Immich's services.

### Backup Tools (Restic, Borgmatic, Duplicati)

Any backup tool with S3 support works with MinIO. For Restic:

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
restic -r s3:http://your-server-ip:9000/backups init
restic -r s3:http://your-server-ip:9000/backups backup /data
```

### Docker Network Considerations

When MinIO and the client app run on the same Docker host, put them on a shared Docker network so apps connect via the container name (`minio`) rather than the host IP. Add a shared network to your Docker Compose files:

```yaml
networks:
  s3-net:
    external: true
```

Create it once:

```bash
docker network create s3-net
```

Then add `networks: [s3-net]` to both the MinIO service and any app service that needs S3 access. See [Docker Networking](/foundations/docker-networking/) for more detail.

## Reverse Proxy Setup

If you need to expose MinIO externally (for remote backups or multi-server setups), run it behind a [reverse proxy](/foundations/reverse-proxy-explained/) with TLS.

Key points for proxying MinIO:

- Proxy port 9000 for the S3 API (e.g., `s3.example.com`).
- Proxy port 9001 for the web console (e.g., `console.s3.example.com`).
- Set `MINIO_SERVER_URL` to the public S3 API URL (e.g., `https://s3.example.com`).
- Set `MINIO_BROWSER_REDIRECT_URL` to the public console URL.
- WebSocket support is required for the console — ensure your proxy passes `Upgrade` and `Connection` headers.
- Set `client_max_body_size` (Nginx) or equivalent to allow large uploads. `0` disables the limit.

## Common Mistakes

### Using Root Credentials in Applications

The root user (`MINIO_ROOT_USER`) has unrestricted access. If an app is compromised, the attacker has full control of all buckets. Always create dedicated service accounts with `mc admin user svcacct add` and scope access per application.

### Forgetting Path-Style URLs

MinIO uses path-style S3 URLs (`http://host:9000/bucket/key`), not virtual-hosted style (`http://bucket.host:9000/key`). Most S3 client libraries default to virtual-hosted style. Look for a `path_style` or `force_path_style` or `use_path_style` option and enable it. Symptoms: DNS resolution failures or 404 errors on bucket operations.

### Not Setting MINIO_SERVER_URL Behind a Proxy

When MinIO generates presigned URLs (for direct uploads/downloads), it uses the server URL. If this is set to `http://localhost:9000` but clients reach MinIO through `https://s3.example.com`, presigned URLs will be unreachable. Always set `MINIO_SERVER_URL` to the externally-accessible URL.

### Ignoring Volume Backups

Object storage is not a backup. If your disk fails and the MinIO data volume is on that disk, everything is gone. Back up the data volume to a separate location — another disk, another server, or an offsite destination. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

### Running Out of Disk Space

MinIO does not handle full disks gracefully. Writes fail and the server can enter a degraded state. Monitor disk usage with `mc admin info local` or standard Linux tools (`df -h`). Set up alerts before you hit 85% capacity.

## FAQ

### Can I use MinIO as a drop-in replacement for AWS S3?

For self-hosted apps, yes. MinIO implements the S3 API comprehensively enough that apps designed for AWS S3 work without code changes — you just point them at your MinIO endpoint instead of `s3.amazonaws.com`. The main limitation is features like S3 Select, Glacier storage classes, and CloudFront integration, which are AWS-specific and not available.

### How much storage can a single MinIO node handle?

A single MinIO node can handle petabytes of data limited only by your attached storage. For self-hosting, practical limits are your disk capacity and I/O throughput. A single SSD-backed node handles typical self-hosting workloads (backups, photo storage, app data) without performance issues.

### Is MinIO still safe to use after the GitHub archival?

The existing code is stable, well-tested, and used in production by thousands of deployments. The Bitnami and Chainguard community images continue to receive security patches. For self-hosting, the risk is low — MinIO is mature software that does not change frequently at the protocol level. If the community maintenance stops in the future, Garage and SeaweedFS are viable migration targets.

### Do I need erasure coding for a single-server setup?

No. Erasure coding distributes data across multiple drives for redundancy and requires at least 4 drives. For a single-server, single-drive setup, MinIO runs in standalone mode without erasure coding. Protect your data with regular backups to a separate location instead.

### Can I migrate between MinIO, Garage, and SeaweedFS?

Yes, because they all speak the S3 API. Use `mc mirror` or `rclone sync` to copy all objects from one S3-compatible endpoint to another. The migration is at the data level — you copy objects and recreate bucket policies. Applications only need their endpoint URL and credentials updated.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes and Persistent Data](/foundations/docker-volumes/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Server Storage Planning](/foundations/storage-planning/)
- [Docker Networking](/foundations/docker-networking/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [How to Self-Host Nextcloud](/apps/nextcloud/)
- [How to Self-Host Immich](/apps/immich/)

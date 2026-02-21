---
title: "How to Self-Host Garage with Docker Compose"
description: "Deploy Garage, a lightweight S3-compatible object storage system, with Docker Compose for self-hosted cloud storage."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync"
apps:
  - garage
tags:
  - self-hosted
  - garage
  - s3
  - object-storage
  - docker
  - minio-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Garage?

Garage is a lightweight, self-hosted S3-compatible object storage system built in Rust. It's designed for small to medium deployments where you need S3 API compatibility without the complexity of MinIO (now archived) or Ceph. Garage supports multi-node replication, static website hosting, and is lightweight enough to run on a Raspberry Pi.

[Official site: garagehq.deuxfleurs.fr](https://garagehq.deuxfleurs.fr)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space (plus storage for your data)
- 512 MB of RAM (minimum)
- A domain name (optional, for web hosting and S3 endpoint)

## Docker Compose Configuration

Create a `garage.toml` configuration file first:

```toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"

replication_factor = 1

[rpc_bind_addr]
addr = "[::]:3901"

[rpc_secret]
# Generate with: openssl rand -hex 32
secret = "CHANGE_THIS_generate_with_openssl_rand_hex_32"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

[s3_web]
bind_addr = "[::]:3902"
root_domain = ".web.garage.localhost"

[k2v_api]
api_bind_addr = "[::]:3904"

[admin]
api_bind_addr = "[::]:3903"
# Generate with: openssl rand -hex 32
admin_token = "CHANGE_THIS_generate_admin_token"
metrics_token = "CHANGE_THIS_generate_metrics_token"
```

Generate the required secrets:

```bash
# RPC secret (shared between cluster nodes)
openssl rand -hex 32

# Admin token
openssl rand -hex 32

# Metrics token
openssl rand -hex 32
```

Create a `docker-compose.yml` file:

```yaml
services:
  garage:
    container_name: garage
    image: dxflrs/garage:v2.2.0
    restart: unless-stopped
    ports:
      - "3900:3900"   # S3 API
      - "3901:3901"   # RPC (only expose if running multi-node)
      - "3902:3902"   # S3 web hosting
      - "3903:3903"   # Admin API
    volumes:
      - ./garage.toml:/etc/garage.toml:ro
      - garage-meta:/var/lib/garage/meta
      - garage-data:/var/lib/garage/data
    networks:
      - garage

networks:
  garage:
    driver: bridge

volumes:
  garage-meta:
  garage-data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

After starting the container, configure the cluster layout:

```bash
# Get the node ID
docker compose exec garage /garage status

# Assign a zone and capacity (in bytes) to the node
# Replace NODE_ID with the actual ID from the status command
docker compose exec garage /garage layout assign NODE_ID -z dc1 -c 100GB

# Apply the layout
docker compose exec garage /garage layout apply --version 1
```

### Create an API Key

```bash
docker compose exec garage /garage key create my-app-key
```

This outputs an access key ID and secret key. Save both — you'll need them for S3 clients.

### Create a Bucket

```bash
# Create a bucket
docker compose exec garage /garage bucket create my-bucket

# Grant read-write access to your key
docker compose exec garage /garage bucket allow --read --write --owner my-bucket --key my-app-key
```

### Test With AWS CLI

```bash
aws s3 ls --endpoint-url http://your-server-ip:3900 \
  --region garage
```

Configure credentials with `aws configure` using the key ID and secret from the creation step.

## Configuration

### Using a Custom S3 Endpoint Domain

For production, point a domain at your server and update `garage.toml`:

```toml
[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.example.com"
```

This enables virtual-hosted-style bucket URLs like `my-bucket.s3.example.com`.

### Static Website Hosting

Garage can serve S3 buckets as static websites:

```bash
# Enable website hosting for a bucket
docker compose exec garage /garage bucket website --allow my-bucket
```

Upload an `index.html` and access via `my-bucket.web.garage.localhost:3902`.

### Replication (Multi-Node)

For redundancy, run Garage on multiple servers. Set `replication_factor = 3` in `garage.toml`, use the same `rpc_secret` on all nodes, and connect them:

```bash
docker compose exec garage /garage node connect OTHER_NODE_ID@other-server:3901
```

## Reverse Proxy

For S3 API access behind a reverse proxy, proxy to port 3900. Ensure your proxy passes the `Host` header correctly — S3 virtual-hosted-style requests depend on it.

For [Nginx Proxy Manager](/apps/nginx-proxy-manager/), create a proxy host pointing to port 3900. Set the domain to `s3.example.com`.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for details.

## Backup

Garage stores metadata and data separately:
- **Meta volume** — SQLite database with bucket/key/object metadata
- **Data volume** — actual object data blocks

```bash
docker compose stop
tar czf garage-backup-$(date +%Y%m%d).tar.gz \
  $(docker volume inspect garage_garage-meta --format '{{ .Mountpoint }}') \
  $(docker volume inspect garage_garage-data --format '{{ .Mountpoint }}')
docker compose start
```

For multi-node deployments with replication, losing one node doesn't lose data — but back up metadata regularly regardless.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### "NoSuchBucket" Error

**Symptom:** S3 clients return `NoSuchBucket` even though the bucket exists.
**Fix:** Check that the bucket name in the request matches exactly (case-sensitive). Also verify the key has `--read` and `--write` permissions on the bucket.

### Layout Not Applied

**Symptom:** `garage status` shows "no current cluster layout."
**Fix:** You must assign capacity and apply the layout after first start:

```bash
docker compose exec garage /garage layout assign NODE_ID -z dc1 -c 100GB
docker compose exec garage /garage layout apply --version 1
```

### High Memory Usage

**Symptom:** Garage uses more memory than expected.
**Fix:** SQLite is the default database engine and works well for most deployments. If you have millions of objects, consider LMDB (`db_engine = "lmdb"`) which has better performance at scale but uses more disk for the metadata.

### Slow Uploads

**Symptom:** S3 PUT operations are slower than expected.
**Fix:** Garage chunks objects into blocks. For large files, ensure the network between client and server isn't the bottleneck. Consider using multipart uploads for files over 100 MB.

## Resource Requirements

- **RAM:** 100-200 MB idle, scales with number of concurrent connections and object count
- **CPU:** Low — Rust binary is efficient
- **Disk:** Minimal for the application. Data storage depends on your usage.

## Verdict

Garage is the best self-hosted S3-compatible storage for small to medium deployments. It replaced MinIO (now archived on GitHub) as the go-to lightweight option. The Rust implementation is memory-efficient, the multi-node replication works well, and the S3 API compatibility means it integrates with any tool that speaks S3.

Use Garage when you need S3 API compatibility for backups, application storage, or static site hosting. For file sync and sharing with a web UI, look at [Nextcloud](/apps/nextcloud/) or [Seafile](/apps/seafile/) instead.

## FAQ

### Can I use Garage as a backup target for Restic or Borg?

Yes. [Restic](/apps/restic/) supports S3 backends natively. Point it at your Garage endpoint. Borg doesn't support S3 directly, but you can use rclone as a transport layer.

### Is Garage a drop-in MinIO replacement?

For most S3 API operations, yes. Garage supports the core S3 API (GET, PUT, DELETE, list, multipart upload). Some advanced features like S3 Select or bucket notifications aren't supported.

### How does Garage compare to SeaweedFS?

Garage is simpler to deploy and more lightweight. SeaweedFS supports more features (FUSE mount, HDFS API, Kafka integration) but requires more resources. For pure S3 storage on modest hardware, Garage wins.

### Can I run Garage on a Raspberry Pi?

Yes. Garage's ARM64 Docker image works on Raspberry Pi 4/5. With 1 GB of RAM allocated, it handles personal storage workloads well.

## Related

- [How to Self-Host Nextcloud](/apps/nextcloud/)
- [How to Self-Host Seafile](/apps/seafile/)
- [Self-Hosted Alternatives to Google Drive](/replace/google-drive/)
- [Self-Hosted Alternatives to Dropbox](/replace/dropbox/)
- [Best Self-Hosted File Sync Solutions](/best/file-sync/)
- [How to Self-Host Restic](/apps/restic/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)

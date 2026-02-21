---
title: "How to Self-Host Duplicati with Docker"
description: "Deploy Duplicati with Docker Compose for encrypted incremental backups to cloud storage, SFTP, S3, and local destinations."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - duplicati
tags:
  - docker
  - backup
  - encryption
  - cloud-storage
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Duplicati?

[Duplicati](https://duplicati.com/) is a free, open-source backup client that stores encrypted, incremental, compressed backups on cloud storage services and remote file servers. It supports over 20 backends including Amazon S3, Backblaze B2, Google Drive, OneDrive, SFTP, WebDAV, and local storage. If you are paying for Backblaze, CrashPlan, or any cloud backup service, Duplicati lets you replace them with a self-hosted solution that gives you full control over your backup encryption keys and destination choices.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM (minimum)
- Disk space for local backup staging or a configured remote backend (S3, B2, SFTP, etc.)
- A domain name (optional, for remote access to the web UI)

## Docker Compose Configuration

Create a directory for your Duplicati configuration:

```bash
mkdir -p /opt/duplicati
cd /opt/duplicati
```

Create a `docker-compose.yml` file:

```yaml
services:
  duplicati:
    image: lscr.io/linuxserver/duplicati:v2.2.0.3-ls5
    container_name: duplicati
    restart: unless-stopped
    environment:
      - PUID=${PUID}           # User ID for file permissions
      - PGID=${PGID}           # Group ID for file permissions
      - TZ=${TZ}               # Timezone for scheduled backups
      - CLI_ARGS=${CLI_ARGS:-}  # Optional extra CLI arguments for Duplicati
    ports:
      - "8200:8200"            # Web UI
    volumes:
      - ./config:/config                # Duplicati database and settings
      - /opt/duplicati/backups:/backups  # Local backup destination
      - /:/source:ro                     # Source data to back up (read-only)
```

Create a `.env` file alongside it:

```bash
# User/group ID — run `id` to find yours
PUID=1000
PGID=1000

# Timezone — controls when scheduled backups run
TZ=America/New_York

# Optional: extra CLI arguments passed to Duplicati server
# Example: --webservice-allowed-hostnames=* to allow reverse proxy access
CLI_ARGS=--webservice-allowed-hostnames=*
```

Start the stack:

```bash
docker compose up -d
```

Duplicati's web UI is now available at `http://your-server-ip:8200`.

**A note on the `/source` volume:** The configuration above mounts the entire host filesystem as `/source` inside the container in read-only mode. This gives Duplicati access to back up anything on the server. If you prefer to limit what Duplicati can see, mount only specific directories:

```yaml
    volumes:
      - ./config:/config
      - /opt/duplicati/backups:/backups
      - /home:/source/home:ro
      - /opt:/source/opt:ro
      - /etc:/source/etc:ro
```

## Initial Setup

1. Open `http://your-server-ip:8200` in your browser.
2. On first launch, Duplicati asks whether this is a single-user machine or if others can access it. If your server is accessible on a network, select **Yes** and set a UI password. This password protects the web interface only -- it is separate from backup encryption passwords.
3. You will land on the Duplicati home screen. There are no backup jobs configured yet.
4. Click **Add backup** to create your first backup job. The wizard walks you through five steps: General settings, Destination, Source data, Schedule, and Options.

## Configuration

### Creating a Backup Job

**Step 1 -- General:**
- Give the backup a descriptive name (e.g., "Server Config Backup").
- Set an encryption passphrase. Duplicati uses AES-256 encryption by default. Store this passphrase somewhere safe -- without it, your backups are unrecoverable.
- Choose the encryption module. AES-256 is the default and recommended choice.

**Step 2 -- Destination:**
- Select your backup destination. Options include local folder, S3-compatible storage, Backblaze B2, SFTP, FTP, Google Drive, OneDrive, WebDAV, and more.
- For local backups, point to `/backups` (which maps to `/opt/duplicati/backups` on the host).
- For remote destinations, enter the connection details. Duplicati will test the connection before proceeding.

**Step 3 -- Source Data:**
- Select folders under `/source` to back up. Since `/source` maps to your host filesystem, `/source/opt` corresponds to `/opt` on the host.
- Use filters to exclude files by extension, size, or path pattern. Common exclusions: `*.tmp`, `*.log`, `node_modules/`, `.cache/`.

**Step 4 -- Schedule:**
- Set how often the backup runs. Daily at 2:00 AM is a sensible default.
- The schedule respects the `TZ` environment variable you set in the `.env` file.

**Step 5 -- Options:**
- Set the remote volume size. The default of 50 MB works for most setups. Increase to 200-500 MB for large backups over fast connections.
- Set retention policy (see Advanced Configuration below).
- Click **Save** to finish.

### Key Settings

- **Block size:** Controls deduplication granularity. Default 100 KB works well. Smaller values improve deduplication but increase database size.
- **Upload speed limit:** Useful if your ISP has limited upstream bandwidth. Set under each backup job's options.
- **Concurrency:** Duplicati runs one backup job at a time by default. If you have multiple jobs, they queue sequentially.

## Advanced Configuration

### Backup Encryption

Duplicati encrypts all data before it leaves your server. The default AES-256 module is solid and recommended for most users. Key points:

- Encryption happens client-side. Your backup destination never sees unencrypted data.
- The passphrase is not stored on the destination. If you lose it, your backups are gone.
- You can also use GPG encryption if you prefer key-based encryption over passphrases. Select "GNU Privacy Guard" as the encryption module when creating a backup job.
- To disable encryption entirely (only recommended for trusted local destinations), select "No encryption."

### Cloud Backend Configuration

**Amazon S3 / S3-compatible (MinIO, Wasabi):**
- Storage type: "S3 Compatible"
- Server: `s3.amazonaws.com` (or your MinIO/Wasabi endpoint)
- Bucket name: your bucket
- AWS Access ID and Secret Key
- Region: match your bucket region
- Storage class: `STANDARD` or `STANDARD_IA` for infrequent access backups

**Backblaze B2:**
- Storage type: "B2 Cloud Storage"
- Bucket name, Account ID, and Application Key from your B2 dashboard
- B2 is one of the cheapest cloud storage options at $0.006/GB/month

**SFTP:**
- Storage type: "SFTP (SSH)"
- Server, port (default 22), path, username
- Authentication: password or SSH key file
- Point to a key file mounted into the container if using key-based auth

**Google Drive / OneDrive:**
- Duplicati uses OAuth2. The web UI will redirect you to Google/Microsoft to authorize access.
- Note: OAuth tokens can expire. Check your backup logs periodically for authentication failures.

### Retention Policies

Set retention in each backup job under Options. Common strategies:

- **Keep all backups:** Not recommended long-term. Storage costs grow unbounded.
- **Delete backups older than X days:** Simple. Example: `30D` keeps 30 days of history.
- **Smart retention:** Keep one backup per day for the last 7 days, one per week for the last 4 weeks, one per month for 12 months. Set with: `1W:1D,4W:1W,12M:1M`
- **Keep a specific number:** `--keep-versions=10` keeps the last 10 backup versions regardless of age.

### CLI Usage

You can interact with Duplicati from the command line inside the container:

```bash
# List configured backups
docker exec duplicati duplicati-cli list

# Run a specific backup job by name
docker exec duplicati duplicati-cli backup <backup-url> <source-path> --passphrase="your-passphrase"

# Verify backup integrity
docker exec duplicati duplicati-cli test <backup-url> --passphrase="your-passphrase"

# Restore files
docker exec duplicati duplicati-cli restore <backup-url> --passphrase="your-passphrase" --restore-path=/tmp/restore
```

The `CLI_ARGS` environment variable in your `.env` file passes additional arguments to the Duplicati server process. Useful flags:

- `--webservice-allowed-hostnames=*` -- allows access via reverse proxy or non-localhost hostnames
- `--webservice-port=8200` -- change the web UI port (default 8200)

## Reverse Proxy

If you are running Nginx Proxy Manager, create a proxy host:

- **Domain:** `duplicati.yourdomain.com`
- **Scheme:** `http`
- **Forward Hostname/IP:** `duplicati` (if on the same Docker network) or your server's IP
- **Forward Port:** `8200`
- **Enable SSL** with Let's Encrypt
- Under **Advanced**, add:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Make sure you set `CLI_ARGS=--webservice-allowed-hostnames=*` in your `.env` file, otherwise Duplicati will reject requests that arrive via the reverse proxy with a hostname other than `localhost`.

For other reverse proxy setups, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained).

## Backup

Duplicati itself needs backing up. The critical data is in the `/config` volume, which contains:

- **The Duplicati SQLite database** -- stores all backup job configurations, schedules, and metadata about what has been backed up
- **Server settings** -- web UI password, encryption settings

Back up the `./config` directory (or the named volume) to a separate location. A simple approach:

```bash
# Stop Duplicati to ensure database consistency
docker compose stop duplicati

# Copy the config directory
cp -r /opt/duplicati/config /path/to/safe/location/duplicati-config-$(date +%Y%m%d)

# Restart
docker compose start duplicati
```

Alternatively, configure a second Duplicati backup job that backs up `/config` to a different destination than your main backups. This way, you can restore Duplicati itself if your server dies.

## Troubleshooting

### Web UI Not Accessible via Reverse Proxy

**Symptom:** Duplicati works on `http://localhost:8200` but returns "Host header not allowed" through a reverse proxy.

**Fix:** Set `CLI_ARGS=--webservice-allowed-hostnames=*` in your `.env` file and recreate the container:

```bash
docker compose down && docker compose up -d
```

### Backup Fails with "Unauthorized" on Cloud Backend

**Symptom:** Backup jobs fail with authentication errors on Google Drive, OneDrive, or other OAuth-based backends.

**Fix:** OAuth tokens expire. Open the Duplicati web UI, edit the affected backup job, go to the Destination step, and re-authenticate with your cloud provider. For headless servers, consider using S3-compatible or SFTP backends that use API keys instead of OAuth.

### Database Corruption or "Failed to Connect to Database"

**Symptom:** Duplicati fails to start or shows database errors in the log.

**Fix:** The SQLite database in `/config` can become corrupted after an unclean shutdown. Try the repair tool:

```bash
docker exec duplicati duplicati-cli repair <backup-url> --passphrase="your-passphrase"
```

If the server database itself is corrupted (not a backup database), delete the file and recreate it:

```bash
docker compose down
# The server database is typically at /config/Duplicati-server.sqlite
mv /opt/duplicati/config/Duplicati-server.sqlite /opt/duplicati/config/Duplicati-server.sqlite.bak
docker compose up -d
```

You will need to reconfigure your backup jobs, but your actual backup data on the remote destination is untouched.

### Backup Runs Slowly or Uses Too Much Memory

**Symptom:** Backup jobs take hours or Duplicati consumes excessive RAM during large backup operations.

**Fix:** Reduce the block size (default 100 KB) if you have many small files, or increase the remote volume size (default 50 MB) to reduce the number of uploads. For very large source datasets (multiple TB), increase the Docker container's memory limit:

```yaml
    deploy:
      resources:
        limits:
          memory: 2G
```

Also consider excluding large files that do not need backup (VM images, media libraries already stored elsewhere).

### Permission Denied Errors on Source Files

**Symptom:** Backup job logs show "Access to the path is denied" for certain files.

**Fix:** Ensure the `PUID` and `PGID` in your `.env` file match a user that has read access to the source directories. The `/source` mount is read-only by design, but the container process still needs filesystem-level read permission. Check with:

```bash
docker exec duplicati id
# Compare with file ownership on the host
ls -la /path/to/problematic/file
```

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB--2 GB during active backup operations depending on dataset size and block settings
- **CPU:** Low when idle. Moderate during backup and encryption (single-threaded per job)
- **Disk:** The `/config` volume is typically 50--500 MB depending on the number of backup jobs and the size of the local database. The `/backups` volume depends entirely on your backup size and retention policy

## Verdict

Duplicati is the best self-hosted backup solution for users who want a web UI, encrypted cloud backups, and broad backend support without writing scripts. The web-based setup wizard makes it accessible even if you have never configured backup software before, and AES-256 encryption is on by default.

Where Duplicati falls short is performance on very large datasets. If you are backing up multiple terabytes, [BorgBackup](/apps/borgmatic) (via Borgmatic) will be significantly faster thanks to content-defined chunking and better deduplication. Borg is also more battle-tested for bare-metal disaster recovery scenarios.

Choose Duplicati if you want a GUI-driven backup tool with native support for S3, B2, Google Drive, and dozens of other cloud backends. Choose Borgmatic if you prefer CLI-driven backups, need to handle multi-terabyte datasets efficiently, or want the best deduplication ratios.

## Related

- [How to Self-Host Borgmatic with Docker](/apps/borgmatic)
- [Duplicati vs Borgmatic](/compare/duplicati-vs-borgmatic)
- [Duplicati vs Restic](/compare/duplicati-vs-restic)
- [Best Self-Hosted Backup Solutions](/best/backup)
- [Replace Backblaze and CrashPlan](/replace/cloud-backup)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-strategy)

---
title: "How to Self-Host ZoneMinder with Docker Compose"
description: "Step-by-step guide to self-hosting ZoneMinder NVR with Docker Compose, including camera setup, motion detection, and event recording."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "video-surveillance"
apps:
  - zoneminder
tags:
  - self-hosted
  - zoneminder
  - docker
  - nvr
  - video-surveillance
  - security-cameras
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ZoneMinder?

[ZoneMinder](https://zoneminder.com/) is one of the oldest and most established open-source video surveillance systems, first released in 2002. It supports monitoring and recording from IP cameras, USB cameras, and file-based video sources. ZoneMinder handles motion detection, event recording, and remote viewing through a web interface. It's a proven NVR that has been running in homes, businesses, and government installations for over two decades.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB+ of free RAM (4 GB+ recommended for 5+ cameras)
- IP cameras with RTSP or MJPEG support
- Sufficient storage for video recordings (plan 10-50 GB per camera per week)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  zoneminder:
    image: ghcr.io/zoneminder-containers/zoneminder-base:1.38.1
    container_name: zoneminder
    restart: unless-stopped
    ports:
      - "8443:443"   # Web UI (HTTPS)
      - "9000:9000"  # Event notification server (optional)
    environment:
      TZ: America/New_York           # CHANGE: Your timezone
      ZM_DB_HOST: zm-db
      ZM_DB_NAME: zm
      ZM_DB_USER: zmuser
      ZM_DB_PASS: your-secure-db-password  # CHANGE: Use a strong password
      ZM_TIMEZONE: America/New_York  # CHANGE: Your timezone
    volumes:
      - zm-data:/var/cache/zoneminder  # Event recordings and images
      - zm-config:/etc/zm              # Configuration files
      - zm-log:/var/log/zm             # Log files
      - type: tmpfs
        target: /dev/shm               # Shared memory for camera capture
        tmpfs:
          size: 536870912              # 512 MB — increase for more cameras
    depends_on:
      zm-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-fk", "https://localhost/api/host/getVersion.json"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  zm-db:
    image: mariadb:11
    container_name: zm-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: your-root-password      # CHANGE: Use a strong password
      MYSQL_DATABASE: zm
      MYSQL_USER: zmuser
      MYSQL_PASSWORD: your-secure-db-password      # CHANGE: Must match ZM_DB_PASS above
    volumes:
      - zm-db-data:/var/lib/mysql
    command: >
      --default-authentication-plugin=mysql_native_password
      --sql-mode=""
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  zm-data:
  zm-config:
  zm-log:
  zm-db-data:
```

**Configuration notes:**

- **Shared memory (`/dev/shm`):** ZoneMinder uses shared memory for inter-process communication between capture and analysis daemons. Allocate ~50-100 MB per camera. 512 MB supports ~5-8 cameras comfortably.
- **MariaDB** is the recommended database. ZoneMinder stores event metadata, zone configurations, and system settings in the database. Recordings are stored as files on disk.
- **Port 8443** maps to the internal HTTPS port. ZoneMinder's web UI runs on Apache with a self-signed SSL certificate by default.

Start the stack:

```bash
docker compose up -d
```

First startup takes 1-2 minutes as the database schema is initialized.

## Initial Setup

1. Open `https://your-server:8443/zm/` in your browser (accept the self-signed certificate warning)
2. You'll see the ZoneMinder console — the main dashboard showing all monitors (cameras)
3. Click **Add** to add your first camera:
   - **Name:** Give your camera a descriptive name (e.g., "Front Door")
   - **Source Type:** FFmpeg
   - **Function:** Modect (motion detection + recording) — the most common choice
   - **Source Path:** Your camera's RTSP URL (e.g., `rtsp://user:pass@192.168.1.100:554/stream1`)
   - **Capture Resolution:** Match your camera's resolution
   - **Target Colorspace:** 4 (24-bit color)
4. Click **Save** and the camera should start showing a live feed

### Camera Function Modes

| Mode | Description | Use Case |
|------|------------|----------|
| **Monitor** | Live view only, no recording, no detection | Preview cameras |
| **Modect** | Motion detection + event recording | Most cameras (recommended) |
| **Record** | Continuous recording, no motion detection | Always-record cameras |
| **Mocord** | Motion detection + continuous recording | Best of both worlds (most storage) |
| **Nodect** | External triggers only (no built-in detection) | Used with AI integrations |

## Configuration

### Motion Detection Zones

Fine-tune motion detection by defining zones within each camera view:

1. Go to camera settings → **Zones** tab
2. Click **Add New Zone**
3. Draw a polygon around the area you want to monitor
4. Set zone parameters:
   - **Type:** Active (triggers events), Inclusive, Exclusive, Preclusive, Inactive
   - **Min/Max Pixel Threshold:** Sensitivity to pixel changes (lower = more sensitive)
   - **Min/Max Alarm Pixels:** How many pixels must change to trigger
   - **Filter:** Adjust blob size to ignore small changes (leaves, shadows)

**Tips:** Create separate zones for high-priority areas (doorways, driveways) and set lower thresholds. Mark areas with constant motion (trees, busy roads) as Inactive or Preclusive to reduce false alarms.

### Storage Management

Configure event retention to prevent disk space issues:

1. Go to **Options** → **Storage**
2. Set `ZM_EVENT_CLOSE_MODE` to control when events end
3. Configure filter-based purging: **Filters** → Create a filter that deletes events older than X days

Example purge filter:
- **Name:** "Purge Old Events"
- **Conditions:** `Date` is less than `-30 days`
- **Actions:** Check "Delete matching events"
- **Run in background:** Yes

### Email Notifications

Configure email alerts for motion events:

1. Go to **Options** → **Email**
2. Set `ZM_EMAIL_HOST` to your SMTP server
3. Set `ZM_FROM_EMAIL` and `ZM_EMAIL_ADDRESS` (recipient)
4. Configure `ZM_NEW_MAIL_MODULES` for event notifications

## Advanced Configuration (Optional)

### AI Object Detection with zmeventnotification

The `zmeventnotification` add-on adds AI-powered object detection using YOLO, OpenCV DNN, or a remote ML server. This filters motion events by what triggered them (person, car, animal) instead of just pixel changes.

Install the event notification server alongside ZoneMinder:

1. The event notification server runs on port 9000 (already exposed in docker-compose)
2. Configure `/etc/zm/objectconfig.ini` for detection models
3. Download YOLO weights and config files
4. Set `use_object_detection=yes` in the event notification config

This adds significant capability but also complexity. For a simpler AI detection experience, consider [Frigate](/apps/frigate/) instead.

### Multi-Server Setup

ZoneMinder supports distributed deployments where multiple servers share a single database:

- One server runs the web UI and database
- Additional servers run camera capture daemons
- All servers point to the same MariaDB instance

This scales ZoneMinder beyond what a single machine can handle.

## Reverse Proxy

For Nginx Proxy Manager:

```
Scheme: https
Forward Hostname: zoneminder
Forward Port: 443
Block Common Exploits: ON
WebSocket Support: ON
```

Add to the Advanced tab for proper path handling:
```nginx
location /zm/ {
    proxy_pass https://zoneminder/zm/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed instructions.

## Backup

Critical data to back up:

- **MariaDB database:** Contains all camera configurations, zones, event metadata, and user settings
- **`/etc/zm/`:** ZoneMinder configuration files
- **`/var/cache/zoneminder/events/`:** Recorded video events (large — consider selective backup)

```bash
# Backup database
docker exec zm-db mysqldump -u zmuser -p'your-password' zm > zm-backup.sql

# Backup config
docker cp zoneminder:/etc/zm ./zm-config-backup/
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### Camera shows gray/black screen

**Symptom:** Monitor is running but no video appears.
**Fix:** Verify the RTSP URL works:
```bash
ffplay -rtsp_transport tcp rtsp://user:pass@camera-ip:554/stream
```
Check ZoneMinder logs at `/var/log/zm/zmc_m[ID].log` for specific errors. Common cause: wrong RTSP path for your camera model.

### "Unable to open memory" errors

**Symptom:** Logs show shared memory allocation failures.
**Fix:** Increase the `shm_size` in docker-compose.yml. Each camera needs 20-100 MB of shared memory depending on resolution. For 10 cameras at 1080p, use at least 1 GB:
```yaml
tmpfs:
  size: 1073741824  # 1 GB
```

### High CPU usage with many cameras

**Symptom:** CPU at 100% with 5+ cameras.
**Fix:** Reduce camera capture resolution (use sub-streams for monitoring). Lower the analysis FPS in camera settings (5 FPS is usually sufficient for motion detection). Enable hardware acceleration if your CPU supports it.

### Events not recording

**Symptom:** Motion detected but no events saved.
**Fix:** Verify the camera function is set to Modect or Mocord (not Monitor or Nodect). Check that the storage volume has free space. Review filter settings — an aggressive purge filter may be deleting events too quickly.

### Database connection errors on startup

**Symptom:** ZoneMinder fails to start with "Can't connect to MySQL server" errors.
**Fix:** Ensure the database container is healthy before ZoneMinder starts (the `depends_on` with `condition: service_healthy` in the compose file handles this). If manually starting, wait for MariaDB to be ready before starting ZoneMinder.

## Resource Requirements

- **RAM:** 2 GB minimum. 4+ GB recommended for 5+ cameras. Each camera uses 50-200 MB depending on resolution.
- **CPU:** 1 core per 2-3 cameras (motion detection). 4 cores recommended for 5+ cameras.
- **Disk:** 10-50 GB per camera per week depending on resolution, frame rate, and recording mode. Mocord (continuous + motion) uses the most space.
- **Shared Memory:** 50-100 MB per camera. Must be provisioned via tmpfs.
- **Network:** Each RTSP stream uses 2-8 Mbps.

## Verdict

ZoneMinder is a reliable, battle-tested NVR with 20+ years of development behind it. It handles everything from a single home camera to dozens of cameras in a commercial deployment. The web UI is functional if dated, and the motion detection zone system is powerful once configured.

However, for new self-hosted NVR deployments in 2026, [Frigate](/apps/frigate/) is the better choice for most users. Frigate's AI-powered object detection (with Coral TPU) is more accurate than ZoneMinder's pixel-based motion detection, and its Home Assistant integration is significantly tighter. Choose ZoneMinder if you need a mature, proven system and don't need AI detection, or if you're already familiar with it.

## Frequently Asked Questions

### Is ZoneMinder still actively developed?

Yes. ZoneMinder has regular releases and an active community. v1.38.1 is the current stable release. Development is slower than Frigate's rapid pace but steady and reliable.

### Can I use ZoneMinder with Home Assistant?

Yes, through the ZoneMinder integration in Home Assistant. It provides camera entities and event sensors. However, the integration is basic compared to Frigate's native HA support — no event clips in the media browser, no AI detection labels.

### Should I choose ZoneMinder or Frigate?

For most new setups: Frigate. For large deployments where you need fine-grained zone control, multi-server support, or have existing ZoneMinder experience: ZoneMinder. See our [Frigate vs ZoneMinder](/compare/frigate-vs-zoneminder/) comparison for details.

## Related

- [Frigate vs ZoneMinder](/compare/frigate-vs-zoneminder/)
- [ZoneMinder vs Shinobi](/compare/zoneminder-vs-shinobi/)
- [How to Self-Host Frigate](/apps/frigate/)
- [Best Self-Hosted Video Surveillance](/best/video-surveillance/)
- [Replace Ring](/replace/ring/)
- [Replace Nest Cam](/replace/nest-cam/)
- [NVR Hardware Guide](/hardware/nvr-hardware/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

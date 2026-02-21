---
title: "How to Self-Host Shinobi with Docker Compose"
description: "Step-by-step guide to self-hosting Shinobi CCTV with Docker Compose, including camera setup, motion detection, and multi-user configuration."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "video-surveillance"
apps:
  - shinobi
tags:
  - self-hosted
  - shinobi
  - docker
  - nvr
  - video-surveillance
  - cctv
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Shinobi?

[Shinobi](https://shinobi.video/) is an open-source video management system (VMS) written in Node.js. It supports IP cameras via RTSP, MJPEG, and HLS, with features including motion detection, recording, live streaming via WebSocket, multi-user/multi-tenant support, and a plugin system for AI object detection. Shinobi was created as a modern alternative to ZoneMinder, with a cleaner web interface and easier Docker deployment.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB+ of free RAM
- IP cameras with RTSP support
- Storage space for recordings
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  shinobi:
    image: shinobisystems/shinobi:dev
    container_name: shinobi
    restart: unless-stopped
    ports:
      - "8080:8080"  # Web UI
    environment:
      ADMIN_USER: admin@shinobi.video        # CHANGE: Admin email
      ADMIN_PASSWORD: your-admin-password     # CHANGE: Use a strong password
      CRON_KEY: your-cron-key-here            # CHANGE: Random string for cron API
      PLUGINKEY_MOTION: your-motion-key       # CHANGE: Random string for motion plugin
      PLUGINKEY_OPENCV: your-opencv-key       # CHANGE: Random string for OpenCV plugin
      PLUGINKEY_OPENALPR: your-openalpr-key   # CHANGE: Random string for ALPR plugin
    volumes:
      - shinobi-config:/config
      - shinobi-customAutoLoad:/home/Shinobi/libs/customAutoLoad
      - shinobi-database:/var/lib/mysql
      - /path/to/recordings:/home/Shinobi/videos  # CHANGE: Your recordings path
      - /dev/shm/shinobiStreams:/dev/shm/streams
    depends_on:
      - shinobi-db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3

  shinobi-db:
    image: mariadb:11
    container_name: shinobi-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: your-root-password       # CHANGE: Use a strong password
      MYSQL_DATABASE: ccio
      MYSQL_USER: majesticflame
      MYSQL_PASSWORD: your-db-password              # CHANGE: Use a strong password
    volumes:
      - shinobi-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  shinobi-config:
  shinobi-customAutoLoad:
  shinobi-database:
  shinobi-db-data:
```

**Configuration notes:**

- **Shinobi uses `dev` tag** for the latest build. The project doesn't use semantic version tags on Docker Hub — `dev` is the rolling release. Pin by digest if you need reproducibility.
- **MariaDB** is required for camera config, user management, and event metadata.
- **`/dev/shm/streams`** is used for live streaming data. The shared memory mount ensures low-latency video delivery.
- **Plugin keys** are random strings used to authenticate built-in plugins (motion detection, OpenCV, ALPR). Generate them with `openssl rand -hex 16`.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:8080` in your browser
2. Log in with the super admin credentials:
   - URL: `http://your-server:8080/super`
   - Email: The `ADMIN_USER` from docker-compose
   - Password: The `ADMIN_PASSWORD` from docker-compose
3. In the super admin panel, create a regular user account:
   - Click **Accounts** → **Add**
   - Enter email, password, and set storage limits
4. Log out and log in at `http://your-server:8080` with the regular user account
5. Add your first camera:
   - Click the **+** button in the top menu
   - Set **Mode** to "Record" or "Watch Only"
   - Under **Input**, set:
     - **Type:** H.264 / H.265
     - **Full URL Path:** `rtsp://user:pass@camera-ip:554/stream1`
   - Under **Stream**, set:
     - **Type:** HLS or WebSocket (WebSocket is lower latency)
   - Click **Save**

### Camera Modes

| Mode | Description |
|------|------------|
| **Disabled** | Camera is off |
| **Watch Only** | Live view, no recording, no detection |
| **Record** | Continuous recording to disk |
| **Idle** | Camera connected but not streaming/recording |

## Configuration

### Motion Detection

Shinobi handles motion detection through its plugin system:

1. In camera settings, go to the **Detector** tab
2. Enable the detector and set:
   - **Send Frames:** Yes
   - **How to Record:** Traditional (saves to disk)
   - **Trigger Record:** Yes (record only when motion is detected)
   - **Detection Region:** Draw zones on the camera view
3. Set sensitivity:
   - **Indifference:** Lower = more sensitive (default: 5)
   - **Max Sensitivity:** Upper limit for motion detection

### Storage Limits

Control disk usage per user:

1. In the super admin panel (`/super`), edit the user account
2. Set **Storage Limit** in MB (e.g., 50000 for ~50 GB)
3. Shinobi automatically purges oldest recordings when the limit is reached

Alternatively, set per-camera retention:
1. In camera settings → **Recording** tab
2. Set **Days to keep videos** (e.g., 14)
3. Shinobi deletes recordings older than this automatically

### API Access

Shinobi provides a REST API for integration:

```bash
# Get list of monitors (cameras)
curl http://your-server:8080/API_KEY/monitor/GROUP_KEY

# Get a snapshot from a camera
curl http://your-server:8080/API_KEY/jpeg/GROUP_KEY/MONITOR_ID/snapshot.jpg
```

API keys are generated per user in account settings.

## Advanced Configuration (Optional)

### AI Object Detection (OpenCV Plugin)

Shinobi supports object detection via the built-in OpenCV plugin:

1. The plugin runs inside the Shinobi container
2. Enable it in camera settings → **Detector** tab
3. Set **Detector Plugin** to "OpenCV"
4. Configure detection classes (person, car, etc.)

For better detection accuracy, use TensorFlow or YOLO models via the plugin system. Note that Shinobi's AI plugin documentation is sparse — you may need to experiment or consult community guides.

### Multi-Tenant Setup

Shinobi's multi-tenant capability is its standout feature:

1. Create separate user accounts in the super admin panel
2. Each user has their own cameras, recordings, and storage quota
3. Users cannot see each other's cameras or recordings
4. Set per-user API keys for integrations

This makes Shinobi suitable for small businesses or shared housing where different tenants manage their own cameras.

### ONVIF Camera Discovery

Shinobi supports ONVIF for automatic camera discovery:

1. In the main interface, click the ONVIF probe button
2. Shinobi scans the local network for ONVIF-compatible cameras
3. Select a discovered camera to auto-fill its RTSP URL and configuration

## Reverse Proxy

For Nginx Proxy Manager:

```
Scheme: http
Forward Hostname: shinobi
Forward Port: 8080
WebSocket Support: ON (required for live streaming)
```

WebSocket support is critical — Shinobi's live view uses WebSocket connections for low-latency streaming.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed instructions.

## Backup

Critical data to back up:

- **MariaDB database:** Camera configurations, user accounts, event metadata
- **`/config/`:** Shinobi configuration files
- **`/home/Shinobi/videos/`:** Recorded video files (large)

```bash
# Backup database
docker exec shinobi-db mysqldump -u majesticflame -p'your-db-password' ccio > shinobi-backup.sql

# Backup config
docker cp shinobi:/config ./shinobi-config-backup/
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### Camera shows spinning/loading but no video

**Symptom:** Camera is added but live view shows a loading spinner.
**Fix:** Verify the RTSP URL works outside Shinobi:
```bash
ffplay -rtsp_transport tcp rtsp://user:pass@camera-ip:554/stream
```
Try changing the stream type from WebSocket to HLS in camera settings. Some browsers block WebSocket connections on non-HTTPS pages.

### High CPU usage

**Symptom:** Node.js process consuming 100% CPU.
**Fix:** Reduce the number of cameras streaming simultaneously. Lower the stream resolution in camera settings. Disable sub-streams if you enabled multiple stream outputs per camera. Check if a detector plugin is running CPU-heavy inference.

### Recordings not saving

**Symptom:** Camera shows live view but no recordings appear.
**Fix:** Verify the camera mode is set to "Record" (not "Watch Only" or "Idle"). Check that the recordings volume has write permissions and free space. Check Shinobi logs:
```bash
docker logs shinobi 2>&1 | grep -i error
```

### Cannot access super admin panel

**Symptom:** `/super` returns a login page but credentials don't work.
**Fix:** The super admin credentials are set via environment variables on first run. If you changed them after initial setup, the database values take precedence. Reset via MariaDB:
```bash
docker exec -it shinobi-db mysql -u root -p ccio
```
Then update the `Users` table with new hashed credentials.

## Resource Requirements

- **RAM:** 1-2 GB for 3-5 cameras. 4 GB+ for 10+ cameras.
- **CPU:** Node.js is single-threaded for the main process, but FFmpeg spawns per-camera processes. 2-4 cores recommended for 5+ cameras.
- **Disk:** 10-50 GB per camera per week depending on resolution and recording mode.
- **Network:** Each RTSP stream uses 2-8 Mbps.

## Verdict

Shinobi is a functional NVR with a modern web interface and useful multi-tenant capabilities. Its Node.js architecture and WebSocket-based streaming make it more web-friendly than older alternatives like ZoneMinder.

However, the development pace has slowed significantly, documentation is sparse, and the project is essentially a one-person operation. The Docker image uses rolling `dev` tags with no semantic versioning, making reproducible deployments harder.

For new NVR deployments in 2026, [Frigate](/apps/frigate/) is the recommended choice — better AI detection, better documentation, larger community, and more active development. Consider Shinobi if you specifically need multi-tenant user management or prefer web-based camera configuration over YAML files.

## Frequently Asked Questions

### Is Shinobi still maintained?

Shinobi receives commits on GitLab, but the pace has slowed. There are no formal version releases — the project uses rolling updates on the `dev` Docker tag. It's functional but the long-term outlook is uncertain compared to Frigate's active development.

### Can Shinobi integrate with Home Assistant?

Not natively. You can use Shinobi's API to create camera entities in Home Assistant, but it requires manual configuration. Frigate's Home Assistant integration is significantly more polished and feature-rich.

### What's the difference between Shinobi CE and Pro?

Shinobi CE (Community Edition) is the open-source version. Shinobi Pro was a paid version with additional features, but the distinction has been blurred in recent years. The Docker image available on Docker Hub includes all features.

## Related

- [Frigate vs Shinobi](/compare/frigate-vs-shinobi/)
- [ZoneMinder vs Shinobi](/compare/zoneminder-vs-shinobi/)
- [How to Self-Host Frigate](/apps/frigate/)
- [How to Self-Host ZoneMinder](/apps/zoneminder/)
- [Best Self-Hosted Video Surveillance](/best/video-surveillance/)
- [Replace Ring](/replace/ring/)
- [NVR Hardware Guide](/hardware/nvr-hardware/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

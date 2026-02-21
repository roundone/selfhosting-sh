---
title: "How to Self-Host Frigate with Docker Compose"
description: "Step-by-step guide to self-hosting Frigate NVR with Docker Compose, including Coral TPU setup, camera config, and Home Assistant integration."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "video-surveillance"
apps:
  - frigate
tags:
  - self-hosted
  - frigate
  - docker
  - nvr
  - video-surveillance
  - home-assistant
  - coral-tpu
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Frigate?

[Frigate](https://frigate.video/) is an open-source NVR (Network Video Recorder) built around real-time AI object detection. It uses Google Coral TPUs or Intel OpenVINO for hardware-accelerated detection of people, cars, animals, and other objects in your camera feeds. Frigate integrates natively with Home Assistant via MQTT, turning your security cameras into smart automation triggers. It replaces cloud-based NVRs like Ring, Nest Cam, and Arlo with a fully local, privacy-respecting alternative.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB+ of free RAM (more with many cameras)
- IP cameras with RTSP support
- Google Coral USB TPU (recommended, ~$30) or Intel CPU with OpenVINO support
- An MQTT broker (Mosquitto recommended) for Home Assistant integration
- Storage space for recordings (depends on retention policy)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  frigate:
    image: ghcr.io/blakeblackshear/frigate:0.16.4
    container_name: frigate
    restart: unless-stopped
    privileged: true
    shm_size: 256mb
    ports:
      - "5000:5000"   # Web UI
      - "8554:8554"   # RTSP restream
      - "8555:8555/tcp" # WebRTC over TCP
      - "8555:8555/udp" # WebRTC over UDP
    volumes:
      - ./config:/config
      - /path/to/recordings:/media/frigate
      - type: tmpfs
        target: /tmp/cache
        tmpfs:
          size: 1000000000  # 1 GB cache for recordings
    devices:
      - /dev/bus/usb:/dev/bus/usb  # USB Coral TPU
      # - /dev/apex_0:/dev/apex_0  # PCIe Coral TPU (uncomment if using PCIe)
    environment:
      FRIGATE_RTSP_PASSWORD: "your-camera-password"  # Referenced in config as {FRIGATE_RTSP_PASSWORD}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Create `config/config.yml` alongside your docker-compose.yml:

```yaml
mqtt:
  enabled: true
  host: 192.168.1.10  # CHANGE: Your MQTT broker IP
  port: 1883
  user: frigate        # CHANGE: Your MQTT username
  password: your-mqtt-password  # CHANGE: Your MQTT password

detectors:
  coral:
    type: edgetpu
    device: usb  # Use "pci" for PCIe Coral, "pci:0" for specific PCIe device

# CPU-only fallback (remove coral section above if no TPU)
# detectors:
#   cpu:
#     type: cpu
#     num_threads: 4

database:
  path: /config/frigate.db

record:
  enabled: true
  retain:
    days: 7          # Keep all recordings for 7 days
    mode: motion     # Only retain segments with motion
  events:
    retain:
      default: 30    # Keep event clips for 30 days

snapshots:
  enabled: true
  retain:
    default: 30      # Keep snapshots for 30 days

objects:
  track:
    - person
    - car
    - dog
    - cat

cameras:
  front_door:  # CHANGE: Your camera name
    enabled: true
    ffmpeg:
      inputs:
        - path: rtsp://admin:{FRIGATE_RTSP_PASSWORD}@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0  # CHANGE: Main stream URL
          roles:
            - record
        - path: rtsp://admin:{FRIGATE_RTSP_PASSWORD}@192.168.1.100:554/cam/realmonitor?channel=1&subtype=1  # CHANGE: Sub stream URL
          roles:
            - detect
    detect:
      width: 1280   # Match your sub-stream resolution
      height: 720
      fps: 5        # 5 FPS is enough for detection
    motion:
      threshold: 30
      contour_area: 10
    objects:
      track:
        - person
        - car
      filters:
        person:
          min_area: 5000    # Ignore tiny detections (noise)
          max_area: 100000
          threshold: 0.7    # Confidence threshold (0-1)
```

**Important configuration notes:**

- **Two streams per camera:** Use the high-resolution main stream for recording and the low-resolution sub-stream for AI detection. This dramatically reduces CPU usage.
- **`shm_size: 256mb`** is required for FFmpeg's shared memory. Increase to 512mb+ for 10+ cameras.
- **`privileged: true`** is needed for USB device access (Coral TPU). You can use more restrictive device mappings if preferred.
- **`{FRIGATE_RTSP_PASSWORD}`** is replaced at runtime with the environment variable value.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open the web UI at `http://your-server:5000`
2. You should see your cameras listed on the main dashboard
3. If cameras show "No frames" — verify RTSP URLs are correct by testing with VLC: `vlc rtsp://admin:password@camera-ip:554/stream`
4. Check the System page for detector status — the Coral TPU should show as "edgetpu" with inference times around 10-20ms
5. Objects detected in camera feeds will appear as colored bounding boxes on the live view

**If using CPU detection (no Coral):** Inference times will be 100-500ms+ per frame. Set `fps: 5` or lower in the detect config to keep CPU usage manageable.

## Configuration

### Camera RTSP URLs by Brand

Common RTSP URL formats for popular camera brands:

| Brand | Main Stream | Sub Stream |
|-------|------------|------------|
| **Hikvision** | `rtsp://user:pass@ip:554/Streaming/Channels/101` | `rtsp://user:pass@ip:554/Streaming/Channels/102` |
| **Dahua/Amcrest** | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=0` | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=1` |
| **Reolink** | `rtsp://user:pass@ip:554/h264Preview_01_main` | `rtsp://user:pass@ip:554/h264Preview_01_sub` |
| **UniFi Protect** | Not RTSP by default — use RTSP addon | Same |
| **Wyze** | Via RTSP firmware or `wyze-bridge` Docker container | Same |

### Detection Zones

Restrict where Frigate looks for objects to reduce false positives:

```yaml
cameras:
  front_door:
    zones:
      front_yard:
        coordinates: 0,500,500,500,500,0,0,0  # Polygon coordinates
        objects:
          - person
          - car
      driveway:
        coordinates: 500,500,1280,500,1280,720,500,720
        objects:
          - car
```

Zones are defined as polygon coordinates on the camera frame. Use the Frigate web UI's mask editor to draw zones visually.

### Hardware Acceleration for Recording

Enable Intel QSV or VAAPI for video encoding/decoding to reduce CPU usage for recording:

```yaml
ffmpeg:
  hwaccel_args: preset-vaapi  # For Intel integrated graphics
  # hwaccel_args: preset-intel-qsv  # For Intel QSV
  # hwaccel_args: preset-nvidia    # For NVIDIA GPUs
```

## Advanced Configuration (Optional)

### Home Assistant Integration

With MQTT configured, Frigate automatically publishes events to your MQTT broker. Install the [Frigate integration](https://github.com/blakeblackshear/frigate-hass-integration) in Home Assistant for:

- Camera entities with live feeds
- Binary sensors for object detection (person detected, car detected)
- Automation triggers (notify when a person is at the front door)
- Event clips and snapshots in the HA media browser

Example Home Assistant automation:

```yaml
automation:
  - alias: "Front Door Person Alert"
    trigger:
      - platform: mqtt
        topic: frigate/events
        value_template: "{{ value_json.type }}"
        payload: "new"
    condition:
      - condition: template
        value_template: "{{ trigger.payload_json.after.label == 'person' }}"
      - condition: template
        value_template: "{{ trigger.payload_json.after.camera == 'front_door' }}"
    action:
      - service: notify.mobile_app
        data:
          title: "Person Detected"
          message: "Someone is at the front door"
```

### Birdseye View

Frigate's Birdseye feature creates a combined view of all cameras, showing only cameras with active objects:

```yaml
birdseye:
  enabled: true
  width: 1920
  height: 1080
  mode: objects  # Show cameras only when objects are detected
```

### Notifications with Pushover or Ntfy

Use Frigate's built-in notification support or pair with Home Assistant's notification system to get alerts on your phone when specific objects are detected.

## Reverse Proxy

Nginx Proxy Manager configuration for Frigate:

```
Scheme: http
Forward Hostname: frigate (or container IP)
Forward Port: 5000
WebSocket Support: ON (required for live view)
```

For Traefik or Caddy, ensure WebSocket passthrough is enabled. Frigate's live view and event streaming rely on WebSocket connections.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed instructions.

## Backup

Back up these directories:

- **`/config/`** — Contains `config.yml` and the Frigate database (`frigate.db`). This is the most important backup target.
- **`/media/frigate/`** — Recording clips and snapshots. Large but replaceable.

```bash
# Backup config (critical)
tar czf frigate-config-backup.tar.gz ./config/

# Backup recordings (optional, large)
rsync -av /path/to/recordings/ /backup/frigate-recordings/
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### Camera shows "No frames received"

**Symptom:** Camera appears in the UI but shows no video feed.
**Fix:** Verify the RTSP URL works outside of Frigate. Test with VLC or FFplay:
```bash
ffplay -rtsp_transport tcp rtsp://user:pass@camera-ip:554/stream
```
Common issues: wrong port (some cameras use 8554), authentication failure (special characters in password need URL encoding), or the camera doesn't support the specified codec.

### High CPU usage without Coral TPU

**Symptom:** CPU usage at 80-100% with AI detection enabled.
**Fix:** If you don't have a Coral TPU, reduce the detect FPS to 3-5, reduce detect resolution, or disable detection on less important cameras. A $30 USB Coral TPU drops AI inference CPU usage to near zero.

### Coral TPU not detected

**Symptom:** Frigate logs show "Failed to load delegate" or "edgetpu not found".
**Fix:** Ensure the USB Coral is plugged in and `/dev/bus/usb` is mapped in Docker Compose. Check `lsusb` on the host — you should see "Global Unichip Corp" or "Google Inc." Udev rules may be needed:
```bash
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="1a6e", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/65-coral.rules
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", GROUP="plugdev"' | sudo tee -a /etc/udev/rules.d/65-coral.rules
sudo udevadm control --reload-rules && sudo udevadm trigger
```

### Recordings not saving

**Symptom:** Events detected but no clips saved.
**Fix:** Check that the recording volume mount exists and has write permissions. Verify `record.enabled: true` in config.yml. Check Frigate logs for FFmpeg errors:
```bash
docker logs frigate 2>&1 | grep -i "error"
```

### Out of shared memory

**Symptom:** FFmpeg errors mentioning "shared memory" or container crashes.
**Fix:** Increase `shm_size` in docker-compose.yml. Each camera uses roughly 20-40 MB of shared memory. For 10 cameras, set `shm_size: 512mb` or higher.

## Resource Requirements

- **RAM:** 1 GB minimum (2+ cameras with detection). Add ~100 MB per additional camera.
- **CPU:** Minimal with Coral TPU. Without TPU: 1 core per 2-3 cameras at 5 FPS detection.
- **GPU/TPU:** Google Coral USB ($30) strongly recommended. PCIe Coral for 10+ cameras.
- **Disk:** 10-50 GB per camera per week depending on retention and recording mode.
- **Network:** Each camera RTSP stream uses 2-8 Mbps depending on resolution and codec.

## Verdict

Frigate is the best self-hosted NVR available. Its AI object detection with Coral TPU support is the killer feature — you get reliable person/car/animal detection with near-zero CPU overhead for ~$30. Home Assistant integration turns dumb cameras into smart automation triggers. The project is actively maintained, well-documented, and has a thriving community.

The main limitation is that Frigate is Linux/Docker only and requires some YAML configuration. If you're comfortable with Docker and want the best self-hosted surveillance system, Frigate is the answer. If you need a Windows GUI-based NVR, look at [Blue Iris](/compare/frigate-vs-blue-iris/).

## Frequently Asked Questions

### Do I need a Coral TPU?

No, but it's the best $30 you'll spend on your NVR setup. Without it, AI detection runs on CPU and is 5-10x slower. With a USB Coral, inference takes ~10-20ms per frame and uses essentially zero CPU. PCIe Coral is faster but usually only needed for 10+ cameras.

### Which cameras work best with Frigate?

Any camera with RTSP support works. Frigate recommends cameras with configurable sub-streams (lower resolution for detection, full resolution for recording). Hikvision, Dahua/Amcrest, and Reolink are popular choices in the community. Avoid Wi-Fi-only cameras — wired PoE cameras are more reliable for 24/7 recording.

### Can I use Frigate without Home Assistant?

Yes. Frigate works standalone as an NVR with its web UI. You don't need MQTT or Home Assistant. However, the Home Assistant integration is where Frigate really shines — automated notifications, lighting triggers on person detection, and more.

## Related

- [Frigate vs ZoneMinder](/compare/frigate-vs-zoneminder/)
- [Frigate vs Blue Iris](/compare/frigate-vs-blue-iris/)
- [Frigate vs Shinobi](/compare/frigate-vs-shinobi/)
- [Best Self-Hosted Video Surveillance](/best/video-surveillance/)
- [Replace Ring](/replace/ring/)
- [Replace Nest Cam](/replace/nest-cam/)
- [NVR Hardware Guide](/hardware/nvr-hardware/)
- [How to Self-Host Home Assistant](/apps/home-assistant/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

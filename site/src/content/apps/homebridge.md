---
title: "How to Self-Host Homebridge with Docker"
description: "Step-by-step guide to self-hosting Homebridge with Docker Compose to bring non-HomeKit devices into Apple Home."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "home-automation"
apps:
  - homebridge
tags:
  - self-hosted
  - homebridge
  - homekit
  - apple
  - docker
  - home-automation
  - iot
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Homebridge?

[Homebridge](https://homebridge.io/) is a lightweight server that bridges non-HomeKit smart home devices into Apple's HomeKit ecosystem. If you have devices that don't natively support HomeKit — Ring cameras, Nest thermostats, TP-Link plugs, or any MQTT device — Homebridge makes them appear in the Apple Home app. Control everything with Siri, automations, and the Home app on your iPhone, iPad, or Mac. Homebridge has a plugin ecosystem with over 2,000 plugins covering thousands of device types.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 200 MB of free disk space
- 512 MB of RAM (minimum)
- An Apple device with the Home app (iPhone, iPad, or Mac)
- Homebridge and Apple devices must be on the same local network for initial pairing

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  homebridge:
    image: homebridge/homebridge:2025-01-06
    container_name: homebridge
    restart: unless-stopped
    network_mode: host  # Required for mDNS/Bonjour (HomeKit discovery)
    volumes:
      - homebridge-data:/homebridge
    environment:
      HOMEBRIDGE_CONFIG_UI: "1"      # Enable web UI
      HOMEBRIDGE_CONFIG_UI_PORT: "8581"
      TZ: "America/New_York"         # Your timezone
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "1"

volumes:
  homebridge-data:
```

**Host networking is required.** HomeKit uses mDNS (Bonjour) for device discovery, which doesn't work through Docker's bridge networking. The Apple Home app won't find Homebridge without `network_mode: host`.

Start the service:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8581` to access the Homebridge UI.
2. **Create an admin account** with a username and password.
3. **Note the HomeKit pairing code** displayed on the dashboard (format: `XXX-XX-XXX`).
4. **Pair with Apple Home:**
   - Open the Home app on your iPhone/iPad
   - Tap "+" → "Add Accessory"
   - Tap "More options..." (Homebridge may not show a QR code)
   - Select "Homebridge" and enter the pairing code
5. Homebridge now appears as a bridge in Apple Home. Any plugins you add will show as accessories.

## Configuration

### Installing Plugins

The Homebridge UI includes a plugin marketplace. Go to the **Plugins** tab, search for your device type, and click "Install."

Popular plugins:

| Plugin | What It Does |
|--------|-------------|
| `homebridge-ring` | Ring doorbells and cameras |
| `homebridge-nest` | Nest thermostats and cameras |
| `homebridge-tplink-smarthome` | TP-Link Kasa smart plugs and bulbs |
| `homebridge-hue` | Philips Hue (alternative to native HomeKit bridge) |
| `homebridge-mqttthing` | Any MQTT device → HomeKit |
| `homebridge-shelly` | Shelly smart relays and sensors |
| `homebridge-camera-ffmpeg` | Generic RTSP cameras → HomeKit |
| `homebridge-alexa` | Control Homebridge from Alexa |

After installing a plugin, configure it from the **Plugins** tab → gear icon. Most plugins have a form-based config UI.

### Child Bridges

Homebridge supports running plugins as separate "child bridges." This isolates plugin crashes from the main bridge and improves stability. In the Plugins tab, click the wrench icon on a plugin → "Bridge Settings" → enable child bridge. Each child bridge gets its own HomeKit pairing code.

### MQTT Integration

Use `homebridge-mqttthing` to bridge any MQTT device to HomeKit:

```json
{
  "type": "lightbulb",
  "name": "Desk Lamp",
  "url": "mqtt://mosquitto:1883",
  "username": "mqtt_user",
  "password": "mqtt_pass",
  "topics": {
    "getOn": "zigbee2mqtt/desk_lamp/state",
    "setOn": "zigbee2mqtt/desk_lamp/set/state"
  }
}
```

This pairs well with [Zigbee2MQTT](/apps/zigbee2mqtt) and [Mosquitto](/apps/mosquitto).

## Advanced Configuration (Optional)

### Config File Editing

The `config.json` file in the data volume controls all Homebridge settings. Edit via the UI (Config tab) or directly:

```bash
docker exec -it homebridge vi /homebridge/config.json
```

### Camera Support

For RTSP cameras, install `homebridge-camera-ffmpeg`:

```json
{
  "platform": "Camera-ffmpeg",
  "cameras": [
    {
      "name": "Front Door",
      "videoConfig": {
        "source": "-i rtsp://camera-ip:554/stream",
        "maxWidth": 1920,
        "maxHeight": 1080,
        "maxFPS": 30,
        "vcodec": "h264_omx"
      }
    }
  ]
}
```

FFmpeg is included in the Homebridge Docker image.

### Secure Remote Access

HomeKit Secure Video and remote access work through Apple's Home Hub (Apple TV, HomePod, or iPad). The Home Hub handles encryption and relaying — no port forwarding or reverse proxy needed for Apple Home access.

For the Homebridge UI, use a reverse proxy or VPN for remote management.

## Reverse Proxy

The Homebridge web UI runs on port 8581. Since the container uses `network_mode: host`, the port is bound to the host directly.

**Do NOT proxy the HomeKit protocol itself** — HomeKit uses mDNS and direct connections that won't work through a proxy. Only proxy the web management UI if needed.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for the web UI.

## Backup

Back up the data volume:

```bash
docker run --rm -v homebridge_homebridge-data:/data -v $(pwd):/backup alpine \
  tar -czf /backup/homebridge-backup-$(date +%Y%m%d).tar.gz /data
```

The Homebridge UI also has a built-in backup feature: Settings → Backup/Restore. This creates a downloadable archive you can restore on a fresh instance.

Critical files:
- `config.json` — all plugin configurations
- `persist/` — HomeKit pairing data (without this, you must re-pair)
- `accessories/` — cached accessory data

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Apple Home Can't Find Homebridge

**Symptom:** "No accessories found" when trying to pair.

**Fix:** Homebridge requires `network_mode: host` for mDNS discovery. Verify this is set. Also ensure:
- Homebridge and your Apple device are on the same subnet
- mDNS/Bonjour is not blocked by your router or firewall
- Port 51826 (default HAP port) is not blocked

If still failing, try scanning the QR code from the Homebridge dashboard instead of manual code entry.

### Plugin Crashes Homebridge

**Symptom:** Homebridge keeps restarting after installing a plugin.

**Fix:** Enable "child bridge" mode for the problematic plugin — this isolates it from the main bridge. Check the Homebridge logs (Logs tab) for the specific error. If needed, remove the plugin:

```bash
docker exec homebridge npm remove homebridge-problematic-plugin
```

### Accessories Show "No Response"

**Symptom:** Devices appear in Apple Home but show "No Response."

**Fix:** Check that the plugin is configured correctly and the target device is reachable. Check Homebridge logs for connection errors. Common causes:
- Device IP changed (use static IPs or DHCP reservations)
- API credentials expired (re-authenticate the plugin)
- Device firmware updated and broke compatibility

### HomeKit Pairing Limit Reached

**Symptom:** "This accessory has already been paired" error.

**Fix:** HomeKit bridges can only pair with one Home. If you need to re-pair:
1. Remove Homebridge from Apple Home
2. In Homebridge UI: Settings → "Reset Homebridge Accessory"
3. Re-pair with the new code

## Resource Requirements

- **RAM:** ~100-200 MB idle (depends on plugins), ~300-500 MB with camera plugins
- **CPU:** Low for most plugins. Camera streaming uses significant CPU (FFmpeg transcoding)
- **Disk:** ~100 MB for Homebridge. Plugins add 10-50 MB each

## Verdict

Homebridge is the definitive solution for bringing non-HomeKit devices into Apple's ecosystem. If you're an Apple household and have smart home devices that don't support HomeKit natively, Homebridge is the answer. The plugin ecosystem is massive and the Docker deployment is straightforward.

The main limitation is that it only helps Apple users. If you use Android or want a platform-agnostic solution, [Home Assistant](/apps/home-assistant) is the better choice — it supports HomeKit as one of many integrations, plus 2,000+ other platforms. If you're all-in on Apple and just want HomeKit integration, Homebridge is simpler to set up and maintain for that specific purpose.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host Zigbee2MQTT](/apps/zigbee2mqtt)
- [How to Self-Host Mosquitto MQTT Broker](/apps/mosquitto)
- [How to Self-Host ESPHome](/apps/esphome)
- [Best Self-Hosted Home Automation](/best/home-automation)
- [Self-Hosted Apple HomeKit Alternatives](/replace/apple-homekit)
- [Self-Hosted Google Home Alternatives](/replace/google-home)
- [Docker Compose Basics](/foundations/docker-compose-basics)

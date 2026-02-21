---
title: "How to Self-Host Zigbee2MQTT with Docker"
description: "Step-by-step guide to self-hosting Zigbee2MQTT with Docker Compose to bridge Zigbee devices to MQTT without proprietary hubs."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "home-automation"
apps:
  - zigbee2mqtt
tags:
  - self-hosted
  - zigbee2mqtt
  - zigbee
  - mqtt
  - docker
  - home-automation
  - iot
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Zigbee2MQTT?

[Zigbee2MQTT](https://www.zigbee2mqtt.io/) is a bridge that connects Zigbee devices to your MQTT broker, eliminating the need for proprietary Zigbee hubs. Pair your Zigbee sensors, lights, switches, and locks directly with a USB Zigbee coordinator — Zigbee2MQTT handles the protocol translation and publishes device states to MQTT topics. Works with over 4,000 devices from 400+ manufacturers. Use it with [Home Assistant](/apps/home-assistant/), [Node-RED](/apps/node-red/), or any MQTT-compatible platform.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- A Zigbee coordinator USB dongle (see Hardware section below)
- An MQTT broker running ([Mosquitto setup guide](/apps/mosquitto/))
- 200 MB of free disk space
- 256 MB of RAM (minimum)

### Zigbee Coordinator Hardware

You need a USB Zigbee coordinator. Recommended options:

| Coordinator | Chip | Price | Notes |
|-------------|------|-------|-------|
| SONOFF Zigbee 3.0 USB Dongle Plus-E | EFR32MG21 | ~$15 | Best budget option. Excellent range. |
| Tube's EFR32 coordinator | EFR32MG21 | ~$30 | Ethernet-based (no USB needed) |
| ConBee III | deCONZ | ~$40 | Well-known brand, USB-C |
| SLZB-06 | CC2652P | ~$35 | Ethernet + USB + WiFi options |

The SONOFF Dongle Plus-E is the most popular choice for beginners.

## Docker Compose Configuration

This setup assumes you already have [Mosquitto](/apps/mosquitto/) running. If not, set that up first.

Create a configuration directory:

```bash
mkdir -p zigbee2mqtt/data
```

Create `zigbee2mqtt/data/configuration.yaml`:

```yaml
# MQTT connection
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://mosquitto:1883
  user: your_mqtt_user        # Match your Mosquitto password file
  password: your_mqtt_password # Match your Mosquitto password file

# Serial port for the Zigbee coordinator
serial:
  port: /dev/ttyUSB0  # Or /dev/ttyACM0 — check with: ls /dev/tty*

# Web frontend
frontend:
  port: 8080

# Advanced settings
advanced:
  # Network key — generate a random one for security
  # Use: openssl rand -hex 16 | sed 's/\(..\)/0x\1, /g; s/, $//'
  network_key: GENERATE
  homeassistant: true  # Enable Home Assistant MQTT discovery
  log_level: info

# Enable device pairing on startup (disable in production)
permit_join: false
```

Create `docker-compose.yml`:

```yaml
services:
  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:2.1.1
    container_name: zigbee2mqtt
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./zigbee2mqtt/data:/app/data
      - /run/udev:/run/udev:ro
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # Adjust to your coordinator's device path
    environment:
      TZ: "America/New_York"  # Your timezone
    # If Mosquitto is in the same compose file, add:
    # depends_on:
    #   - mosquitto
```

**Find your coordinator's device path:**

```bash
ls -la /dev/serial/by-id/
```

This shows stable device paths like `/dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_...-if00`. Use this path instead of `/dev/ttyUSB0` for reliability — USB device numbers can change on reboot.

Start the service:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` to access the Zigbee2MQTT web frontend.
2. **Enable pairing** — click the "Permit join" button in the top bar (or set `permit_join: true` in config temporarily).
3. **Pair a device** — put your Zigbee device in pairing mode (usually hold a button for 5+ seconds). It should appear in the Devices tab within 30 seconds.
4. **Disable pairing** — click "Permit join" again to disable. Keep pairing disabled in production for security.
5. **Name your devices** — click on a device and set a friendly name. These names become the MQTT topic paths.

## Configuration

### Home Assistant Integration

With `homeassistant: true` in the config, Zigbee2MQTT automatically publishes Home Assistant MQTT discovery messages. Devices appear in Home Assistant's MQTT integration without manual configuration.

### Device Groups

Create Zigbee groups to control multiple devices simultaneously:

```yaml
# In configuration.yaml
groups:
  '1':
    friendly_name: living_room_lights
    devices:
      - '0x00158d0001234567/1'
      - '0x00158d0001234568/1'
```

Or use the web frontend: Devices tab → select devices → Create Group.

### OTA Updates

Zigbee2MQTT can update device firmware over-the-air:

```yaml
ota:
  update_check_interval: 1440  # Check every 24 hours (minutes)
  disable_automatic_update_check: false
```

### Device-Specific Settings

```yaml
devices:
  '0x00158d0001234567':
    friendly_name: 'front_door_sensor'
    retain: true  # Retain MQTT messages for this device
  '0x00158d0001234568':
    friendly_name: 'desk_lamp'
    transition: 2  # 2-second transition for light changes
```

## Advanced Configuration (Optional)

### External Converters

For unsupported devices, create custom converters in `/app/data/`. Reference them in config:

```yaml
external_converters:
  - my_custom_device.js
```

### Network Map

The web frontend includes a network map showing all devices and their routing paths. Access it from the Map tab. This helps identify weak spots in your Zigbee mesh and devices that need better placement.

### Multiple Coordinators

Run multiple Zigbee2MQTT instances for separate Zigbee networks:

```yaml
services:
  zigbee2mqtt-primary:
    image: koenkk/zigbee2mqtt:2.1.1
    volumes:
      - ./z2m-primary:/app/data
    devices:
      - /dev/serial/by-id/coordinator-1:/dev/ttyUSB0

  zigbee2mqtt-secondary:
    image: koenkk/zigbee2mqtt:2.1.1
    volumes:
      - ./z2m-secondary:/app/data
    devices:
      - /dev/serial/by-id/coordinator-2:/dev/ttyUSB0
```

Use different `base_topic` values in each instance's config.

## Reverse Proxy

Zigbee2MQTT's web frontend runs on port 8080. Point your reverse proxy to `http://zigbee2mqtt:8080`.

**Security warning:** The web frontend has no built-in authentication. If exposing it beyond your LAN, protect it with reverse proxy authentication (Basic auth, Authelia, or Authentik). See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the data directory:

```bash
tar -czf zigbee2mqtt-backup-$(date +%Y%m%d).tar.gz zigbee2mqtt/data/
```

Critical files in the data directory:
- `configuration.yaml` — all settings
- `coordinator_backup.json` — Zigbee network backup (auto-created)
- `database.db` — device database with pairing info and network map
- `state.json` — current device states

The `coordinator_backup.json` is especially important — it contains the Zigbee network key and device pairing data. Without it, you'd need to re-pair all devices after a restore. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Coordinator Not Found

**Symptom:** "Error: Failed to connect to the adapter" on startup.

**Fix:** Check the device path:

```bash
ls -la /dev/serial/by-id/
ls -la /dev/ttyUSB0
```

Verify the `devices:` mapping in `docker-compose.yml` matches the actual path. Use `/dev/serial/by-id/...` for stable paths.

Also check permissions: the container user needs read/write access to the device:

```bash
sudo chmod 666 /dev/ttyUSB0
```

Or add a udev rule for persistent permissions.

### Devices Not Pairing

**Symptom:** Device won't appear in the Devices tab during pairing.

**Fix:**
1. Confirm "Permit join" is enabled
2. Hold the device's pairing button longer (10+ seconds for some devices)
3. Move the device closer to the coordinator during pairing
4. Check if the device is supported: [zigbee2mqtt.io/supported-devices](https://www.zigbee2mqtt.io/supported-devices/)
5. Factory reset the device first

### MQTT Connection Failed

**Symptom:** "MQTT error: Connection refused" in logs.

**Fix:** Verify MQTT credentials in `configuration.yaml` match your Mosquitto password file. Check that Mosquitto is running and accessible from the Zigbee2MQTT container:

```bash
docker exec zigbee2mqtt wget -qO- http://mosquitto:1883 || echo "Connection failed"
```

If using separate Docker Compose files, ensure both containers are on the same Docker network.

### High Latency or Missed Messages

**Symptom:** Device state changes take seconds to appear, or some events are lost.

**Fix:** This usually indicates a weak Zigbee mesh. Zigbee is a mesh protocol — add more mains-powered devices (smart plugs, light bulbs) as repeaters between distant battery-powered sensors and the coordinator. Battery devices don't relay messages.

### Web Frontend Not Loading

**Symptom:** Port 8080 shows nothing or connection refused.

**Fix:** Ensure `frontend: true` or `frontend: port: 8080` is in your configuration. Check logs:

```bash
docker compose logs zigbee2mqtt
```

## Resource Requirements

- **RAM:** ~100-150 MB idle, ~200 MB with 50+ devices
- **CPU:** Low. Spikes briefly during device pairing and OTA updates
- **Disk:** ~100 MB for the application. Database grows slightly with device count

## Verdict

Zigbee2MQTT is essential for anyone building a self-hosted smart home with Zigbee devices. It eliminates vendor lock-in, supports a massive device list, and integrates perfectly with Home Assistant via MQTT discovery. The web frontend is clean and functional.

The main competitor is ZHA (Zigbee Home Automation) — Home Assistant's built-in Zigbee integration. ZHA is simpler (no MQTT broker needed) but supports fewer devices and gives you less control. Zigbee2MQTT is the better choice if you want maximum device compatibility, detailed configuration, and the flexibility of MQTT.

You need a [Mosquitto MQTT broker](/apps/mosquitto/) running alongside Zigbee2MQTT. If you don't already have one, set that up first.

## Related

- [How to Self-Host Mosquitto MQTT Broker](/apps/mosquitto/)
- [How to Self-Host Home Assistant](/apps/home-assistant/)
- [How to Self-Host Node-RED](/apps/node-red/)
- [Best Self-Hosted Home Automation](/best/home-automation/)
- [Self-Hosted Google Home Alternatives](/replace/google-home/)
- [Self-Hosted Apple HomeKit Alternatives](/replace/apple-homekit/)
- [Home Assistant vs OpenHAB](/compare/home-assistant-vs-openhab/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

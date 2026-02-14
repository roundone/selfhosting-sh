---
title: "How to Self-Host Home Assistant with Docker Compose"
type: "app-guide"
app: "home-assistant"
category: "home-automation"
replaces: "Google Home"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Home Assistant, the most powerful self-hosted home automation platform, with Docker Compose."
officialUrl: "https://www.home-assistant.io"
githubUrl: "https://github.com/home-assistant/core"
defaultPort: 8123
minRam: "1GB"
---

## What is Home Assistant?

Home Assistant is the most popular open-source home automation platform. It integrates with over 2,000 devices and services — smart lights, thermostats, cameras, sensors, media players, and more. Build automations, create dashboards, and control your entire smart home from a single interface without relying on Google, Amazon, or Apple cloud services.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 1GB RAM — a Raspberry Pi 4 works well ([Raspberry Pi for self-hosting](/hardware/raspberry-pi-guide/))
- Smart home devices (Zigbee, Z-Wave, Wi-Fi, or Matter)
- Optional: Zigbee/Z-Wave USB coordinator (e.g., SONOFF Zigbee Dongle Plus)

## Docker Compose Configuration

```yaml
# docker-compose.yml for Home Assistant
# Tested with Home Assistant 2024.12+

services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    volumes:
      - ./config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    # Network mode host is recommended for device discovery
    network_mode: host
    # Pass through USB devices (Zigbee/Z-Wave coordinators)
    # devices:
    #   - /dev/ttyUSB0:/dev/ttyUSB0
    #   - /dev/ttyACM0:/dev/ttyACM0
    privileged: true
    restart: unless-stopped
```

**Note:** Home Assistant uses `network_mode: host` for mDNS/SSDP device discovery. This means it binds directly to port 8123 on your host — no port mapping needed.

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/homeassistant && cd ~/homeassistant
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **If using Zigbee/Z-Wave:** Plug in your USB coordinator and uncomment the `devices` section. Find the device path with `ls /dev/ttyUSB*` or `ls /dev/ttyACM*`.

4. **Start the container:**
   ```bash
   docker compose up -d
   ```

5. **Access the onboarding wizard** at `http://your-server-ip:8123`

6. **Create your account** and set your home location (used for sun-based automations and weather).

7. **Add integrations** — Home Assistant will auto-discover many devices on your network. Go to Settings → Devices & Services to add more.

## Configuration Tips

- **Zigbee2MQTT vs ZHA:** For Zigbee devices, you can use the built-in ZHA (Zigbee Home Automation) integration or run [Zigbee2MQTT](https://www.zigbee2mqtt.io/) as a separate container. Zigbee2MQTT supports more devices and is the community favorite.
- **Automations:** Start with the visual automation editor (Settings → Automations). For complex logic, switch to YAML.
- **Dashboards:** Customize your dashboard with cards for each device group. Use the Mushroom cards custom component for a modern look.
- **HACS:** Install the Home Assistant Community Store for access to thousands of custom integrations and frontend cards.
- **Companion app:** Install the Home Assistant app on your phone for notifications, location tracking, and quick controls.
- **Reverse proxy:** If you want remote access over HTTPS, see our [reverse proxy guide](/foundations/reverse-proxy/). Alternatively, use [Nabu Casa](https://www.nabucasa.com/) (paid) or [Cloudflare Tunnel](/apps/cloudflare-tunnel/) (free).

## Backup & Migration

- **Backup:** The `config` folder contains everything. Home Assistant also has built-in backup at Settings → System → Backups.
- **Snapshots:** Create snapshots before major updates so you can roll back if something breaks.

## Troubleshooting

- **Devices not discovered:** With Docker, ensure `network_mode: host` is set. Bridge networking breaks mDNS discovery.
- **Zigbee coordinator not found:** Check that the USB device is passed through correctly and that no other software is using it.
- **Slow dashboard:** Large dashboards with many entities can lag. Split into multiple views and use conditional cards.

## Alternatives

[openHAB](/apps/openhab/) is the main alternative — it's more flexible but has a steeper learning curve. For most users, Home Assistant's community size, integration count, and UI make it the clear winner. See [Best Self-Hosted Home Automation](/best/home-automation/).

## Verdict

Home Assistant is the most powerful self-hosted home automation platform available. The learning curve is real, but the community is massive and helpful. If you have any smart home devices, Home Assistant is where they all come together.

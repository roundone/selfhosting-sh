---
title: "How to Self-Host Gladys Assistant with Docker"
description: "Complete guide to self-hosting Gladys Assistant with Docker Compose, including device integration, scenes, and privacy-first setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - gladys-assistant
tags:
  - docker
  - home-automation
  - smart-home
  - gladys
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Gladys Assistant?

[Gladys Assistant](https://gladysassistant.com/) is a privacy-first, open-source home automation platform that runs entirely locally on your hardware. It supports Zigbee, Z-Wave, MQTT, Philips Hue, Sonos, and other smart home protocols. Gladys emphasizes a clean, modern UI and simplicity over the plugin complexity of platforms like Home Assistant or openHAB. It replaces Google Home, Alexa, and Apple HomeKit with zero cloud dependency.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) or Raspberry Pi 3+
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space
- 1 GB of RAM minimum
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory for Gladys data:

```bash
mkdir -p /var/lib/gladysassistant
```

Create a `docker-compose.yml` file:

```yaml
services:
  gladys:
    image: gladysassistant/gladys:v4
    container_name: gladys
    restart: unless-stopped
    # Privileged mode required for USB device access and Bluetooth
    privileged: true
    # Host networking required for device discovery (UPnP, mDNS)
    network_mode: host
    cgroup: host
    environment:
      # Production mode
      NODE_ENV: "production"
      # SQLite database location inside the container
      SQLITE_FILE_PATH: "/var/lib/gladysassistant/gladys-production.db"
      # Server port — change if 80 conflicts with another service
      SERVER_PORT: "80"
      # Set your timezone
      TZ: "Etc/UTC"
    volumes:
      # Gladys data (database, config, device states)
      - /var/lib/gladysassistant:/var/lib/gladysassistant
      # Docker socket — needed for Gladys to manage containers
      - /var/run/docker.sock:/var/run/docker.sock
      # Device access — required for USB sticks (Zigbee, Z-Wave)
      - /dev:/dev
      # udev rules — required for device detection
      - /run/udev:/run/udev:ro
    logging:
      driver: json-file
      options:
        max-size: "10m"
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip` in your browser (or port you configured)
2. Gladys presents a setup wizard:
   - Create your admin account (name, email, password)
   - Set your home location (for sunrise/sunset triggers)
   - Configure your house — add rooms
3. After setup, the dashboard loads with widgets you can customize

## Configuration

### Adding Integrations

Gladys integrations connect to your smart devices:

1. Go to **Integrations** in the sidebar
2. Browse or search for your device type:
   - **Zigbee2MQTT** — for Zigbee devices via a Zigbee coordinator
   - **Z-Wave JS UI** — for Z-Wave devices
   - **MQTT** — for generic MQTT devices and Tasmota
   - **Philips Hue** — for Hue bridges
   - **Sonos** — for Sonos speakers
   - **Bluetooth** — for Bluetooth devices
3. Click the integration, follow the setup instructions, and scan for devices

### Scenes (Automation)

Create automations under **Scenes**:

1. Click **New Scene**
2. Add triggers: time, device state change, sunrise/sunset, user presence
3. Add actions: control devices, send notifications, wait, conditions
4. Gladys uses a visual scene builder — no coding required

### Dashboard Customization

The dashboard is widget-based:
- Device control (switches, dimmers, thermostats)
- Camera feeds
- Weather
- Room-by-room organization
- Charts for sensor data

## Advanced Configuration (Optional)

### Zigbee2MQTT Integration

For Zigbee devices, run Zigbee2MQTT alongside Gladys:

```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2.0.20
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"
    volumes:
      - mosquitto_config:/mosquitto/config
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:1.42.0
    container_name: zigbee2mqtt
    restart: unless-stopped
    ports:
      - "8082:8080"
    environment:
      TZ: "Etc/UTC"
    volumes:
      - zigbee2mqtt_data:/app/data
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0

volumes:
  mosquitto_config:
  mosquitto_data:
  mosquitto_log:
  zigbee2mqtt_data:
```

Then configure Gladys's Zigbee2MQTT integration to connect to `mqtt://localhost:1883`.

### Gladys Plus (Optional)

Gladys Plus is a paid service ($9.99/month) providing:
- End-to-end encrypted remote access (no port forwarding needed)
- Google Home and Alexa voice control via encrypted tunnel
- Automatic backups

This is optional. For free remote access, use a VPN like [WireGuard](/apps/wireguard/) or [Tailscale](/apps/tailscale/).

## Reverse Proxy

Since Gladys uses `network_mode: host`, configure your reverse proxy to point to port 80 (or your configured `SERVER_PORT`).

With Nginx Proxy Manager, create a proxy host pointing to `http://your-server-ip:80`. Enable WebSocket support for real-time updates.

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for full configuration.

## Backup

Gladys stores all data in the mounted directory:

```bash
docker compose stop gladys
tar czf gladys-backup-$(date +%Y%m%d).tar.gz /var/lib/gladysassistant
docker compose start gladys
```

The critical file is `gladys-production.db` (SQLite database). See our [Backup Strategy](/foundations/backup-3-2-1-rule/) guide.

## Troubleshooting

### Cannot Access Web UI

**Symptom:** Browser shows connection refused on the configured port.

**Fix:** Check that port 80 isn't used by another service (Apache, Nginx). Change `SERVER_PORT` to a different port like 3000. Verify the container is running: `docker compose logs gladys`.

### Devices Not Discovered

**Symptom:** Integration doesn't find any devices.

**Fix:** Gladys requires `privileged: true` and `network_mode: host` for device discovery. Verify both are set in your Docker Compose. For USB devices, check that `/dev` is mounted and the device exists: `ls -la /dev/ttyUSB*`.

### SQLite Database Locked

**Symptom:** Errors about database being locked in the logs.

**Fix:** Ensure only one Gladys container runs at a time. Don't mount the data directory on NFS or SMB — SQLite doesn't support network filesystems well.

### High Memory Usage

**Symptom:** Gladys consumes more memory than expected over time.

**Fix:** Gladys is Node.js-based and memory can grow with many integrations active. Restart the container periodically: `docker compose restart gladys`. Consider increasing swap on low-memory devices.

## Resource Requirements

- **RAM:** 200 MB idle, 500 MB with multiple integrations
- **CPU:** Low (Node.js, event-driven)
- **Disk:** 200 MB for application, database grows with usage

## Verdict

Gladys Assistant is the best choice if you want a clean, modern home automation UI with a privacy-first design and minimal configuration overhead. It's simpler than [Home Assistant](/apps/home-assistant/) and [openHAB](/apps/openhab/) but has a smaller integration ecosystem. Choose Gladys if you want something that works out of the box with common smart home protocols and don't need the 2,000+ integrations that Home Assistant offers. For maximum flexibility and community support, Home Assistant remains the default recommendation for most users.

## FAQ

### How does Gladys compare to Home Assistant?

Gladys prioritizes simplicity and privacy. It has fewer integrations (around 30 vs Home Assistant's 2,000+) but is easier to set up and use. Home Assistant is more powerful; Gladys is more approachable. See our [Home Assistant vs Gladys comparison](/compare/home-assistant-vs-gladys/).

### Does Gladys require cloud access?

No. Gladys runs 100% locally. Gladys Plus (paid) adds optional encrypted remote access and voice assistant integration, but the core platform works entirely offline.

### Can Gladys run on a Raspberry Pi?

Yes. Gladys is lightweight enough for a Raspberry Pi 3B+ or newer. A Pi 4 with 2 GB RAM provides a comfortable margin.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant/)
- [How to Self-Host openHAB](/apps/openhab/)
- [How to Self-Host Domoticz](/apps/domoticz/)
- [Home Assistant vs Gladys](/compare/home-assistant-vs-gladys/)
- [Best Self-Hosted Home Automation](/best/home-automation/)
- [Replace Google Home](/replace/google-home/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Gladys vs Domoticz](/compare/gladys-vs-domoticz/)
- [Gladys vs ioBroker](/compare/gladys-vs-iobroker/)
- [Gladys vs openHAB](/compare/gladys-vs-openhab/)

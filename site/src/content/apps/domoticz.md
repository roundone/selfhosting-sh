---
title: "How to Self-Host Domoticz with Docker"
description: "Complete guide to self-hosting Domoticz with Docker Compose, including device setup, automation scripts, and Z-Wave configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - domoticz
tags:
  - docker
  - home-automation
  - smart-home
  - domoticz
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Domoticz?

[Domoticz](https://www.domoticz.com/) is a lightweight, open-source home automation system that supports a wide range of devices and protocols including Z-Wave, Zigbee, MQTT, and 433 MHz RF. It replaces cloud-dependent hubs like Google Home and Amazon Alexa with a locally-controlled system. Written in C++, Domoticz is significantly lighter on resources than Java or Python-based alternatives, making it ideal for Raspberry Pi and low-power hardware.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian Bookworm+)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 500 MB of free disk space
- 256 MB of RAM minimum (512 MB recommended)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory for Domoticz data:

```bash
mkdir -p /opt/domoticz/config
```

Create a `docker-compose.yml` file:

```yaml
services:
  domoticz:
    image: domoticz/domoticz:2025.2
    container_name: domoticz
    restart: unless-stopped
    ports:
      # Web UI (HTTP)
      - "8080:8080"
      # Web UI (HTTPS) — optional
      - "8443:443"
    environment:
      # Timezone
      TZ: "Etc/UTC"
      # HTTP port inside container
      WWW_PORT: "8080"
      # HTTPS port inside container
      SSL_PORT: "443"
    volumes:
      # Configuration and database storage
      - domoticz_config:/opt/domoticz/userdata
      # Timezone sync
      - /etc/localtime:/etc/localtime:ro
    # Uncomment to pass through USB devices (Z-Wave/Zigbee/433 MHz)
    # devices:
    #   - /dev/ttyACM0:/dev/ttyACM0
    #   - /dev/ttyUSB0:/dev/ttyUSB0

volumes:
  domoticz_config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. Domoticz loads directly into the dashboard — no setup wizard required
3. Go to **Setup → Settings** to configure:
   - Location (for sunrise/sunset triggers)
   - Language
   - Security (set a password immediately — Domoticz has no auth by default)
4. Go to **Setup → Settings → Security** and set a website protection password

**Important:** Domoticz has no built-in authentication by default. Set a password in Settings immediately, or use a reverse proxy with authentication.

## Configuration

### Adding Hardware

Hardware in Domoticz refers to communication interfaces (protocols, bridges, USB sticks):

1. Go to **Setup → Hardware**
2. Select the hardware type from the dropdown:
   - **OpenZWave USB** — for Z-Wave sticks
   - **MQTT Client Gateway** — for MQTT devices
   - **Dummy** — for virtual switches and sensors
   - **P1 Smart Meter USB** — for energy monitoring
   - **RFXtrx433** — for 433 MHz devices
3. Configure the settings and click **Add**

### Adding Devices

After adding hardware, devices appear automatically or need manual creation:

1. Go to **Setup → Devices**
2. Discovered devices show as unused — click the green arrow to activate
3. Give each device a name and assign it to a room/plan

### Automation (Events/Blockly)

Domoticz supports automation through:

- **Blockly** — visual programming editor (Setup → More Options → Events)
- **Lua scripts** — placed in `/opt/domoticz/userdata/scripts/lua/`
- **dzVents** — Domoticz-native scripting framework (recommended)
- **Python scripts** — requires Python plugin enabled

Example dzVents script (auto-lights at sunset):
```lua
return {
    on = { timer = { 'at sunset' } },
    execute = function(domoticz)
        domoticz.devices('Living Room Light').switchOn()
    end
}
```

## Advanced Configuration (Optional)

### MQTT Integration

Connect Domoticz to an MQTT broker for Tasmota, Zigbee2MQTT, and other MQTT devices:

1. Add hardware: **Setup → Hardware → MQTT Client Gateway with LAN interface**
2. Set the broker address (e.g., `mosquitto` if running alongside)
3. Devices publishing to Domoticz topics appear automatically

### Custom Notifications

Domoticz supports push notifications via Pushover, Pushbullet, Telegram, and custom HTTP. Configure under **Setup → Settings → Notifications**.

## Reverse Proxy

With Nginx Proxy Manager, create a proxy host pointing to port 8080. Set scheme to `http`.

For WebSocket support, add custom Nginx configuration:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for full configuration.

## Backup

Domoticz stores everything in a single SQLite database inside the userdata volume:

```bash
docker compose stop
tar czf domoticz-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/domoticz_config
docker compose start
```

Domoticz also has a built-in backup feature under **Setup → Backup/Restore**. See our [Backup Strategy](/foundations/backup-3-2-1-rule/) guide.

## Troubleshooting

### Web UI Not Loading

**Symptom:** Browser shows connection refused on port 8080.

**Fix:** Check that the container is running: `docker compose logs domoticz`. Verify port mapping and ensure no other service uses port 8080. Try changing the host port: `"8081:8080"`.

### USB Device Not Found

**Symptom:** Z-Wave or 433 MHz hardware shows as "not found" in Setup → Hardware.

**Fix:** Ensure the `devices` section is uncommented in Docker Compose. Verify the device path on the host: `ls -la /dev/ttyACM* /dev/ttyUSB*`. Set permissions: `sudo chmod o+rw /dev/ttyACM0`.

### Database Locked Error

**Symptom:** "database is locked" errors in the log.

**Fix:** Domoticz uses SQLite, which doesn't handle concurrent writes well. Ensure only one Domoticz instance accesses the database. Don't store the database on NFS or SMB shares. If persistent, stop the container, run `sqlite3 domoticz.db "PRAGMA integrity_check;"` on the database file, and restart.

### Automation Scripts Not Running

**Symptom:** dzVents or Lua scripts don't trigger.

**Fix:** Check **Setup → Log** for script errors. Verify scripts are in the correct directory inside the container. For dzVents, ensure the script returns the correct table format. Check that the triggering device name in the script exactly matches the device name in Domoticz (case-sensitive).

## Resource Requirements

- **RAM:** 50 MB idle, 100-200 MB under load
- **CPU:** Very low (C++ binary, minimal overhead)
- **Disk:** 100 MB for application, database grows with history

## Verdict

Domoticz is the lightest home automation platform you can run. It uses a fraction of the resources of [Home Assistant](/apps/home-assistant/) or [openHAB](/apps/openhab/), making it perfect for Raspberry Pi and low-power setups. The trade-off is a dated UI and smaller community compared to Home Assistant. If you want maximum efficiency on minimal hardware and don't mind a less polished interface, Domoticz delivers. For a modern UI and the largest integration ecosystem, Home Assistant is the better choice for most users.

## FAQ

### Is Domoticz still actively maintained?

Yes. Domoticz released version 2025.2 in 2025 with active beta development continuing. The community and core maintainers continue to push updates, though the pace is slower than Home Assistant.

### Can Domoticz run on a Raspberry Pi?

Absolutely. Domoticz is one of the best home automation platforms for Pi due to its extremely low resource usage. A Raspberry Pi 3 or newer handles Domoticz easily with room to spare for other services.

### Does Domoticz support Zigbee?

Yes, via Zigbee2MQTT. Run Zigbee2MQTT as a separate container with an MQTT broker, then connect Domoticz to the broker. Domoticz doesn't have native Zigbee support like Home Assistant's ZHA, but the MQTT approach works reliably.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant/)
- [How to Self-Host openHAB](/apps/openhab/)
- [Home Assistant vs Domoticz](/compare/home-assistant-vs-domoticz/)
- [openHAB vs Domoticz](/compare/openhab-vs-domoticz/)
- [Best Self-Hosted Home Automation](/best/home-automation/)
- [Replace Google Home](/replace/google-home/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Domoticz vs ioBroker](/compare/domoticz-vs-iobroker/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

---
title: "How to Self-Host ioBroker with Docker"
description: "Step-by-step guide to self-hosting ioBroker with Docker Compose, including adapter setup, visualization, and device integration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - iobroker
tags:
  - docker
  - home-automation
  - smart-home
  - iobroker
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ioBroker?

[ioBroker](https://www.iobroker.net/) is an open-source home automation platform focused on connecting and orchestrating devices from different manufacturers through a modular adapter system. With 500+ adapters covering protocols like Z-Wave, Zigbee, MQTT, KNX, Modbus, and cloud services, ioBroker acts as a central integration hub. It replaces Google Home, Alexa, and other cloud hubs with a powerful, locally-controlled system. Originally popular in the German-speaking community, it has a growing international user base.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian Bookworm+)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of free disk space
- 2 GB of RAM minimum (4 GB recommended)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory for ioBroker data:

```bash
mkdir -p /opt/iobroker
```

Create a `docker-compose.yml` file:

```yaml
services:
  iobroker:
    image: buanet/iobroker:v11.1.0
    container_name: iobroker
    restart: unless-stopped
    hostname: iobroker
    ports:
      # Admin web interface
      - "8081:8081"
      # VIS visualization (if installed)
      - "8082:8082"
      # Web adapter (if installed)
      - "8083:8083"
    environment:
      # Set your timezone
      TZ: "Etc/UTC"
      # Locale settings
      LANG: "en_US.UTF-8"
      LANGUAGE: "en_US.UTF-8"
      # User/group ID — match your host user
      SETUID: "1000"
      SETGID: "1000"
      # Database type for objects (jsonl is default and recommended)
      IOB_OBJECTSDB_TYPE: "jsonl"
      # Database type for states (jsonl is default and recommended)
      IOB_STATESDB_TYPE: "jsonl"
    volumes:
      # All ioBroker data — adapters, config, database, logs
      - iobroker_data:/opt/iobroker
    # Uncomment for USB device access (Z-Wave/Zigbee sticks)
    # devices:
    #   - /dev/ttyACM0:/dev/ttyACM0
    #   - /dev/ttyUSB0:/dev/ttyUSB0
    # environment:
    #   USBDEVICES: "/dev/ttyACM0"

volumes:
  iobroker_data:
```

Start the stack:

```bash
docker compose up -d
```

**First startup takes several minutes.** ioBroker installs its core adapters and initializes the database. Monitor progress with `docker compose logs -f iobroker`.

## Initial Setup

1. Wait for the container to fully start (check logs for "ioBroker is ready")
2. Open `http://your-server-ip:8081` in your browser
3. The admin interface loads — this is ioBroker's control center
4. Go to **System settings** (gear icon) to configure:
   - Language
   - Default history adapter
   - Logging level
5. The admin interface is where you install adapters, configure devices, and manage the system

## Configuration

### Installing Adapters

Adapters are ioBroker's equivalent of plugins/integrations:

1. Click **Adapters** in the left sidebar
2. Search for the adapter you need:
   - **MQTT** — for MQTT devices and Tasmota
   - **Zigbee** — for Zigbee devices via coordinator
   - **Z-Wave** — for Z-Wave USB sticks
   - **Shelly** — for Shelly devices (auto-discovery)
   - **Hue** — for Philips Hue bridges
   - **Telegram** — for notifications
   - **JavaScript** — for custom scripts
3. Click the **+** button to install
4. Configure the adapter instance that appears under **Instances**

### Objects and States

ioBroker uses a hierarchical object model:
- **Objects** — represent devices, channels, and data points
- **States** — current values of data points (e.g., temperature: 22.5°C)
- Browse the object tree under **Objects** in the sidebar
- States update in real-time as devices report changes

### Scenes and Scripts

Create automations through:
- **Scenes adapter** — group device states into preset configurations
- **JavaScript adapter** — write automation scripts in JavaScript or Blockly (visual programming)
- **Rules adapter** — if/then logic without coding

## Advanced Configuration (Optional)

### VIS Visualization

ioBroker includes VIS, a powerful dashboard builder:

1. Install the **vis** adapter from the Adapters page
2. Access VIS at `http://your-server-ip:8082`
3. Design custom dashboards with drag-and-drop widgets
4. VIS supports themes, custom CSS, and responsive layouts

### External Database (Redis/InfluxDB)

For large installations, offload state storage to external databases:

```yaml
environment:
  IOB_STATESDB_TYPE: "redis"
  IOB_STATESDB_HOST: "redis"
```

Add a Redis service to your Docker Compose for better performance with many devices.

### USB Device Passthrough

For Z-Wave or Zigbee USB sticks:

1. Uncomment the `devices` section in Docker Compose
2. Set the `USBDEVICES` environment variable to match:
   ```yaml
   environment:
     USBDEVICES: "/dev/ttyACM0"
   devices:
     - /dev/ttyACM0:/dev/ttyACM0
   ```
3. Both the device mapping AND the environment variable are required
4. Set permissions on the host: `sudo chmod o+rw /dev/ttyACM0`

## Reverse Proxy

With Nginx Proxy Manager, create a proxy host pointing to port 8081 for the admin interface. Enable WebSocket support for real-time updates.

If you use VIS, create a separate proxy host for port 8082.

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for full configuration.

## Backup

ioBroker has a built-in backup adapter (`iobroker.backitup`):

1. Install the **backitup** adapter
2. Configure backup schedule and storage location
3. Supports local, NAS, S3, and Google Drive targets

Manual backup of the Docker volume:

```bash
docker compose stop
tar czf iobroker-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/iobroker_data
docker compose start
```

See our [Backup Strategy](/foundations/backup-3-2-1-rule/) guide.

## Troubleshooting

### Admin Interface Not Loading

**Symptom:** Port 8081 shows connection refused.

**Fix:** First startup takes several minutes. Check logs: `docker compose logs -f iobroker` and wait for "ioBroker is ready". If the container keeps restarting, check for permission issues on the mounted volume.

### Adapter Installation Fails

**Symptom:** Adapter shows error during installation or won't start.

**Fix:** Check the adapter's log in **Instances → [adapter] → Log**. Common causes: missing dependencies (some adapters need build tools), insufficient memory, or network issues pulling npm packages. Increase container memory if needed.

### USB Device Not Accessible

**Symptom:** Z-Wave or Zigbee adapter can't find the USB device.

**Fix:** Both the `devices` mapping AND the `USBDEVICES` environment variable must be set. Verify the device exists on the host: `ls -la /dev/ttyACM* /dev/ttyUSB*`. Restart the container after adding device configuration.

### Container Startup Very Slow

**Symptom:** ioBroker takes 5+ minutes to start after an update.

**Fix:** After version updates, ioBroker rebuilds node modules for all installed adapters. This is normal on first start after an update. Monitor logs for progress. On low-powered hardware (Pi), this can take 10+ minutes.

### Permission Denied Errors

**Symptom:** Log shows "EACCES: permission denied" errors.

**Fix:** Ensure `SETUID` and `SETGID` match the owner of the mounted volume directory. Check host permissions: `ls -la /opt/iobroker`. Fix with: `sudo chown -R 1000:1000 /opt/iobroker`.

## Resource Requirements

- **RAM:** 500 MB idle, 1-3 GB with many adapters
- **CPU:** Low-Medium (Node.js-based)
- **Disk:** 1 GB base, grows with installed adapters and history data

## Verdict

ioBroker excels at integrating diverse smart home ecosystems through its massive adapter library. It's particularly strong in the European market with excellent support for KNX, Homematic, and other EU-popular protocols that [Home Assistant](/apps/home-assistant/) sometimes handles less gracefully. The VIS dashboard builder is more powerful than most alternatives' built-in dashboards. The downside: documentation is heavily German-language, the community is smaller internationally, and initial setup is more complex than Home Assistant. Choose ioBroker if you need deep integration with European home automation protocols or want VIS's visualization power. For most English-speaking users, Home Assistant is the safer bet.

## FAQ

### Is ioBroker documentation available in English?

Yes, but the majority is in German. The admin interface is multilingual, and English docs are improving. The international community is growing, but you'll find more help in German forums and Discord channels.

### Can ioBroker run alongside Home Assistant?

Yes. They can coexist on the same server using different ports. You can even connect them via MQTT for shared device access, using ioBroker's MQTT adapter and Home Assistant's MQTT integration.

### How does ioBroker handle updates?

The Docker image handles ioBroker core updates. Individual adapters update through the admin UI (Adapters page). Always back up before updating — adapter updates can occasionally break things.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant/)
- [How to Self-Host openHAB](/apps/openhab/)
- [How to Self-Host Domoticz](/apps/domoticz/)
- [How to Self-Host Gladys Assistant](/apps/gladys-assistant/)
- [Best Self-Hosted Home Automation](/best/home-automation/)
- [Replace Google Home](/replace/google-home/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Domoticz vs ioBroker](/compare/domoticz-vs-iobroker/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

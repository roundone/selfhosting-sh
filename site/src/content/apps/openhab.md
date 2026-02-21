---
title: "How to Self-Host openHAB with Docker"
description: "Step-by-step guide to self-hosting openHAB with Docker, including Z-Wave setup, automation rules, and integration configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - openhab
tags:
  - docker
  - home-automation
  - smart-home
  - openhab
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is openHAB?

[openHAB](https://www.openhab.org/) (open Home Automation Bus) is a Java-based open-source home automation platform that integrates devices from 400+ manufacturers and protocols into a single system. It replaces proprietary hubs like Google Home, Amazon Alexa, and Apple HomeKit with a vendor-neutral, locally-controlled platform. openHAB runs entirely on your hardware with no cloud dependency.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space minimum
- 2 GB of RAM (4 GB recommended for large setups)
- A domain name (optional, for remote access)
- USB Z-Wave/Zigbee stick (optional, for device communication)

## Docker Compose Configuration

Create a directory for your openHAB configuration:

```bash
mkdir -p /opt/openhab/{conf,userdata,addons,.java}
```

Create a `docker-compose.yml` file:

```yaml
services:
  openhab:
    image: openhab/openhab:5.1.2-debian
    container_name: openhab
    restart: unless-stopped
    network_mode: host
    environment:
      # User/group ID — match your host user for file permission consistency
      USER_ID: "1000"
      GROUP_ID: "1000"
      # Enable unlimited cryptographic policy (required for some bindings)
      CRYPTO_POLICY: "unlimited"
      # Set HTTP/HTTPS ports (defaults: 8080/8443)
      OPENHAB_HTTP_PORT: "8080"
      OPENHAB_HTTPS_PORT: "8443"
      # Extra Java options — increase heap for large installations
      EXTRA_JAVA_OPTS: "-Xms256m -Xmx512m"
      # Locale settings
      LC_ALL: "en_US.UTF-8"
      LANG: "en_US.UTF-8"
      LANGUAGE: "en_US.UTF-8"
    volumes:
      # Timezone sync
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      # openHAB configuration files (items, things, rules, sitemaps)
      - openhab_conf:/openhab/conf
      # User data (persistence, logs, cache, jsondb)
      - openhab_userdata:/openhab/userdata
      # Manually installed add-ons (JARs placed here are auto-loaded)
      - openhab_addons:/openhab/addons
      # Java trust store for custom certificates
      - openhab_java:/openhab/.java
    # Uncomment to pass through USB devices (Z-Wave/Zigbee sticks)
    # devices:
    #   - /dev/ttyACM0:/dev/ttyACM0
    #   - /dev/ttyUSB0:/dev/ttyUSB0

volumes:
  openhab_conf:
  openhab_userdata:
  openhab_addons:
  openhab_java:
```

Start the stack:

```bash
docker compose up -d
```

**Why `network_mode: host`?** openHAB uses UPnP for device discovery, which requires access to the host network stack. Bridge networking breaks automatic discovery of many smart home devices.

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. openHAB presents a setup wizard on first launch — choose between:
   - **Standard** — recommended for most users, installs common UIs
   - **Expert** — minimal install, you pick every add-on
   - **Demo** — installs demo items for exploration
3. Choose **Standard** unless you have a specific reason not to
4. The main UI loads at `http://your-server-ip:8080` — this is where you manage everything

## Configuration

### Installing Bindings

Bindings connect openHAB to your devices. Install them through the UI:

1. Go to **Settings → Bindings**
2. Click the **+** button
3. Search for your device's protocol (e.g., "Z-Wave", "MQTT", "Hue")
4. Click **Install**

Common bindings:
- **Z-Wave** — for Z-Wave USB sticks and devices
- **Zigbee** — for Zigbee coordinators (ConBee, SONOFF)
- **MQTT** — for MQTT-based devices and Tasmota firmware
- **Hue** — for Philips Hue bridges
- **Shelly** — for Shelly devices
- **Network** — for pinging devices and presence detection

### Things, Items, and Links

openHAB uses a three-layer model:

- **Things** — physical or logical devices (a Hue bulb, a Z-Wave switch)
- **Channels** — capabilities of a Thing (brightness, color, on/off)
- **Items** — abstract representations linked to Channels (used in rules and UIs)

Create Things through auto-discovery (Inbox) or manually in the UI.

### Rules and Automation

Create rules in the UI under **Settings → Rules**:
- Trigger-based (device state change, time, CRON)
- Script actions in JavaScript, Blockly (visual), or DSL
- Use **Scenes** for multi-device state changes (e.g., "Movie Night")

## Advanced Configuration (Optional)

### USB Device Passthrough (Z-Wave/Zigbee)

To use USB sticks for Z-Wave or Zigbee:

1. Identify your device path:
   ```bash
   ls -la /dev/ttyACM* /dev/ttyUSB*
   ```

2. Set permissions on the host:
   ```bash
   sudo chmod o+rw /dev/ttyACM0
   ```

3. Uncomment the `devices` section in the Docker Compose file and restart:
   ```bash
   docker compose down && docker compose up -d
   ```

### Persistence

openHAB can store historical item state data. Configure via the UI or add a persistence service:

1. Install the **JDBC Persistence** or **InfluxDB** binding
2. Configure in **Settings → Persistence**
3. InfluxDB is recommended for long-term storage and Grafana integration

### MainUI Customization

The Main UI supports custom widget development and dashboard pages. Build custom dashboards under **Settings → Pages**.

## Reverse Proxy

openHAB works behind a reverse proxy for HTTPS access. With Nginx Proxy Manager, create a proxy host pointing to your server's port 8080. Set the scheme to `http`.

For Nginx configuration, add these headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# WebSocket support (required for Main UI)
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained) guide for full configuration.

## Backup

Back up these volumes:

- **`openhab_conf`** — your configuration files (things, items, rules, sitemaps)
- **`openhab_userdata`** — jsondb (thing/item definitions created via UI), persistence data, cache

```bash
docker compose stop
tar czf openhab-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/openhab_conf \
  /var/lib/docker/volumes/openhab_userdata
docker compose start
```

openHAB also has a built-in backup tool accessible via the Karaf console. See our [Backup Strategy](/foundations/backup-3-2-1-rule) guide for a comprehensive approach.

## Troubleshooting

### Devices Not Discovered

**Symptom:** Smart home devices don't appear in the Inbox after installing a binding.

**Fix:** openHAB requires `network_mode: host` for UPnP discovery. Verify your Docker Compose uses host networking. Also check that the binding is installed and online under **Settings → Bindings**.

### High Memory Usage

**Symptom:** openHAB becomes slow or crashes with OOM errors.

**Fix:** Increase the Java heap size in `EXTRA_JAVA_OPTS`:
```yaml
EXTRA_JAVA_OPTS: "-Xms512m -Xmx1024m"
```
Restart the container after changing.

### USB Device Permission Denied

**Symptom:** Z-Wave or Zigbee binding can't access `/dev/ttyACM0`.

**Fix:** Set permissions on the host: `sudo chmod o+rw /dev/ttyACM0`. For persistence across reboots, create a udev rule:
```bash
echo 'SUBSYSTEM=="tty", ATTRS{idVendor}=="0658", ATTRS{idProduct}=="0200", MODE="0666"' | sudo tee /etc/udev/rules.d/99-zwave.rules
sudo udevadm control --reload-rules
```

### Binding Shows OFFLINE

**Symptom:** An installed binding shows "OFFLINE — COMMUNICATION_ERROR" status.

**Fix:** Check the binding's configuration under **Settings → Things**. Most bindings need a bridge Thing configured first (e.g., Hue bridge IP, MQTT broker address). Check openHAB logs: `docker compose logs openhab | grep -i error`.

### Container Fails to Start After Update

**Symptom:** openHAB container exits immediately after pulling a new image version.

**Fix:** openHAB runs an automatic userdata upgrade on version mismatch. Check logs for upgrade errors: `docker compose logs openhab`. If the upgrade fails, restore from backup and try a clean upgrade by removing the userdata cache: delete `cache` and `tmp` directories inside the userdata volume.

## Resource Requirements

- **RAM:** 512 MB idle, 1-2 GB under load with many bindings
- **CPU:** Low-Medium (Java-based, higher during rule execution)
- **Disk:** 500 MB for application, plus persistence data storage

## Verdict

openHAB is the most flexible home automation platform available, supporting 400+ integrations through its binding system. It's the right choice if you need to unify devices across many different protocols and manufacturers into a single system. The Java-based architecture means higher resource usage than lighter alternatives, and the learning curve is steeper than [Home Assistant](/apps/home-assistant). For most users starting fresh, Home Assistant is easier to get running. openHAB shines when you need deep customization, complex rule logic, or support for industrial/legacy protocols that Home Assistant doesn't cover.

## FAQ

### How does openHAB compare to Home Assistant?

openHAB has broader protocol support and more powerful rule engines, but Home Assistant has a larger community, more polished UI, and easier initial setup. See our [Home Assistant vs openHAB comparison](/compare/home-assistant-vs-openhab) for a detailed breakdown.

### Can openHAB work with Zigbee and Z-Wave devices?

Yes. Install the Z-Wave or Zigbee binding and pass your USB coordinator through to the container using the `devices` section in Docker Compose. openHAB supports most Zigbee coordinators (ConBee II, SONOFF Zigbee 3.0) and Z-Wave sticks (Aeotec Z-Stick, Zooz ZST10).

### Does openHAB require internet access?

No. openHAB runs entirely locally. Cloud integrations (voice assistants, remote access via myopenHAB) are optional. Your automations work without any internet connection.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant)
- [Home Assistant vs openHAB](/compare/home-assistant-vs-openhab)
- [openHAB vs Gladys](/compare/openhab-vs-gladys)
- [openHAB vs ioBroker](/compare/openhab-vs-iobroker)
- [Best Self-Hosted Home Automation](/best/home-automation)
- [Replace Google Home](/replace/google-home)
- [Replace Amazon Alexa](/replace/amazon-alexa)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

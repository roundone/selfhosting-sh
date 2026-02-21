---
title: "How to Self-Host Home Assistant with Docker"
description: "Set up Home Assistant with Docker Compose — automate your smart home with full local control and no cloud dependency."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - home-assistant
tags: ["self-hosted", "home-automation", "home-assistant", "docker", "smart-home", "iot"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Home Assistant?

[Home Assistant](https://www.home-assistant.io/) is an open-source home automation platform that puts you in full local control of your smart home. It supports over 2,000 integrations out of the box — lights, sensors, cameras, thermostats, media players, vacuums, locks, and almost anything else with a network interface. It replaces the need for Google Home, Amazon Alexa, or Apple HomeKit as your central automation hub, though it can also integrate with all three if you want to keep using voice assistants while running automations locally.

Home Assistant has one of the largest open-source communities in the smart home space. Updates ship monthly, device support grows constantly, and the project is backed by Nabu Casa, a company founded by the creator to fund full-time development.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) or Raspberry Pi 4/5
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB recommended for heavy automation use)
- 32 GB of free disk space
- Network access to your smart home devices (same subnet is strongly recommended for device discovery)
- A Zigbee or Z-Wave USB dongle (optional, for local device control without cloud bridges)

## Installation Methods: Docker vs Home Assistant OS

Home Assistant offers several installation methods. The two most relevant for self-hosters are **Home Assistant OS** and **Home Assistant Container** (Docker). They are not equivalent, and you should understand the trade-offs before choosing.

**Home Assistant OS** is a dedicated operating system that runs Home Assistant with the full Supervisor. You get:

- The Add-on Store (one-click install of Zigbee2MQTT, Node-RED, Mosquitto, file editors, and hundreds more)
- Automatic backups and snapshots managed through the UI
- Automatic OS and Core updates
- Full integration with all HA features

The downside: it takes over the entire machine. You cannot run other Docker containers alongside it without workarounds.

**Home Assistant Container** (Docker) gives you Home Assistant Core running in a container. You get:

- Full flexibility to run HA alongside your other containers
- You manage your own Docker Compose stack
- All 2,000+ integrations still work
- The automation engine, dashboards, and configuration system are identical

What you lose: no Supervisor, no Add-on Store, no managed backups through the UI. You install companion services (MQTT, Zigbee2MQTT, Node-RED) as separate containers yourself — which, honestly, gives you more control anyway.

**The recommendation:** If you already run a Docker server with other services, use Docker. You will manage Zigbee2MQTT, Mosquitto, and other services as separate containers, which is more transparent and easier to debug than the Supervisor add-on system. If you want a dedicated home automation appliance and nothing else on the machine, use Home Assistant OS on a mini PC or Raspberry Pi.

This guide covers the Docker Container installation.

## Docker Compose Configuration

Create a directory for your Home Assistant configuration:

```bash
mkdir -p /opt/homeassistant/config
```

Create a `docker-compose.yml` file:

```yaml
services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:2026.2.2
    volumes:
      - /opt/homeassistant/config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    environment:
      - TZ=America/New_York
    restart: unless-stopped
    privileged: true
    network_mode: host
```

### Configuration Explained

- **`image: ghcr.io/home-assistant/home-assistant:2026.2.2`** — The official Home Assistant image from GitHub Container Registry, pinned to the current stable release. Do not use `:latest` — pin to a specific version so updates are deliberate.
- **`network_mode: host`** — This is critical. Home Assistant needs host networking to discover devices on your local network via mDNS (port 5353), SSDP, and UPnP. Without host networking, device auto-discovery will not work. The trade-off is that HA binds directly to your host's port 8123.
- **`/opt/homeassistant/config:/config`** — All Home Assistant configuration, automations, dashboards, and database files live here. This is the only directory you need to back up.
- **`/etc/localtime:/etc/localtime:ro`** — Syncs the container's clock with the host. Read-only.
- **`/run/dbus:/run/dbus:ro`** — Required for Bluetooth device discovery and integration. Mount read-only.
- **`TZ=America/New_York`** — Set this to your local timezone. Use the [TZ database format](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
- **`privileged: true`** — Grants the container access to host hardware. Required if you use USB devices like Zigbee or Z-Wave dongles. If you do not use USB devices, you can remove this and use explicit `devices:` mappings instead (see below).
- **`restart: unless-stopped`** — Ensures Home Assistant restarts after reboots or crashes.

### USB Device Passthrough

If you have a Zigbee or Z-Wave USB dongle (like the Sonoff Zigbee 3.0 USB Dongle Plus or the Nortek HUSBZB-1), add device passthrough to your Compose file:

```yaml
services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:2026.2.2
    volumes:
      - /opt/homeassistant/config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0   # Zigbee/Z-Wave USB dongle
    environment:
      - TZ=America/New_York
    restart: unless-stopped
    privileged: true
    network_mode: host
```

Find your device path with `ls /dev/ttyUSB*` or `ls /dev/ttyACM*` after plugging in the dongle. If you use `privileged: true`, all devices are already accessible and the `devices:` section is optional but recommended for documentation clarity.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Once the container is running, open your browser and navigate to:

```
http://<your-server-ip>:8123
```

The onboarding wizard walks you through the first-time setup:

1. **Create an admin account.** Pick a strong password — this is the only account with full access.
2. **Set your home location.** Used for sun-based automations (sunrise/sunset triggers), weather, and zone-based presence detection.
3. **Set your timezone and unit system.** Metric or imperial. This affects temperature, distance, and volume displays.
4. **Auto-discovered integrations.** Home Assistant scans your network and shows any devices it finds — Chromecast, Philips Hue bridges, smart TVs, printers. Add them now or skip and configure later.
5. **Name your home.** Used in automations and the UI.

After onboarding, you land on the default dashboard. Home Assistant is now running.

## Configuration

### Integrations

Integrations connect Home Assistant to your devices and services. Go to **Settings > Devices & Services** to manage them.

Home Assistant auto-discovers many devices on your network. For others, click **Add Integration** and search. The most commonly used integrations:

- **Philips Hue** — Discovers the bridge automatically. Controls all Hue lights and sensors locally.
- **Zigbee Home Automation (ZHA)** — Built-in Zigbee support. Requires a compatible USB dongle. Supports hundreds of Zigbee devices directly.
- **MQTT** — Connects to an MQTT broker for Zigbee2MQTT, Tasmota devices, ESPHome, and other MQTT-speaking devices.
- **Google Cast** — Controls Chromecast, Google Home speakers, and Nest displays.
- **HomeKit Device** — Lets HA control HomeKit-compatible devices directly.
- **Meteorologisk institutt (Met.no)** — Free weather data. Added by default during onboarding.

Each integration creates **devices** (physical things) and **entities** (individual sensors, switches, lights within a device). Entities are what you use in automations and dashboards.

### Dashboards

Home Assistant uses **Lovelace** dashboards. The default dashboard auto-populates with your devices, but custom dashboards are where the real power is.

Go to **Settings > Dashboards** to create a new dashboard. Key card types:

- **Entity cards** — Show the state of a single device (on/off, temperature, etc.)
- **Button cards** — Tap to toggle lights, run scripts, or trigger scenes
- **Graph cards** — Historical data visualization for sensors (temperature, energy, humidity)
- **Area cards** — Group entities by room with a background image
- **Conditional cards** — Show or hide cards based on entity state

The dashboard editor has a visual drag-and-drop mode and a YAML mode for power users. Start with the visual editor; switch to YAML when you need more control.

### Automations

Automations are the core of Home Assistant. Every automation follows the **Trigger > Condition > Action** model:

- **Trigger:** What starts the automation (time, device state change, sun position, zone entry/exit, webhook, etc.)
- **Condition:** Optional filters (only run if it's after sunset, only if someone is home, etc.)
- **Action:** What happens (turn on lights, send a notification, adjust thermostat, play media, etc.)

**Example automation — Turn off all lights when everyone leaves home:**

Go to **Settings > Automations & Scenes > Create Automation**, or add this to your `automations.yaml`:

```yaml
- alias: "Turn off lights when everyone leaves"
  trigger:
    - platform: state
      entity_id: zone.home
      to: "0"
  condition: []
  action:
    - service: light.turn_off
      target:
        entity_id: all
```

The UI automation editor works well for simple automations. For complex logic with templates, variables, or choose/if-then blocks, edit the YAML directly.

### Scenes and Scripts

**Scenes** capture a snapshot of device states. Define a "Movie Night" scene that dims the living room lights to 20%, turns off the kitchen lights, and sets the TV input. Activate it with one tap or through an automation.

**Scripts** are reusable sequences of actions. Define a "Goodnight" script that locks the doors, turns off all lights, arms the alarm, and sets the thermostat to night mode. Call it from automations, dashboards, or voice assistants.

## Advanced Configuration

### Zigbee with ZHA or Zigbee2MQTT

Zigbee is the most popular protocol for local smart home devices — sensors, buttons, light bulbs, plugs, and contact sensors that do not require cloud connectivity.

You need a USB Zigbee coordinator. The **Sonoff Zigbee 3.0 USB Dongle Plus (CC2652P)** or **SMLIGHT SLZB-06** are the current recommended options. Plug it into your server and verify it appears at `/dev/ttyUSB0` or `/dev/ttyACM0`.

You have two choices for Zigbee in Home Assistant:

**ZHA (Zigbee Home Automation)** — Built into Home Assistant. Zero extra containers. Go to **Settings > Devices & Services > Add Integration > ZHA**, select your USB dongle, and start pairing devices. Best for users who want simplicity.

**Zigbee2MQTT** — A separate application that connects Zigbee devices to an MQTT broker, which Home Assistant reads. More device support, more configuration options, better OTA firmware updates, and a dedicated web UI. Best for power users or anyone with more than 20 Zigbee devices.

To run Zigbee2MQTT alongside Home Assistant, add these services to your `docker-compose.yml`:

```yaml
  mosquitto:
    container_name: mosquitto
    image: eclipse-mosquitto:2.1.1
    volumes:
      - /opt/homeassistant/mosquitto/config:/mosquitto/config
      - /opt/homeassistant/mosquitto/data:/mosquitto/data
      - /opt/homeassistant/mosquitto/log:/mosquitto/log
    ports:
      - "1883:1883"
    restart: unless-stopped

  zigbee2mqtt:
    container_name: zigbee2mqtt
    image: koenkk/zigbee2mqtt:2.8.0
    volumes:
      - /opt/homeassistant/zigbee2mqtt/data:/app/data
    ports:
      - "8080:8080"
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
    environment:
      - TZ=America/New_York
    restart: unless-stopped
    depends_on:
      - mosquitto
```

Create the Mosquitto configuration file at `/opt/homeassistant/mosquitto/config/mosquitto.conf`:

```
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
```

For production use, set up Mosquitto authentication instead of `allow_anonymous true`. Create a password file with `mosquitto_passwd` and reference it in the config.

After starting the containers, add the **MQTT integration** in Home Assistant (**Settings > Devices & Services > Add Integration > MQTT**) and point it to your Mosquitto broker at `localhost:1883`. Zigbee2MQTT devices will auto-discover in Home Assistant.

### MQTT

MQTT is the messaging protocol that ties together many home automation components. Zigbee2MQTT, Tasmota-flashed devices, ESPHome devices, and many other IoT tools publish their state to an MQTT broker, and Home Assistant subscribes to those topics.

The Mosquitto broker configuration above is all you need. MQTT is lightweight — a single Mosquitto instance handles thousands of devices without breaking a sweat.

### ESPHome

[ESPHome](https://esphome.io/) lets you flash ESP32 and ESP8266 microcontrollers with custom firmware for DIY sensors, switches, and displays. A $5 ESP32 board with a $3 temperature sensor becomes a fully integrated Home Assistant device — no cloud, no subscription, no latency.

ESPHome integrates natively with Home Assistant. Devices are auto-discovered and report their state over your local network. Common projects: temperature/humidity sensors, presence detection (mmWave), plant monitors, LED strip controllers, and custom button panels.

You can run the ESPHome dashboard as a Docker container for managing and flashing devices through a web UI, or install it via pip and use the CLI.

### Voice Control

Home Assistant supports fully local voice control through **Whisper** (speech-to-text) and **Piper** (text-to-speech). This is a privacy-first alternative to Alexa and Google Assistant — your voice commands never leave your network.

Set up requires a voice satellite device (a cheap ESP32-S3 board with a microphone works) and the Whisper/Piper add-ons or containers. Performance depends on your server's CPU — a modern x86 server handles it well; a Raspberry Pi will be slow.

Local voice is still maturing compared to cloud assistants, but it handles lights, scenes, and basic queries reliably. It improves with every Home Assistant release.

## Reverse Proxy

If you want to access Home Assistant remotely, you have three options:

**Option 1: Reverse proxy with SSL.** Set up Nginx Proxy Manager, Traefik, or Caddy in front of Home Assistant. Since HA uses `network_mode: host`, configure your reverse proxy to forward to `localhost:8123`. You must add the following to your Home Assistant `configuration.yaml` to allow proxied connections:

```yaml
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.16.0.0/12    # Docker default network range
    - 127.0.0.1        # Localhost
```

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained) guide for full configuration.

**Option 2: Tailscale or WireGuard.** Install Tailscale on your server and your phone. Access Home Assistant at your Tailscale IP on port 8123 — no port forwarding, no reverse proxy, no SSL certificate management. This is the simplest secure remote access method.

**Option 3: Nabu Casa Cloud.** The official remote access service ($6.50/month). Supports remote UI access, Google Assistant integration, and Alexa integration out of the box. The subscription directly funds Home Assistant development.

For most self-hosters, Tailscale is the easiest option. If you need Google Assistant or Alexa voice integration, Nabu Casa is worth the cost.

## Backup

The only directory you need to back up is your `/config` volume (mapped to `/opt/homeassistant/config` in our setup). This contains:

- `configuration.yaml` and all YAML config files
- `automations.yaml`, `scripts.yaml`, `scenes.yaml`
- The `.storage/` directory (integration configs, device registry, entity registry)
- The `home-assistant_v2.db` SQLite database (state history and statistics)

The database can grow large over time. If you only need to back up configuration (not history), you can exclude `home-assistant_v2.db` and the `backups/` directory.

Even in the Docker install, Home Assistant has a built-in backup feature accessible from **Settings > System > Backups**. It creates `.tar` archives of your configuration. Use this in addition to your regular file-level backups.

For automated backups, see our [Backup Strategy](/foundations/backup-3-2-1-rule) guide. A simple approach:

```bash
# Stop HA, copy config, restart
docker compose stop homeassistant
tar -czf /backup/homeassistant-$(date +%Y%m%d).tar.gz /opt/homeassistant/config
docker compose start homeassistant
```

For zero-downtime backups, copy the config directory while HA is running (the SQLite database supports this) and accept that the backup may have a slightly inconsistent database state — which is fine for disaster recovery.

## Troubleshooting

### Devices Not Discovered

**Symptom:** Smart devices on your network (Chromecast, Hue, etc.) do not appear in auto-discovery.

**Fix:** Verify `network_mode: host` is set in your Docker Compose. Without it, the container runs in an isolated network namespace and cannot see mDNS broadcasts or SSDP responses. Also check that your firewall is not blocking mDNS (UDP port 5353) or SSDP (UDP port 1900):

```bash
sudo ufw allow 5353/udp
sudo ufw allow 1900/udp
```

If your server has multiple network interfaces, ensure the interface connected to your IoT network is active and not blocked.

### Zigbee Stick Not Detected

**Symptom:** ZHA integration cannot find your USB Zigbee coordinator.

**Fix:** Check that the device appears on the host:

```bash
ls -la /dev/ttyUSB* /dev/ttyACM*
```

If the device is present, ensure it is mapped in your `docker-compose.yml` under `devices:` or that `privileged: true` is set. If the device is not present, try a different USB port. Some USB hubs do not pass through serial devices correctly.

Check permissions — the user running Docker must have access to the serial device:

```bash
sudo usermod -aG dialout $USER
```

Log out and back in for group changes to take effect, then restart the container.

### Automations Not Triggering

**Symptom:** An automation exists but never fires.

**Fix:** Check these in order:

1. **Is the automation enabled?** Go to **Settings > Automations** and verify the toggle is on.
2. **Are entity IDs correct?** Entity IDs change if you rename devices or re-add integrations. Check the automation's trigger and action entity IDs match actual entities in **Developer Tools > States**.
3. **Are conditions blocking it?** Remove all conditions temporarily to test if the trigger and action work.
4. **Check the logs.** Go to **Settings > System > Logs** and filter for your automation name. Look for errors.

### High CPU Usage

**Symptom:** Home Assistant consumes excessive CPU, especially over time.

**Fix:** The most common cause is a large recorder database. Home Assistant records every state change to SQLite by default, and the database grows without bound.

Add this to your `configuration.yaml` to limit history retention:

```yaml
recorder:
  purge_keep_days: 7
  commit_interval: 5
  exclude:
    domains:
      - automation
      - updater
    entity_globs:
      - sensor.date*
      - sensor.time*
```

Also check for integrations with aggressive polling intervals. Cloud-based integrations that poll every 10 seconds add up. Increase polling intervals in integration settings where possible.

### Configuration Errors After Editing YAML

**Symptom:** Home Assistant fails to start or shows errors after editing YAML files.

**Fix:** Use the built-in configuration checker before restarting:

1. Go to **Developer Tools > YAML** and click **Check Configuration**.
2. Alternatively, run from the command line:

```bash
docker exec homeassistant python -m homeassistant --config /config --script check_config
```

Common YAML mistakes: incorrect indentation (use 2 spaces, never tabs), missing colons after keys, wrong quoting of strings, and duplicate keys in the same block.

## Resource Requirements

- **RAM:** 512 MB idle with minimal integrations. 1-2 GB with 20+ integrations, Zigbee network, and active automations. Plan for 2 GB minimum.
- **CPU:** Low to medium. Base idle is negligible. CPU spikes during startup, database purges, and when processing many simultaneous state changes. Cloud integrations that poll frequently add constant low-level CPU load.
- **Disk:** ~500 MB for the application itself. The `home-assistant_v2.db` database grows over time — expect 1-5 GB depending on how many entities you track and your purge settings. Configure the `recorder` component to limit retention.

## Verdict

Home Assistant is the undisputed king of self-hosted home automation. Nothing else comes close in terms of device support, community size, and feature depth. The 2,000+ integrations mean it works with essentially every smart home device and service on the market, and the monthly release cycle keeps adding more.

The Docker install trades the convenience of the Supervisor add-on system for the flexibility of running alongside your other containers. You lose the one-click add-on store, but you gain full control over your stack — and frankly, running Mosquitto and Zigbee2MQTT as separate containers is cleaner and more debuggable than the Supervisor approach anyway.

If you want a dedicated home automation appliance, install Home Assistant OS on a mini PC. If you already run a Docker server, use the Docker Container install described here. Either way, Home Assistant should be the brain of your smart home. There is no serious competitor.

## Related

- [Best Self-Hosted Home Automation](/best/home-automation)
- [Home Assistant vs OpenHAB](/compare/home-assistant-vs-openhab)
- [Home Assistant vs ESPHome](/compare/home-assistant-vs-esphome)
- [Home Assistant vs Homebridge](/compare/home-assistant-vs-homebridge)
- [Home Assistant vs ioBroker](/compare/home-assistant-vs-iobroker)
- [Replace Google Home](/replace/google-home)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Security Basics for Self-Hosting](/foundations/security-hardening)

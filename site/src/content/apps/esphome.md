---
title: "How to Self-Host ESPHome with Docker Compose"
description: "Step-by-step guide to self-hosting ESPHome with Docker Compose for managing and flashing ESP8266 and ESP32 smart devices."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "home-automation"
apps:
  - esphome
tags:
  - self-hosted
  - esphome
  - esp32
  - esp8266
  - docker
  - home-automation
  - iot
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ESPHome?

[ESPHome](https://esphome.io/) is a system for controlling ESP8266 and ESP32 microcontrollers through simple YAML configuration files. Write YAML describing your sensors and actuators, ESPHome compiles custom firmware, and you flash it to your device — over the air or via USB. It integrates natively with [Home Assistant](/apps/home-assistant) and communicates over WiFi. ESPHome turns cheap $5 microcontrollers into smart home devices without writing a single line of C++ code.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space (for compilation caches)
- 1 GB of RAM (minimum — firmware compilation is memory-intensive)
- ESP8266 or ESP32 devices to flash
- USB cable for initial flash (subsequent updates are OTA)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  esphome:
    image: ghcr.io/esphome/esphome:2025.12.8
    container_name: esphome
    restart: unless-stopped
    ports:
      - "6052:6052"
    volumes:
      - ./esphome/config:/config
      - /etc/localtime:/etc/localtime:ro
    environment:
      ESPHOME_DASHBOARD_USE_PING: "true"  # Use ping instead of mDNS for device status
    # Uncomment for USB flashing (first-time flash):
    # devices:
    #   - /dev/ttyUSB0:/dev/ttyUSB0
    network_mode: host  # Required for mDNS device discovery
```

**Note on network mode:** ESPHome uses mDNS to discover devices on your local network. With Docker's default bridge networking, mDNS doesn't work. Use `network_mode: host` for device discovery. If you set `ESPHOME_DASHBOARD_USE_PING: "true"`, you can use bridge networking instead (but devices must have static IPs).

Create the config directory:

```bash
mkdir -p esphome/config
```

Start the service:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:6052` to access the ESPHome dashboard.
2. Click **"+ NEW DEVICE"** to create your first device configuration.
3. Choose your device type (ESP32, ESP8266, etc.) and give it a name.
4. ESPHome generates a basic YAML configuration.

### First Flash (USB required)

The first flash must be done via USB — OTA isn't available until ESPHome firmware is on the device:

1. Connect your ESP device via USB to the server.
2. Uncomment the `devices:` section in `docker-compose.yml` and restart.
3. In the dashboard, click the three dots on your device → "Install" → "Plug into this computer."
4. Select the USB port and flash.

After the first flash, all subsequent updates are over-the-air (OTA) via WiFi.

## Configuration

### Basic Device YAML

ESPHome configs live in `/config/` as YAML files. Example for an ESP32 with a temperature sensor:

```yaml
esphome:
  name: living-room-sensor
  friendly_name: Living Room Sensor

esp32:
  board: esp32dev

# WiFi connection
wifi:
  ssid: "YourWiFiSSID"
  password: "YourWiFiPassword"
  # Static IP (recommended for reliability)
  manual_ip:
    static_ip: 192.168.1.100
    gateway: 192.168.1.1
    subnet: 255.255.255.0

# Enable OTA updates
ota:
  password: "your_ota_password"

# Enable the native API for Home Assistant
api:
  encryption:
    key: "auto-generated-key"

# Enable logging
logger:

# Example: DHT22 temperature/humidity sensor
sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "Temperature"
    humidity:
      name: "Humidity"
    update_interval: 60s
```

### Common Components

**Binary sensor (door/window):**

```yaml
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO5
      mode: INPUT_PULLUP
      inverted: true
    name: "Front Door"
    device_class: door
```

**Relay/switch:**

```yaml
switch:
  - platform: gpio
    pin: GPIO12
    name: "Relay"
```

**Light (PWM):**

```yaml
light:
  - platform: monochromatic
    output: pwm_output
    name: "Desk Light"

output:
  - platform: ledc
    pin: GPIO13
    id: pwm_output
```

**NeoPixel/WS2812:**

```yaml
light:
  - platform: neopixelbus
    type: GRB
    variant: WS2812
    pin: GPIO16
    num_leds: 30
    name: "LED Strip"
```

### Secrets Management

Store sensitive values in `secrets.yaml`:

```yaml
# /config/secrets.yaml
wifi_ssid: "YourWiFiSSID"
wifi_password: "YourWiFiPassword"
ota_password: "your_ota_password"
api_key: "your_api_key"
```

Reference in device configs:

```yaml
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
```

## Advanced Configuration (Optional)

### Home Assistant Integration

ESPHome devices with the `api:` component are auto-discovered by Home Assistant. In Home Assistant, go to Settings → Devices & Services → ESPHome → Configure. Enter the device's IP and API encryption key.

### Bluetooth Proxy (ESP32 only)

Turn an ESP32 into a Bluetooth proxy for Home Assistant:

```yaml
esp32_ble_tracker:

bluetooth_proxy:
  active: true
```

This extends Home Assistant's Bluetooth range to wherever you place ESP32 devices.

### Custom Components

For advanced use cases, ESPHome supports custom C++ components:

```yaml
esphome:
  includes:
    - my_custom_sensor.h
```

## Reverse Proxy

ESPHome's dashboard runs on port 6052. If using `network_mode: host`, the port is bound to the host directly — point your reverse proxy to `http://your-server-ip:6052`.

**Security warning:** The ESPHome dashboard has no built-in authentication. If exposing beyond your LAN, protect it with reverse proxy authentication. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the config directory:

```bash
tar -czf esphome-backup-$(date +%Y%m%d).tar.gz esphome/config/
```

Critical files:
- `*.yaml` — all device configurations
- `secrets.yaml` — WiFi passwords, API keys, OTA passwords
- `.esphome/` — compilation cache (optional, can be rebuilt)

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Device Not Discovered in Dashboard

**Symptom:** Device shows as offline in the ESPHome dashboard even though it's connected to WiFi.

**Fix:** If using bridge networking, mDNS won't work. Either use `network_mode: host` or set `ESPHOME_DASHBOARD_USE_PING: "true"` and use static IPs for all devices.

### Compilation Fails with Out of Memory

**Symptom:** Firmware compilation fails with memory-related errors.

**Fix:** ESPHome compilation (especially for ESP32) can use 500 MB+ of RAM per device. Ensure your server has enough free memory. Close other memory-intensive tasks during compilation.

### OTA Update Fails

**Symptom:** "Connecting to [IP]... ERROR OTA" during wireless update.

**Fix:**
1. Verify the device is online (ping its IP)
2. Check the OTA password matches between old and new config
3. Ensure the device has enough free flash space (ESP8266 has limited space)
4. Move the device closer to your WiFi access point

### USB Device Not Found for First Flash

**Symptom:** "No serial port found" when trying to flash via USB.

**Fix:** Verify the device mapping in `docker-compose.yml`:

```bash
ls /dev/ttyUSB* /dev/ttyACM*
```

Add the correct path to the `devices:` section and restart the container.

### WiFi Connection Drops

**Symptom:** Device frequently disconnects from WiFi.

**Fix:** Add a fallback access point and increase WiFi power:

```yaml
wifi:
  ssid: "YourWiFiSSID"
  password: "YourWiFiPassword"
  power_save_mode: none  # Disable WiFi power saving
  ap:
    ssid: "Living Room Sensor Fallback"
    password: "fallback_password"
```

The `ap:` section creates a fallback access point if the device can't reach your main WiFi.

## Resource Requirements

- **RAM:** ~200 MB idle, ~500 MB+ during firmware compilation
- **CPU:** Low when idle. High during compilation (uses all available cores)
- **Disk:** ~500 MB for the application and compilation cache, growing with more device configs

## Verdict

ESPHome is the best way to build custom smart home sensors and actuators. The YAML-to-firmware approach is brilliant — you get the flexibility of custom hardware without the pain of writing embedded C++. The Home Assistant integration is seamless, and OTA updates mean you rarely need to physically touch devices after the first flash.

The main alternative is Tasmota, which uses a pre-built firmware with web-based configuration. Tasmota is simpler for off-the-shelf devices (smart plugs, bulbs), but ESPHome is better for custom sensor builds and offers tighter Home Assistant integration. If you're building custom hardware, use ESPHome. If you're flashing commodity devices, either works.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host Zigbee2MQTT](/apps/zigbee2mqtt)
- [How to Self-Host Mosquitto MQTT Broker](/apps/mosquitto)
- [How to Self-Host Node-RED](/apps/node-red)
- [Best Self-Hosted Home Automation](/best/home-automation)
- [Self-Hosted Google Home Alternatives](/replace/google-home)
- [Self-Hosted Apple HomeKit Alternatives](/replace/apple-homekit)
- [Docker Compose Basics](/foundations/docker-compose-basics)

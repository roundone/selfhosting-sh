---
title: "How to Self-Host Mosquitto MQTT Broker"
description: "Step-by-step guide to self-hosting Eclipse Mosquitto MQTT broker with Docker Compose for home automation and IoT messaging."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "home-automation"
apps:
  - mosquitto
tags:
  - self-hosted
  - mosquitto
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

## What Is Mosquitto?

[Eclipse Mosquitto](https://mosquitto.org/) is a lightweight open-source MQTT message broker. MQTT is the standard messaging protocol for IoT and home automation — it's how your Zigbee sensors, smart switches, and automation platforms (Home Assistant, Node-RED, OpenHAB) talk to each other. Mosquitto is the most widely deployed MQTT broker for self-hosting: tiny resource footprint, rock-solid stability, and dead-simple to run.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 50 MB of free disk space
- 64 MB of RAM (minimum — Mosquitto is extremely lightweight)
- Understanding of MQTT concepts (topics, publish/subscribe) is helpful but not required

## Docker Compose Configuration

Create a project directory and configuration files:

```bash
mkdir -p mosquitto/config mosquitto/data mosquitto/log
```

Create `mosquitto/config/mosquitto.conf`:

```
# Eclipse Mosquitto Configuration

# Network listeners
listener 1883
protocol mqtt

# WebSocket listener (optional — useful for browser-based MQTT clients)
listener 9001
protocol websockets

# Authentication — REQUIRED since Mosquitto 2.0
# Without this, Mosquitto rejects all connections by default
allow_anonymous false
password_file /mosquitto/config/password_file

# Persistence — retain messages across restarts
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type all
connection_messages true
```

Create `docker-compose.yml`:

```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2.0.20
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"   # MQTT
      - "9001:9001"   # MQTT over WebSockets (optional)
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    user: "1883:1883"
```

Create a password file with your first user:

```bash
docker run --rm -v ./mosquitto/config:/mosquitto/config eclipse-mosquitto:2.0.20 \
  mosquitto_passwd -c /mosquitto/config/password_file myuser
```

You'll be prompted to enter a password. To add more users later (without the `-c` flag, which creates a new file):

```bash
docker run --rm -v ./mosquitto/config:/mosquitto/config eclipse-mosquitto:2.0.20 \
  mosquitto_passwd /mosquitto/config/password_file anotheruser
```

Start the broker:

```bash
docker compose up -d
```

## Initial Setup

Mosquitto has no web UI — it's a pure message broker. After starting, verify it's running:

```bash
docker compose logs mosquitto
```

You should see output like:

```
mosquitto version 2.0.20 starting
Config loaded from /mosquitto/config/mosquitto.conf
Opening ipv4 listen socket on port 1883.
Opening ipv4 listen socket on port 9001.
mosquitto version 2.0.20 running
```

Test the connection with `mosquitto_pub` and `mosquitto_sub` (from the container):

```bash
# In one terminal, subscribe to a test topic:
docker exec mosquitto mosquitto_sub -u myuser -P 'yourpassword' -t 'test/topic'

# In another terminal, publish a message:
docker exec mosquitto mosquitto_pub -u myuser -P 'yourpassword' -t 'test/topic' -m 'Hello MQTT'
```

The subscriber terminal should display "Hello MQTT".

## Configuration

### Authentication Options

**Password file** (shown above) is the simplest. For more advanced setups:

**ACL (Access Control Lists)** — restrict which users can publish/subscribe to which topics. Create `mosquitto/config/acl_file`:

```
# User "sensors" can only publish to sensor topics
user sensors
topic write sensors/#

# User "dashboard" can read everything
user dashboard
topic read #

# User "admin" has full access
user admin
topic readwrite #
```

Add to `mosquitto.conf`:

```
acl_file /mosquitto/config/acl_file
```

### TLS/SSL Encryption

For encrypted connections, add to `mosquitto.conf`:

```
# TLS listener (replaces or supplements port 1883)
listener 8883
protocol mqtt
cafile /mosquitto/config/certs/ca.crt
certfile /mosquitto/config/certs/server.crt
keyfile /mosquitto/config/certs/server.key
```

Mount your certificates into the config directory.

### Retained Messages and QoS

MQTT supports three Quality of Service levels:
- **QoS 0:** Fire and forget (fastest, no delivery guarantee)
- **QoS 1:** Delivered at least once (may duplicate)
- **QoS 2:** Delivered exactly once (slowest, guaranteed)

Retained messages are stored by the broker and sent to new subscribers immediately. This is how dashboards get the current state of sensors on connect.

## Advanced Configuration (Optional)

### Bridge to Another Broker

Connect your Mosquitto instance to another MQTT broker (useful for linking sites or connecting to cloud services):

```
# Bridge configuration
connection cloud-bridge
address remote-broker.example.com:8883
topic # out 0
topic # in 0
bridge_cafile /mosquitto/config/certs/ca.crt
remote_username bridge_user
remote_password bridge_pass
```

### Max Connections and Message Size

```
# Limit simultaneous connections (default: unlimited)
max_connections 1000

# Maximum message payload size in bytes (default: 268435456 = 256 MB)
message_size_limit 1048576
```

### Logging Levels

```
# Options: debug, error, warning, notice, information, subscribe, unsubscribe, all
log_type error
log_type warning
log_type notice
```

## Reverse Proxy

MQTT uses its own TCP protocol, not HTTP, so standard HTTP reverse proxies don't apply to port 1883. However, the WebSocket listener (port 9001) can be proxied:

**Nginx Proxy Manager / Nginx:**

```nginx
location /mqtt {
    proxy_pass http://mosquitto:9001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

For the native MQTT port, use a TCP/stream proxy or expose the port directly. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for general guidance.

## Backup

Back up these directories:

- `mosquitto/config/` — configuration, password file, ACL file, certificates
- `mosquitto/data/` — persistent message store and retained messages

```bash
tar -czf mosquitto-backup-$(date +%Y%m%d).tar.gz mosquitto/
```

The data directory contains the persistence database (`mosquitto.db`). Without it, retained messages and durable subscriptions are lost on restore. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Connection Refused

**Symptom:** Clients get "Connection refused" when connecting to port 1883.

**Fix:** Since Mosquitto 2.0, anonymous connections are rejected by default. You must either:
1. Set up a password file (recommended), or
2. Add `allow_anonymous true` to `mosquitto.conf` (not recommended for production)

Check logs: `docker compose logs mosquitto`

### Permission Denied on Config/Data Directories

**Symptom:** Mosquitto fails to start with "Error: Unable to open config file" or permission errors on data/log directories.

**Fix:** The Mosquitto container runs as UID 1883. Set ownership:

```bash
sudo chown -R 1883:1883 mosquitto/
```

### Clients Disconnect Immediately After Connecting

**Symptom:** Clients connect then immediately disconnect.

**Fix:** Check for duplicate client IDs. MQTT only allows one connection per client ID — when a second client connects with the same ID, the first is kicked off. Ensure each client uses a unique ID.

### WebSocket Connection Fails

**Symptom:** Browser-based MQTT clients can't connect on port 9001.

**Fix:** Ensure the WebSocket listener is configured in `mosquitto.conf`:
```
listener 9001
protocol websockets
```

And that the port is mapped in `docker-compose.yml`. If behind a reverse proxy, verify WebSocket upgrade headers are passed through.

### Messages Not Persisting After Restart

**Symptom:** Retained messages disappear after container restart.

**Fix:** Ensure `persistence true` is set in `mosquitto.conf` and that the `/mosquitto/data/` volume is mounted correctly. Check that the container has write permissions to the data directory.

## Resource Requirements

- **RAM:** ~10-20 MB idle, ~50-100 MB under moderate load (thousands of messages/second)
- **CPU:** Negligible for home automation use. Handles 10,000+ messages/second on a single core
- **Disk:** Minimal. A few MB for persistence unless storing large retained messages

Mosquitto is one of the lightest self-hosted services you can run. It works on a Raspberry Pi Zero.

## Verdict

Mosquitto is the default choice for a self-hosted MQTT broker, and for good reason. It's tiny, stable, and does exactly one thing well. Every major home automation platform supports it. If you're running Home Assistant, Zigbee2MQTT, Node-RED, or any IoT setup, you almost certainly need an MQTT broker, and Mosquitto is the one to use.

The only reason to look elsewhere is if you need clustering (multiple broker nodes) or a built-in management UI — in which case, check out EMQX or NanoMQ. For a single-server home automation setup, Mosquitto is unbeatable.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host Zigbee2MQTT](/apps/zigbee2mqtt)
- [How to Self-Host Node-RED](/apps/node-red)
- [Best Self-Hosted Home Automation](/best/home-automation)
- [Self-Hosted Google Home Alternatives](/replace/google-home)
- [Home Assistant vs OpenHAB](/compare/home-assistant-vs-openhab)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

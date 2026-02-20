---
title: "Frigate vs ZoneMinder: Which NVR to Self-Host?"
description: "Frigate vs ZoneMinder compared for self-hosted video surveillance. AI detection, Home Assistant integration, and resource usage."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "video-surveillance"
apps:
  - frigate
  - zoneminder
tags:
  - comparison
  - frigate
  - zoneminder
  - self-hosted
  - nvr
  - surveillance
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Frigate is the better choice for most self-hosters. Its AI-powered object detection dramatically reduces false alerts, the Home Assistant integration is first-class, and it's designed specifically for the Docker/self-hosting ecosystem. ZoneMinder is the veteran option with more traditional DVR/NVR features but feels dated and lacks modern AI capabilities.

## Overview

Frigate and ZoneMinder are both self-hosted NVR (Network Video Recorder) systems that let you monitor security cameras without cloud subscriptions. They represent two different eras of home surveillance.

**Frigate** — MIT license, 30k GitHub stars. Built by Blake Blackshear. Uses TensorFlow for real-time AI object detection. Designed from the ground up for Home Assistant integration. Latest version: v0.16.4 (January 2026).

**ZoneMinder** — GPL-2.0 license, 5.2k GitHub stars. One of the oldest open-source NVR projects (started in 2002). Traditional motion-detection approach. Latest version: 1.36.x (2024).

## Feature Comparison

| Feature | Frigate | ZoneMinder |
|---------|---------|------------|
| AI object detection | Yes (person, car, animal, etc.) | No (motion-based only) |
| Home Assistant integration | Native (official add-on) | Via third-party integration |
| MQTT support | Yes (built-in) | No |
| Hardware acceleration | Coral TPU, NVIDIA GPU, Intel OpenVINO, AMD | Limited (VAAPI for decoding) |
| Real-time alerts | Object-based (fewer false positives) | Motion-based (many false positives) |
| 24/7 recording | Yes | Yes |
| Event-based recording | Yes (AI-triggered) | Yes (motion-triggered) |
| Live view | WebRTC, MSE, JSMPEG | MJPEG, H264 |
| Mobile app | Via Home Assistant | ZmNinja (third-party) |
| PTZ control | Yes | Yes |
| Multi-camera | Yes | Yes |
| Zone/mask editor | Yes (built-in visual editor) | Yes |
| RTSP re-streaming | Yes (reduces camera connections) | No |
| API | REST API | REST API |
| Web UI | Modern, responsive | Functional but dated |
| Default port | 5000 (web), 8554 (RTSP), 1984 (API) | 80/443 |
| Docker image | `ghcr.io/blakeblackshear/frigate` | `zoneminderhq/zoneminder` |
| License | MIT | GPL-2.0 |

## Installation Complexity

**Frigate** uses a YAML config file and runs via Docker:

```yaml
services:
  frigate:
    image: ghcr.io/blakeblackshear/frigate:0.16.4
    container_name: frigate
    restart: unless-stopped
    privileged: true
    shm_size: "256mb"
    ports:
      - "5000:5000"   # Web UI
      - "8554:8554"   # RTSP
      - "8555:8555"   # WebRTC
    volumes:
      - ./config:/config
      - /media/frigate:/media/frigate
      - type: tmpfs
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    environment:
      - FRIGATE_RTSP_PASSWORD=your-camera-password
```

You'll create a `config/config.yml` defining your cameras and detection settings. The config is straightforward — point it at your RTSP streams and Frigate handles the rest.

**ZoneMinder** has a heavier stack — it needs MySQL/MariaDB:

```yaml
services:
  zoneminder:
    image: zoneminderhq/zoneminder:latest-ubuntu22.04
    container_name: zoneminder
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - zm_data:/var/cache/zoneminder
      - zm_config:/etc/zm
    environment:
      - TZ=America/New_York
      - ZM_DB_HOST=db
      - ZM_DB_USER=zmuser
      - ZM_DB_PASS=zmpass
      - ZM_DB_NAME=zm
    depends_on:
      - db
    shm_size: "512mb"

  db:
    image: mariadb:11
    container_name: zoneminder-db
    restart: unless-stopped
    volumes:
      - zm_db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=rootpass
      - MYSQL_DATABASE=zm
      - MYSQL_USER=zmuser
      - MYSQL_PASSWORD=zmpass

volumes:
  zm_data:
  zm_config:
  zm_db:
```

ZoneMinder's web-based setup wizard is more involved. Camera configuration happens through the web UI rather than a config file, which some prefer and others find cumbersome.

Frigate's config-as-code approach is more reproducible and version-controllable.

## Performance and Resource Usage

**Frigate** is designed for efficiency. It uses hardware acceleration aggressively:
- **Google Coral TPU** (USB or PCIe) — handles AI inference at ~100 FPS with negligible CPU impact
- **NVIDIA GPU** — CUDA-accelerated decoding and detection
- **Intel OpenVINO** — uses integrated GPU on Intel CPUs
- Without hardware acceleration, CPU usage is high (~10-20% per camera for detection)

Recommended: 2 GB RAM + Coral TPU for 4-8 cameras. The Coral TPU is a ~$30 USB device that transforms Frigate's performance.

**ZoneMinder** is heavier on CPU and RAM:
- All video processing is CPU-based (limited hardware acceleration for decoding only)
- Motion detection on every frame is expensive
- Recommended: 4+ GB RAM for 4 cameras
- Database grows quickly — plan for significant disk space

Frigate with a Coral TPU uses a fraction of the resources ZoneMinder needs for the same number of cameras.

## Community and Support

**Frigate:** 30k stars, 637+ contributors, very active development with multiple releases per month. Active Discord community. Documentation at docs.frigate.video is excellent and regularly updated.

**ZoneMinder:** 5.2k stars, long-established community with forums and wiki. Development has slowed compared to its early years. Documentation exists but is aging. The ZmNinja mobile app developer stopped active development.

Frigate has the momentum. ZoneMinder has the legacy.

## Use Cases

### Choose Frigate If...

- You want AI-powered object detection (hugely reduces false alerts)
- You use Home Assistant
- You want modern, efficient hardware acceleration
- You're comfortable with YAML configuration
- You want a lightweight, Docker-native solution
- You have or are willing to buy a Coral TPU (~$30)

### Choose ZoneMinder If...

- You need a traditional, battle-tested NVR
- You prefer web-based configuration over config files
- You need advanced PTZ presets and patrol features
- You're already running ZoneMinder and it works for you
- You need features specifically built for security monitoring installations

## Final Verdict

**Frigate is the clear winner for new self-hosted NVR setups.** AI object detection is transformative — instead of hundreds of motion alerts from shadows, bugs, and wind, you get alerts only when a person, car, or animal is detected. Combined with seamless Home Assistant integration and efficient hardware acceleration, Frigate delivers a modern surveillance experience.

ZoneMinder was groundbreaking when it launched over 20 years ago, but it hasn't kept pace with modern approaches to video surveillance. Unless you have a specific feature that only ZoneMinder provides, start with Frigate.

**Recommendation:** Frigate + a $30 Coral USB TPU + any RTSP camera = a surveillance setup that rivals cloud-based systems costing $10-30/month.

## Related

- [Best Self-Hosted Video Surveillance](/best/video-surveillance)
- [Replace Ring/Nest Cameras](/replace/ring-cameras)
- [Home Assistant Setup Guide](/apps/home-assistant)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Getting Started with Self-Hosting](/foundations/getting-started)

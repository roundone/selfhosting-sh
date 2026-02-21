---
title: "Frigate vs Shinobi: Which NVR Should You Pick?"
description: "Frigate vs Shinobi comparison for self-hosted surveillance. AI-powered NVR vs Node.js video management — features, performance, verdict."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "video-surveillance"
apps:
  - frigate
  - shinobi
tags:
  - comparison
  - frigate
  - shinobi
  - nvr
  - self-hosted
  - video-surveillance
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Frigate is the better choice for almost everyone. It has purpose-built AI object detection, first-class Home Assistant integration, active development, and excellent community support. Shinobi has a more polished web UI and multi-tenant capabilities, but its development has stagnated and documentation is thin.

## Overview

**Frigate** is an open-source NVR designed around real-time AI object detection. It uses Google Coral TPUs or OpenVINO for hardware-accelerated inference, integrates natively with Home Assistant via MQTT, and stores recordings efficiently by only keeping clips with detected objects. It's the most popular NVR in the self-hosted community as of 2026.

**Shinobi** is a Node.js-based video management system that launched as a modern alternative to ZoneMinder. It features a clean web interface, WebSocket-based live streaming, multi-tenant user management, and a plugin architecture for motion detection and object recognition. Development is led by a single developer on GitLab.

## Feature Comparison

| Feature | Frigate | Shinobi |
|---------|---------|---------|
| **AI Object Detection** | Built-in (Coral TPU, OpenVINO, CPU) | Plugin-based (TensorFlow, YOLO) |
| **Home Assistant** | Native integration | Manual (API/MQTT) |
| **License** | MIT | Custom (free for personal use) |
| **Language** | Python + C++ | Node.js |
| **Web UI** | Functional, detection-focused | Modern, feature-rich |
| **Live Streaming** | WebRTC, RTSP restream, MSE | WebSocket, HLS, MJPEG |
| **Recording** | Continuous + event-based | Continuous, motion, watch-only |
| **Sub-stream Support** | Yes (detect on sub, record on main) | Yes |
| **Multi-tenant** | No | Yes (separate users, camera groups) |
| **ONVIF Discovery** | No | Yes |
| **Mobile** | Web UI (PWA) | Web UI (responsive) |
| **Birdseye View** | Yes (multi-camera overview) | Yes (monitor groups) |
| **Active Development** | Very active | Slow/sporadic |
| **GitHub/GitLab Stars** | 20,000+ | ~4,000 |

## Installation Complexity

**Frigate** deploys as a single Docker container with a YAML config file. You define cameras, detection parameters, and recording rules in `config.yml`. Getting basic recording working takes about 10 minutes. Configuring optimal AI detection (zones, masks, object filters) takes longer but the documentation is thorough.

```yaml
# Frigate config excerpt
cameras:
  front_door:
    ffmpeg:
      inputs:
        - path: rtsp://user:pass@192.168.1.100:554/stream1
          roles: [detect]
        - path: rtsp://user:pass@192.168.1.100:554/stream2
          roles: [record]
    detect:
      width: 1280
      height: 720
detectors:
  coral:
    type: edgetpu
    device: usb
```

**Shinobi** uses a Docker setup script or manual docker-compose with MariaDB. Camera setup happens through the web UI — add an RTSP URL, configure recording mode, set motion detection sensitivity. The UI is intuitive for basic setup but advanced features (plugins, API integrations) lack documentation.

Frigate's config-file approach is more reproducible and version-controllable. Shinobi's web-based setup is more approachable for first-time users but harder to replicate or back up.

## Performance and Resource Usage

| Metric | Frigate (with Coral) | Frigate (CPU only) | Shinobi |
|--------|---------------------|--------------------|---------|
| **RAM (5 cameras)** | 500 MB - 1 GB | 1 - 2 GB | 1 - 2 GB |
| **CPU (5 cameras)** | Very low (~5%) | High (~40-60%) | Moderate (~20-30%) |
| **Detection Latency** | ~100ms (Coral) | ~500ms+ (CPU) | ~500ms+ (plugin) |
| **Disk Usage** | Efficient (events only by default) | Efficient (events only) | Higher (continuous by default) |

Frigate with a Coral TPU is in a different league for AI detection performance. The $30 USB Coral handles inference at ~100ms per frame while consuming negligible CPU. Without Coral, Frigate falls back to CPU detection which is significantly slower and heavier.

Shinobi's motion detection is simpler (pixel-difference based) and lighter on CPU but produces more false positives than Frigate's AI detection. Shinobi's TensorFlow/YOLO plugins exist but are poorly documented and harder to set up.

## Community and Support

**Frigate** has a thriving community: 20,000+ GitHub stars, active Discord, extensive documentation, and deep Home Assistant forum presence. The project has multiple contributors and a healthy release cadence (v0.16.4 is current). YouTube tutorials, blog posts, and community guides are abundant.

**Shinobi** has a smaller following: ~4,000 GitLab stars, a Discord server, and a community wiki. The project is essentially maintained by one developer. Formal releases stopped in 2018 — the project uses rolling updates from the `dev` branch. Finding up-to-date documentation or community answers for specific issues can be difficult.

Frigate's community is significantly larger and more active, which matters when you need help troubleshooting camera-specific issues.

## Use Cases

### Choose Frigate If...

- You want AI-powered object detection (person, car, animal, package)
- You use Home Assistant for home automation
- You want efficient storage (only record when objects are detected)
- You prefer config-file-based setup (version controllable)
- Active development and community support matter to you
- You're willing to invest $30 in a Coral TPU for best performance

### Choose Shinobi If...

- You need multi-tenant user management (separate accounts for different users)
- You want ONVIF camera auto-discovery
- You prefer web-based configuration over config files
- You don't need AI detection and simple motion detection is sufficient
- You're running a small deployment and want a quick setup

## Final Verdict

**Frigate is the clear winner** for self-hosted video surveillance in 2026. Its AI detection with Coral TPU support is the killer feature — you get reliable person/car/animal detection with almost zero CPU overhead. Home Assistant integration turns your NVR into a smart automation trigger. The community is large, development is active, and documentation is thorough.

Shinobi's strengths (modern UI, multi-tenant) are real but niche. Its biggest weakness is the uncertain development trajectory and thin documentation. Unless you specifically need multi-tenant user management, Frigate is the better choice.

## Frequently Asked Questions

### Do I need a Coral TPU for Frigate?

No, but it's highly recommended. Frigate works with CPU-only detection or Intel OpenVINO, but a $30 USB Coral TPU reduces detection latency from ~500ms to ~100ms while cutting CPU usage dramatically. It's the best $30 upgrade for any Frigate setup.

### Can Shinobi do AI object detection like Frigate?

Shinobi has plugins for TensorFlow and YOLO object detection, but they're poorly documented, harder to configure, and lack the tight integration that Frigate has with its detection pipeline. Frigate was built from the ground up around AI detection; Shinobi added it as an afterthought.

### Can I run both to test?

Yes. Both run in Docker and can connect to the same cameras via separate RTSP streams (most cameras support multiple simultaneous RTSP connections). This is a good way to evaluate before committing.

## Related

- [How to Self-Host Frigate](/apps/frigate/)
- [How to Self-Host Shinobi](/apps/shinobi/)
- [Frigate vs ZoneMinder](/compare/frigate-vs-zoneminder/)
- [Frigate vs Blue Iris](/compare/frigate-vs-blue-iris/)
- [ZoneMinder vs Shinobi](/compare/zoneminder-vs-shinobi/)
- [Best Self-Hosted Video Surveillance](/best/video-surveillance/)
- [Replace Ring](/replace/ring/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

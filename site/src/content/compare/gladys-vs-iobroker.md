---
title: "Gladys vs ioBroker: Which to Self-Host?"
description: "Gladys Assistant vs ioBroker compared for self-hosted home automation — polished simplicity versus adapter-rich flexibility."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - gladys-assistant
  - iobroker
tags:
  - comparison
  - gladys-assistant
  - iobroker
  - self-hosted
  - home-automation
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

ioBroker is the better choice if you need broad device support and advanced dashboards. Gladys Assistant wins if you want a simpler, more focused platform with a better out-of-the-box experience. They serve different scales of smart home — Gladys for focused setups, ioBroker for extensive installations.

## Overview

Gladys Assistant is a privacy-first home automation platform built on Node.js. It focuses on a curated set of integrations with a polished UI and scene-based automations. Everything runs locally with no cloud dependency.

ioBroker is a modular Node.js platform with 600+ adapters covering virtually every smart home protocol and cloud service. It offers more flexibility and power at the cost of a steeper learning curve and less consistent UI.

## Feature Comparison

| Feature | Gladys Assistant | ioBroker |
|---------|-----------------|---------|
| Language | Node.js | Node.js |
| Integrations | ~30 curated | 600+ adapters |
| UI | Single cohesive UI | VIS, Material, Lovelace (multiple) |
| Automation | Scene builder (visual) | JavaScript, Blockly, Node-RED |
| MQTT | Built-in | Adapter |
| Zigbee | Zigbee2MQTT | Zigbee2MQTT adapter |
| Z-Wave | Z-Wave JS UI | Z-Wave JS UI |
| Docker support | Official image | Official image |
| RAM usage | 200–400 MB | 300–800 MB |
| Mobile | PWA (installable) | Web-based |
| Camera | RTSP | Via adapters |
| Telegram | Built-in | Adapter |
| CalDAV | Built-in | Adapter |

## Installation Complexity

**Gladys** deploys as a single Docker container with embedded SQLite. No external services, no adapter installation — integrations are built into the core. Setup takes minutes and the wizard guides you through device pairing.

**ioBroker** requires installing a core container, then adding adapters one by one through the admin UI. Each adapter has its own configuration panel. The flexibility is enormous, but expect to spend time configuring each integration individually.

Gladys is faster to a working setup. ioBroker is faster to a *specific* setup — because if Gladys doesn't support your device natively, you're stuck.

## Performance and Resource Usage

Both run on Node.js, so baseline resource consumption is similar. Gladys is slightly lighter (200–400 MB) because it bundles a fixed set of integrations. ioBroker's memory scales with installed adapters — a minimal install uses 300 MB, but 20+ adapters push it to 800 MB+.

Both run comfortably on a Raspberry Pi 4 (4 GB) or any modern mini PC.

## Community and Support

Gladys has a smaller, focused community — primarily French and English speaking. Documentation is clear and well-maintained. The project has a single lead developer with community contributors, which means consistent quality but limited throughput.

ioBroker has a large community, predominantly German-speaking, with improving English documentation. The adapter ecosystem benefits from many independent developers, but adapter quality and documentation vary widely.

## Use Cases

### Choose Gladys Assistant If...
- You want a simple, polished experience
- Your devices are covered by Gladys's integrations (Zigbee, Z-Wave, MQTT)
- You prefer visual scene-building for automations
- Privacy is your top priority
- You don't need 600+ integrations

### Choose ioBroker If...
- You need adapters for specific smart home brands
- You want advanced visualization with VIS dashboards
- You plan to integrate many different protocols and services
- You prefer JavaScript for custom automation logic
- You want Node-RED integration

## Final Verdict

Gladys Assistant is the better platform for users who want home automation that "just works" without extensive configuration. Its curated approach means fewer choices to make and a more consistent experience.

ioBroker is better for users who need broad device coverage and are willing to invest time configuring adapters. Its flexibility is unmatched among platforms at this level.

Both are overshadowed by [Home Assistant](/apps/home-assistant/) in terms of ecosystem size, but each carves out a valid niche — Gladys for simplicity, ioBroker for adapter breadth.

## Related

- [How to Self-Host Gladys Assistant](/apps/gladys-assistant/)
- [How to Self-Host ioBroker](/apps/iobroker/)
- [Home Assistant vs Gladys](/compare/home-assistant-vs-gladys/)
- [openHAB vs ioBroker](/compare/openhab-vs-iobroker/)
- [Domoticz vs ioBroker](/compare/domoticz-vs-iobroker/)
- [Best Self-Hosted Home Automation](/best/home-automation/)
- [Replace Google Home](/replace/google-home/)

---
title: "Best Self-Hosted Home Automation in 2026"
description: "The best self-hosted home automation platforms compared — Home Assistant, openHAB, Domoticz, Gladys, and ioBroker ranked."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - home-assistant
  - openhab
  - domoticz
  - gladys-assistant
  - iobroker
tags:
  - best
  - self-hosted
  - home-automation
  - smart-home
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | Home Assistant | 2,000+ integrations, best UI, largest community |
| Best for beginners | Home Assistant | Onboarding wizard, visual automations, great docs |
| Best lightweight | Domoticz | Runs at 50 MB RAM on a Pi Zero |
| Best for industrial protocols | openHAB | Native KNX, Modbus, EnOcean support |
| Best for privacy | Gladys Assistant | Zero cloud features by design |
| Best for JavaScript developers | ioBroker | JavaScript/TypeScript adapter architecture |

## The Full Ranking

### 1. Home Assistant — Best Overall

Home Assistant is the undisputed leader in self-hosted home automation. With 2,000+ integrations, monthly releases, native mobile apps, and the largest smart home community on the internet, it's the default recommendation for anyone who wants local control of their smart home.

The Lovelace dashboard system is highly customizable. The automation engine supports visual editing, YAML, and Node-RED. Home Assistant Assist provides local voice control. Energy monitoring is built in. The add-on ecosystem includes everything from ad blockers to media servers.

**Pros:**
- 2,000+ integrations — the largest of any platform
- Excellent mobile apps (iOS and Android)
- Monthly releases with rapid feature development
- Massive community (70K+ GitHub stars, active forums, Discord, Reddit)
- Built-in voice assistant (Assist), energy dashboard, and media control
- Device auto-discovery for most consumer hardware

**Cons:**
- Higher resource usage (~300 MB RAM idle) than lightweight alternatives
- YAML configuration can be intimidating for non-technical users
- Breaking changes occasionally occur in updates
- Full features require Home Assistant OS or Supervised install; Docker Container mode has some limitations

**Best for:** Everyone. Beginners, enthusiasts, and power users. The integration breadth and community support make it the safest choice.

[Read our full guide: [How to Self-Host Home Assistant](/apps/home-assistant)]

### 2. openHAB — Best for Protocol Diversity

openHAB is the second most mature open-source home automation platform. Its strength is vendor neutrality and deep protocol support — 400+ bindings cover everything from consumer Zigbee devices to industrial KNX and Modbus systems. The Java-based rule engine supports complex automation logic.

**Pros:**
- 400+ bindings with industrial protocol support (KNX, Modbus, EnOcean)
- Strong vendor neutrality — designed to bridge any protocol
- Modern MainUI with dashboard capabilities
- Quarterly releases with good stability
- Eclipse Foundation backing provides organizational stability
- Text-based configuration works well with version control

**Cons:**
- Java runtime uses ~500 MB RAM at baseline
- Steeper learning curve (Things → Channels → Items model)
- Smaller community than Home Assistant
- Mobile apps are basic
- Slower startup time (60-120 seconds)

**Best for:** Users with diverse protocol needs, especially industrial or niche hardware (KNX installations, Modbus sensors, EnOcean switches).

[Read our full guide: [How to Self-Host openHAB](/apps/openhab)]

### 3. ioBroker — Best for JavaScript Developers

ioBroker is a Node.js-based home automation platform popular in the German-speaking community. It uses an adapter architecture where each integration runs as a separate process, providing good isolation. If you're a JavaScript or TypeScript developer, ioBroker's scripting engine feels natural. The admin UI is functional, and the adapter count (~500) is competitive.

**Pros:**
- ~500 adapters available
- JavaScript/TypeScript scripting engine
- Adapter isolation (each runs as a separate process)
- Active community, especially in German-speaking countries
- Visualization tools (VIS editor) for custom dashboards
- Good MQTT and Zigbee2MQTT integration

**Cons:**
- Documentation primarily in German (English docs exist but are less complete)
- Higher resource usage due to Node.js multi-process architecture
- Less polished than Home Assistant's UI
- Community content and tutorials skew German-language
- More complex initial setup

**Best for:** JavaScript/TypeScript developers, users in German-speaking regions, and those who want adapter isolation for stability.

[Read our full guide: [How to Self-Host ioBroker](/apps/iobroker)]

### 4. Gladys Assistant — Best for Privacy

Gladys Assistant takes a privacy-first approach that goes beyond other platforms. There are zero cloud features — no optional sync, no telemetry, no external account creation. The UI is clean and modern, designed for simplicity over complexity. Integration support is limited (~30 protocols) but covers the essentials: Zigbee, Z-Wave, MQTT, Hue, Sonos, Tasmota.

**Pros:**
- Zero cloud connectivity by design — strongest privacy guarantee
- Clean, modern UI out of the box
- Simple setup and configuration
- Lightweight (~150 MB RAM)
- Good Zigbee and MQTT support
- Active solo developer with responsive community

**Cons:**
- Only ~30 integrations (vs 2,000+ for Home Assistant)
- Small community (~2,500 GitHub stars)
- No voice assistant support
- Limited advanced automation capabilities
- Primarily French-speaking community

**Best for:** Privacy-focused users with a small number of devices using supported protocols (Zigbee, Z-Wave, MQTT, Hue).

[Read our full guide: [How to Self-Host Gladys Assistant](/apps/gladys-assistant)]

### 5. Domoticz — Best Lightweight

Domoticz is the lightest home automation platform available. Written in C++, it runs at 50 MB RAM and starts in seconds. If you're running on a Raspberry Pi Zero, an old NAS, or any extremely constrained hardware, Domoticz is your best option. It supports Z-Wave, Zigbee, MQTT, and 433 MHz RF natively.

**Pros:**
- Extremely lightweight (50 MB RAM idle)
- Runs on Raspberry Pi Zero and similar constrained hardware
- Excellent 433 MHz RF support
- Fast startup (5-10 seconds)
- Lua/dzVents scripting for automations
- Stable and mature (since 2012)

**Cons:**
- Dated web UI
- Limited integration count (~200)
- Smaller community, slower development pace
- No native mobile apps
- No voice assistant support
- Limited dashboard customization

**Best for:** Ultra-lightweight deployments, 433 MHz RF setups, Raspberry Pi Zero users, simple monitoring setups.

[Read our full guide: [How to Self-Host Domoticz](/apps/domoticz)]

## Full Comparison Table

| Feature | Home Assistant | openHAB | ioBroker | Gladys | Domoticz |
|---------|---------------|---------|----------|--------|----------|
| Integrations | 2,000+ | 400+ | ~500 | ~30 | ~200 |
| Language | Python | Java | Node.js | Node.js | C++ |
| RAM (idle) | ~300 MB | ~500 MB | ~400 MB | ~150 MB | ~50 MB |
| Mobile apps | Native (excellent) | Basic | Community | PWA | Third-party |
| Voice control | Assist (local) | HABot (basic) | Alexa adapter | None | None |
| Automation | Visual + YAML + Node-RED | DSL + Blockly + JS | JavaScript/TS | Scene editor | Lua/dzVents |
| UI quality | Excellent | Good | Functional | Clean | Basic |
| Community size | Massive | Large | Medium | Small | Small |
| Release cadence | Monthly | Quarterly | Regular | Monthly | Irregular |
| Min hardware | Pi 4 | Pi 4 | Pi 4 | Pi 3 | Pi Zero |
| License | Apache 2.0 | EPL 2.0 | MIT | Apache 2.0 | GPLv3 |
| Zigbee | ZHA, Zigbee2MQTT | Native binding | Zigbee2MQTT adapter | Zigbee2MQTT | Via bridges |
| Z-Wave | Z-Wave JS | Native binding | Z-Wave adapter | Z-Wave JS UI | Native |
| MQTT | Native | Native binding | Native adapter | Native | Native |
| KNX | Via integration | Native binding | Adapter | No | Limited |
| Energy monitoring | Built-in | Via bindings | Via adapters | No | Via scripts |

## How We Evaluated

We evaluated each platform on: integration count and breadth, installation complexity, resource usage, UI quality, automation capabilities, community size and activity, mobile app quality, documentation, and ongoing development momentum. We weighted integration breadth and community size highest, as these most directly impact day-to-day usability.

## Related

- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host openHAB](/apps/openhab)
- [How to Self-Host ioBroker](/apps/iobroker)
- [How to Self-Host Gladys Assistant](/apps/gladys-assistant)
- [How to Self-Host Domoticz](/apps/domoticz)
- [Home Assistant vs openHAB](/compare/home-assistant-vs-openhab)
- [Home Assistant vs Domoticz](/compare/home-assistant-vs-domoticz)
- [Home Assistant vs Gladys Assistant](/compare/home-assistant-vs-gladys)
- [openHAB vs Domoticz](/compare/openhab-vs-domoticz)
- [Replace Google Home](/replace/google-home)
- [Replace Amazon Alexa](/replace/amazon-alexa)
- [Replace Apple HomeKit](/replace/apple-homekit)
- [Docker Compose Basics](/foundations/docker-compose-basics)

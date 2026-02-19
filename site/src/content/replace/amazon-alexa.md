---
title: "Self-Hosted Alternatives to Amazon Alexa"
description: "Best self-hosted alternatives to Amazon Alexa — local voice control, private smart home automation, no cloud dependency."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "home-automation"
apps:
  - home-assistant
  - openhab
  - domoticz
  - gladys-assistant
tags:
  - alternative
  - amazon-alexa
  - self-hosted
  - replace
  - smart-home
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace Amazon Alexa?

**Privacy.** Alexa records and stores your voice commands on Amazon's servers. Human reviewers have listened to recordings. Amazon has shared Alexa data with law enforcement without user consent. Your smart home activity is a data goldmine for Amazon's advertising business.

**Subscriptions.** Amazon increasingly pushes Alexa+ subscriptions. Features that were free are being paywalled. The trajectory is clear: more features behind a paywall over time.

**Reliability.** Alexa requires internet for everything — even controlling devices on your local network. Amazon outages (which happen multiple times per year) disable your smart home. In late 2024, Amazon's Alexa services experienced significant downtime affecting millions of users.

**Control.** Alexa's automation capabilities ("Routines") are limited. Complex conditional logic, multi-step automations with variables, and cross-device orchestration are either impossible or severely constrained.

**Vendor lock-in.** Alexa-compatible devices often use proprietary protocols that only work through Amazon's cloud. Self-hosted platforms use open standards (Zigbee, Z-Wave, MQTT) that don't depend on any company.

## Best Alternatives

### Home Assistant — Best Overall Replacement

Home Assistant replaces Alexa as your smart home hub with 2,000+ integrations, a powerful automation engine, and local control of all devices. The Assist voice feature provides local voice control using open-source speech-to-text and text-to-speech — no audio leaves your network.

For voice commands, you can build a local voice satellite using an ESP32 with a microphone, connected to Home Assistant's voice pipeline. It's not as polished as Alexa yet, but it works, it's private, and it's improving rapidly with every release.

Home Assistant can also control Alexa-compatible devices directly, so you don't have to replace hardware — just the brain.

[Read our full guide: [How to Self-Host Home Assistant](/apps/home-assistant)]

### openHAB — Best for Complex Setups

openHAB offers 400+ bindings for home automation devices and industrial protocols. Its rule engine supports complex automation logic in DSL, Blockly, or JavaScript. openHAB doesn't have built-in voice support like Home Assistant's Assist, but it can integrate with external voice processing if needed. The strength is in automation depth, not voice control.

[Read our full guide: [How to Self-Host openHAB](/apps/openhab)]

### Gladys Assistant — Best for Privacy

Gladys Assistant has zero cloud connectivity by design. No accounts, no telemetry, no optional cloud features. The integration list is small (~30 protocols) but covers the basics: Zigbee, Z-Wave, MQTT, Philips Hue, Sonos, Tasmota. If privacy is your #1 reason for leaving Alexa, Gladys is the strongest guarantee.

[Read our full guide: [How to Self-Host Gladys Assistant](/apps/gladys-assistant)]

### Domoticz — Best Lightweight Option

Domoticz runs home automation at 50 MB RAM. Supports Z-Wave, Zigbee, MQTT, and 433 MHz RF natively. No voice control, but solid device management and Lua-based automation. Best for simple setups on minimal hardware.

[Read our full guide: [How to Self-Host Domoticz](/apps/domoticz)]

## Migration Guide

### What You Can Migrate

- **Zigbee devices:** Re-pair with a Zigbee coordinator (ZHA or Zigbee2MQTT in Home Assistant). Zigbee devices paired to Alexa's built-in hub need to be factory-reset and re-paired.
- **Z-Wave devices:** Add to a Z-Wave JS controller. Exclusion and re-inclusion required.
- **WiFi devices:** Most WiFi smart plugs, bulbs, and switches work with Home Assistant directly (Shelly, TP-Link Kasa, Tuya/Smart Life with local tuya).
- **Automations:** Alexa Routines translate to Home Assistant automations with more power and flexibility.

### What You Lose

- **Alexa voice assistant.** No self-hosted alternative matches Alexa's natural language understanding, music integration, or skills ecosystem. Home Assistant's Assist handles basic commands but isn't a full Alexa replacement.
- **Amazon Echo hardware features.** Echo Show displays, Echo speaker groups, Drop In calling, and Alexa Guard don't have self-hosted equivalents.
- **Amazon shopping integration.** Ordering by voice, delivery tracking, and price checks are Amazon-specific.
- **Skills ecosystem.** Thousands of third-party Alexa skills (games, trivia, news briefings) don't exist in self-hosted platforms.

### Migration Steps

1. **Set up Home Assistant** ([guide](/apps/home-assistant))
2. **Get a Zigbee coordinator** — SONOFF Zigbee 3.0 USB Dongle Plus (~$25) or similar
3. **Factory-reset Zigbee devices** and re-pair with Home Assistant via ZHA or Zigbee2MQTT
4. **Add WiFi devices** via native integrations (TP-Link, Shelly, etc.) or Local Tuya for Tuya devices
5. **Recreate automations** — convert Alexa Routines to Home Assistant automations (which are more powerful)
6. **Set up voice control (optional)** — install Wyoming + Piper + Whisper for local voice processing, build an ESP32 voice satellite
7. **Set up mobile access** — install Home Assistant Companion app for remote control and notifications

## Cost Comparison

| | Amazon Alexa | Self-Hosted (Home Assistant) |
|---|-------------|---------------------------|
| Platform cost | Free (data-subsidized) | Free (open source) |
| Hardware | Echo Dot ~$50, Echo Show ~$130-250 | Mini PC ~$60-150, Zigbee dongle ~$25 |
| Subscriptions | Alexa+ subscription (growing list of paid features) | $0 (or $6.50/month for Nabu Casa cloud) |
| Annual cost (subscriptions) | Varies, trending upward | $0-78/year |
| 3-year cost | $150-500+ (hardware + subscriptions) | $85-175 (hardware, one-time) |
| Privacy | Voice recordings stored, human-reviewed | Fully local, no data collection |
| Internet required | Yes, for all functions | No (except external services) |

## What You Give Up

- **Voice assistant quality.** Alexa's natural language processing is years ahead of any self-hosted solution. For pure voice control, nothing self-hosted matches Alexa today.
- **Music and media integration.** Alexa's integration with Amazon Music, Spotify, and multi-room audio is seamless. Self-hosted alternatives exist but require more setup.
- **Plug-and-play device pairing.** "Alexa, discover my devices" is easier than configuring Zigbee2MQTT. The trade-off is flexibility and local control.
- **Third-party skills.** The Alexa Skills Store has thousands of integrations. Self-hosted platforms don't have an equivalent ecosystem.
- **Intercom and calling.** Drop In and Alexa-to-Alexa calling are Alexa-specific features without direct self-hosted replacements.

## Related

- [Best Self-Hosted Home Automation](/best/home-automation)
- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host openHAB](/apps/openhab)
- [How to Self-Host Domoticz](/apps/domoticz)
- [Replace Google Home](/replace/google-home)
- [Replace Apple HomeKit](/replace/apple-homekit)
- [Home Assistant vs openHAB](/compare/home-assistant-vs-openhab)
- [Docker Compose Basics](/foundations/docker-compose-basics)

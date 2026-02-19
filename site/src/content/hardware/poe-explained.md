---
title: "PoE Explained for Home Servers"
description: "Power over Ethernet explained simply. PoE standards, what it powers, and when you need it for your homelab and self-hosting setup."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "networking", "poe", "homelab", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is PoE?

Power over Ethernet (PoE) delivers electrical power and data over the same Ethernet cable. One cable handles both network connectivity and power — no separate power adapter needed for the device.

**The benefit:** Cleaner installations. Run one Ethernet cable to a ceiling-mounted access point instead of an Ethernet cable plus a power cable. Same for security cameras, VoIP phones, and Raspberry Pis with PoE HATs.

## PoE Standards

| Standard | Max Power (per port) | Common Name | Use Cases |
|----------|---------------------|-------------|-----------|
| IEEE 802.3af | 15.4W | PoE | VoIP phones, basic APs |
| IEEE 802.3at | 30W | PoE+ | WiFi 6 APs, IP cameras, Pi 5 |
| IEEE 802.3bt Type 3 | 60W | PoE++ | PTZ cameras, high-power APs |
| IEEE 802.3bt Type 4 | 90W | PoE++ | Laptops, thin clients, mini PCs |

**For homelab use, PoE+ (802.3at, 30W) covers everything.** WiFi access points draw 10-15W, IP cameras draw 8-12W, and a Raspberry Pi 5 with PoE HAT draws 8-12W. PoE++ is only needed for specialty equipment.

## What Can PoE Power?

| Device | Power Draw | PoE Standard Needed |
|--------|-----------|-------------------|
| WiFi access point (WiFi 6) | 10-15W | PoE or PoE+ |
| IP camera (fixed) | 5-12W | PoE |
| IP camera (PTZ) | 20-50W | PoE+ or PoE++ |
| Raspberry Pi 5 + PoE HAT | 8-12W | PoE+ |
| VoIP phone | 5-10W | PoE |
| Ubiquiti UniFi AP | 10-13W | PoE or PoE+ (varies by model) |
| Small switch (PoE-powered) | 5-10W | PoE |

**PoE cannot power:** Full-size servers, NAS devices, desktop PCs, or anything drawing more than 90W. Your [mini PC](/hardware/best-mini-pc) and NAS still need regular power adapters.

## Do You Need PoE?

### Yes, If You Have:

- **Ceiling-mounted WiFi access points.** Running a power cable to the ceiling is annoying. PoE makes AP placement flexible — one Ethernet cable does everything.
- **IP cameras.** Outdoor cameras especially benefit from single-cable installations. No weatherproof power outlet needed.
- **Raspberry Pis in remote locations.** A Pi with a PoE HAT needs only one cable from the switch. Clean installations in closets, utility rooms, or mounted behind furniture.

### No, If:

- All your devices are on a desk or shelf with easy power outlet access
- You don't have WiFi access points or IP cameras
- You're just getting started with self-hosting (focus on the server first)

## PoE Equipment for Homelab

### PoE Switches

| Switch | Ports | PoE Ports | PoE Budget | VLAN | Price |
|--------|-------|-----------|------------|------|-------|
| TP-Link TL-SG1005P | 5x 1GbE | 4x PoE | 65W | No | ~$40 |
| TP-Link TL-SG2008P | 8x 1GbE | 4x PoE+ | 62W | Yes | ~$70 |
| Ubiquiti USW-Lite-8-PoE | 8x 1GbE | 4x PoE+ | 52W | Yes | ~$110 |
| Ubiquiti USW-Lite-16-PoE | 16x 1GbE | 8x PoE+ | 45W | Yes | ~$180 |

**PoE budget** is the total power the switch can deliver across all PoE ports simultaneously. A 52W budget supports 4 devices at ~12W each, or 2 devices at ~25W each. Plan your total PoE load before buying.

### PoE Injectors (Single Device)

If you only need PoE for one or two devices, a PoE injector is cheaper than a PoE switch:

- **TP-Link TL-PoE150S** (~$18) — 802.3af/at, 30W. Inject PoE into a single Ethernet run.
- **Ubiquiti PoE adapter** (~$10-15) — included with many UniFi APs.

An injector sits between your regular switch and the PoE device, adding power to the Ethernet cable.

### PoE HATs for Raspberry Pi

- **Official Raspberry Pi PoE+ HAT** (~$20) — for Pi 4 and Pi 5. 802.3at PoE+, up to 25.5W. Includes a small fan.
- **Waveshare PoE HAT (C)** (~$15) — budget alternative for Pi 4/5.

With a PoE HAT, your Pi needs only a single Ethernet cable — no separate USB-C power adapter.

## FAQ

### Does PoE use special cables?

No. PoE works with standard Cat 5e or Cat 6 Ethernet cables — the same cables you already have. Cat 5e supports PoE up to 100 meters.

### Can PoE damage non-PoE devices?

No. PoE switches and injectors negotiate with the connected device before delivering power. If the device doesn't request PoE, no power is sent. It's safe to mix PoE and non-PoE devices on the same switch.

### Does PoE affect network speed?

No. Data and power use different wire pairs (or share pairs with no interference on newer standards). You get full Gigabit speed alongside PoE power delivery.

### How much does PoE add to my electricity bill?

The PoE switch itself draws 5-15W. Plus the power delivered to PoE devices (which would have been consumed by their individual power adapters anyway). There's ~5-10% conversion loss in the PoE switch — minor.

## Related

- [Best Managed Switches for Homelab](/hardware/managed-switch-home-lab)
- [Best Access Points for Homelab](/hardware/best-access-points)
- [Best Routers for Self-Hosting](/hardware/best-router-self-hosting)
- [Raspberry Pi as a Home Server](/hardware/raspberry-pi-home-server)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)

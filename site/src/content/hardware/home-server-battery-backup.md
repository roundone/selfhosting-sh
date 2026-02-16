---
title: "Home Server Battery Backup Guide"
description: "Complete guide to battery backup for home servers. UPS sizing, runtime calculations, NUT monitoring, and automatic shutdown with Docker."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "ups", "battery", "power"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**For a mini PC server (50-100W load):** CyberPower CP685AVRG (~$75, 685VA/390W, ~15 min runtime). **For a NAS + switch + server (200-400W load):** APC Back-UPS Pro 1500S (~$200, 1500VA/900W, ~10 min runtime). Pair either with NUT (Network UPS Tools) for automatic shutdown when battery gets low.

## Why Your Server Needs a UPS

A power outage without a UPS means:
- **Data corruption** — file writes interrupted mid-operation corrupt filesystems, databases, and Docker volumes
- **ZFS/Btrfs risk** — copy-on-write filesystems are resilient but not immune to dirty shutdowns
- **Hardware damage** — power surges when electricity returns can fry PSUs and drives
- **Downtime** — server won't restart automatically if BIOS isn't configured for it

A UPS gives you 5-30 minutes of battery power — enough for an orderly shutdown that closes databases, stops containers, and unmounts filesystems cleanly.

## UPS Types

| Type | How It Works | Switchover Time | Best For |
|------|-------------|-----------------|---------|
| **Standby** | Battery kicks in when power drops | 5-12ms | Basic protection, low loads |
| **Line-Interactive** | AVR regulates voltage; battery for outages | 2-4ms | Home servers (recommended) |
| **Online (Double Conversion)** | Battery always inline | 0ms | Critical infrastructure |

**Line-interactive is the sweet spot.** The Automatic Voltage Regulation (AVR) handles brown-outs and voltage sags without switching to battery — extending battery life. Standby UPS units drain battery on every minor fluctuation. Online UPS is overkill and expensive for home use.

## Sizing Your UPS

### Step 1: Calculate Your Load

Measure or estimate the total power draw of everything on the UPS:

| Device | Typical Draw |
|--------|-------------|
| Mini PC ([N100](/hardware/intel-n100-mini-pc)) | 8-25W |
| Desktop server (Ryzen/Intel) | 50-120W |
| [Enterprise rack server](/hardware/used-enterprise-servers) | 150-350W |
| 4-bay NAS (Synology/QNAP) | 30-50W |
| Managed switch | 10-20W |
| Router | 10-15W |
| PoE switch (with APs powered) | 30-80W |

### Step 2: Size the UPS

**Rule of thumb:** UPS VA rating should be **1.5-2x your total load in watts.** This ensures adequate runtime and doesn't stress the battery.

| Total Load | Minimum UPS | Recommended UPS |
|-----------|-------------|----------------|
| 50-100W | 500VA | 750-1000VA |
| 100-200W | 750VA | 1000-1500VA |
| 200-400W | 1000VA | 1500-2200VA |
| 400-600W | 1500VA | 2200-3000VA |

**VA vs Watts:** UPS capacity is rated in VA (volt-amperes). Watts = VA × power factor. Most UPS units have a 0.6 power factor, so a 1500VA UPS delivers 900W. Always check the watt rating, not just VA.

### Step 3: Estimate Runtime

Runtime depends on load and battery capacity. Manufacturer specs are optimistic — expect 70-80% of advertised runtime.

| UPS | Rated VA/W | Runtime @ 100W | Runtime @ 200W | Runtime @ 400W |
|-----|-----------|---------------|----------------|----------------|
| CyberPower CP685AVRG | 685/390W | 15 min | 6 min | — |
| APC Back-UPS Pro 1000 | 1000/600W | 25 min | 11 min | 4 min |
| APC Back-UPS Pro 1500S | 1500/900W | 40 min | 18 min | 8 min |
| CyberPower PR1500LCD | 1500/1050W | 35 min | 15 min | 7 min |

**You don't need 30+ minutes of runtime.** The purpose is to shut down cleanly, not ride out the outage. 5-10 minutes is enough for a graceful shutdown. Save money on a smaller UPS and invest in a proper shutdown script.

## Top UPS Picks

### CyberPower CP685AVRG — Best for Mini PC Servers

| Spec | Value |
|------|-------|
| Type | Line-interactive |
| Capacity | 685VA / 390W |
| Battery outlets | 4 |
| Surge-only outlets | 4 |
| Interface | USB (HID-compatible) |
| Runtime @ 50W | ~30 min |
| Runtime @ 100W | ~15 min |
| Price | ~$75 |

Perfect for an [Intel N100 mini PC](/hardware/intel-n100-mini-pc) + switch + router. The 50W load gives 30 minutes — more than enough.

### APC Back-UPS Pro 1500S (BR1500MS2) — Best Overall

| Spec | Value |
|------|-------|
| Type | Line-interactive (with AVR) |
| Capacity | 1500VA / 900W |
| Battery outlets | 6 |
| Surge-only outlets | 4 |
| Interface | USB (HID-compatible) |
| Runtime @ 100W | ~40 min |
| Runtime @ 200W | ~18 min |
| Runtime @ 400W | ~8 min |
| Price | ~$200 |

The homelab standard. Handles a server + NAS + networking gear comfortably. The pure sine wave output is safe for active PFC power supplies (which most modern PSUs use).

### CyberPower PR1500LCD — Best for Rack Mount

| Spec | Value |
|------|-------|
| Type | Line-interactive |
| Capacity | 1500VA / 1050W |
| Form factor | 2U rack-mountable |
| Interface | USB + serial |
| Runtime @ 200W | ~15 min |
| Price | ~$280 |

Fits in a [server rack](/hardware/home-server-rack) next to your enterprise hardware. 2U form factor, front LCD display.

## Automatic Shutdown with NUT

**NUT (Network UPS Tools)** monitors your UPS via USB and triggers a clean shutdown when battery runs low. It's the standard for Linux UPS management.

### Install NUT

```bash
sudo apt install nut
```

### Configure NUT

```bash
# /etc/nut/ups.conf
[myups]
    driver = usbhid-ups
    port = auto
    desc = "APC Back-UPS Pro 1500S"
```

```bash
# /etc/nut/upsd.conf
LISTEN 0.0.0.0 3493
```

```bash
# /etc/nut/upsd.users
[admin]
    password = changeme
    actions = SET
    instcmds = ALL

[upsmon]
    password = changeme
    upsmon master
```

```bash
# /etc/nut/upsmon.conf
MONITOR myups@localhost 1 upsmon changeme master
SHUTDOWNCMD "/sbin/shutdown -h now"
```

```bash
# /etc/nut/nut.conf
MODE=standalone
```

```bash
# Start NUT
sudo systemctl enable nut-server nut-monitor
sudo systemctl start nut-server nut-monitor

# Test
upsc myups
```

### NUT as Docker Container

If you prefer running NUT in Docker alongside your other services:

```yaml
services:
  nut-upsd:
    image: instantlinux/nut-upsd:2.8.2
    ports:
      - "3493:3493"
    devices:
      - /dev/bus/usb:/dev/bus/usb
    environment:
      - API_USER=admin
      - API_PASSWORD=changeme
      - DESCRIPTION=Home Server UPS
      - DRIVER=usbhid-ups
      - PORT=auto
    restart: unless-stopped
    privileged: true
```

### Shutdown Script

Create a script that gracefully stops Docker containers before system shutdown:

```bash
#!/bin/bash
# /usr/local/bin/graceful-shutdown.sh

# Stop Docker containers gracefully
docker stop $(docker ps -q) --time 30

# Sync filesystems
sync

# Shutdown
shutdown -h now
```

Configure NUT to call this script:

```bash
# In /etc/nut/upsmon.conf
SHUTDOWNCMD "/usr/local/bin/graceful-shutdown.sh"
```

### Multi-Server Shutdown

NUT supports a master/slave topology. The server connected to the UPS via USB is the master. Other servers on the same UPS monitor the master over the network:

**On slave servers:**
```bash
# /etc/nut/upsmon.conf
MONITOR myups@master-server-ip 1 upsmon changeme slave
SHUTDOWNCMD "/sbin/shutdown -h now"
```

The master waits for all slaves to shut down before shutting itself down.

## Monitoring UPS in Your Dashboard

### With Uptime Kuma

[Uptime Kuma](/apps/uptime-kuma) can monitor NUT status:
- Add a TCP monitor for `localhost:3493`
- Or use the NUT monitor type if your version supports it

### With Grafana + Prometheus

Use the `nut_exporter` to expose UPS metrics to [Prometheus](/apps/prometheus):

```yaml
services:
  nut-exporter:
    image: druggeri/nut_exporter:3.1.1
    ports:
      - "9199:9199"
    environment:
      - NUT_EXPORTER_SERVER=nut-upsd
    restart: unless-stopped
```

Track battery charge, load percentage, input voltage, and runtime remaining on your [Grafana](/apps/grafana) dashboard.

## Battery Maintenance

| Task | Frequency | Why |
|------|-----------|-----|
| Check battery health (self-test) | Monthly | Catches failing batteries early |
| Replace battery | Every 3-5 years | Lead-acid batteries degrade with age |
| Clean contacts | Annually | Corrosion increases resistance |
| Test shutdown script | Quarterly | Confirm the script still works |

**Self-test:**
```bash
# Trigger UPS self-test via NUT
upscmd myups test.battery.start.quick
# Check results
upsc myups ups.test.result
```

**Battery replacement:** Most UPS batteries are standard sealed lead-acid (SLA). Replacement batteries cost $20-50 — much cheaper than a new UPS. APC uses RBC-numbered batteries; CyberPower uses standard 12V 7Ah or 9Ah SLA.

## FAQ

### Do I need a pure sine wave UPS?

If your server has an active PFC power supply (most modern ATX PSUs do), yes. Simulated sine wave can cause active PFC supplies to shut down or malfunction during battery operation. All APC Back-UPS Pro and CyberPower PFC-compatible models output pure sine wave on battery.

### Can I put my UPS in a server rack?

Yes — buy a rack-mount UPS (2U form factor). The CyberPower PR1500LCD and APC SMT1500RM2U are popular rack-mount options. Tower UPS units can also sit on a rack shelf.

### How do I know when to replace the battery?

NUT reports battery health. When `battery.charge` no longer reaches 100% or runtime drops significantly, replace the battery. Most UPS units also have a "replace battery" LED/alarm.

### Should I put my modem/router on the UPS?

Yes. If the server stays up but your network goes down, remote management (SSH, iDRAC) won't work, and network-dependent services fail. Put your modem, router, and primary switch on the UPS.

## Related

- [Best UPS for Home Servers](/hardware/best-ups-home-server)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Home Server Rack Setup Guide](/hardware/home-server-rack)
- [Monitoring Your Home Server](/foundations/monitoring-basics)
- [Docker Compose Basics](/foundations/docker-compose-basics)

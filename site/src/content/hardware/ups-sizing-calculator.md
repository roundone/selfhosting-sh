---
title: "UPS Sizing Guide for Home Servers"
description: "Calculate the right UPS size for your home server. VA ratings, runtime estimates, and battery backup sizing for self-hosted infrastructure."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "ups", "power", "battery-backup"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**For a single mini PC or NAS (50–100W): a 600 VA / 360W UPS** gives you 15–30 minutes of runtime — enough for a clean shutdown. For a full homelab rack with server + switch + NAS (200–400W): a **1500 VA / 900W UPS** provides 10–20 minutes. Buy the smallest UPS that gives you at least 10 minutes of runtime at your actual load.

## Why You Need a UPS

A sudden power outage with no UPS means:
- **ZFS:** Writes in progress are lost. If you're mid-scrub, the pool may need repair.
- **Databases:** PostgreSQL, MariaDB, and Redis can corrupt data on unclean shutdown. WAL files may be incomplete.
- **Docker:** Containers with pending writes lose data. Writable overlay layers can become inconsistent.
- **Filesystems:** ext4 journals recover most corruption, but metadata-heavy operations in progress can still cause issues.
- **Hardware:** Repeated hard power-offs stress SSDs (wear leveling cache loss) and HDDs (head crash on older drives).

A UPS does two things: absorbs brief power blips (the majority of outages) and provides enough runtime for a clean shutdown during extended outages.

## UPS Basics

### VA vs Watts

UPS capacity is rated in two units:
- **VA (Volt-Amperes):** Apparent power — what the UPS can deliver
- **Watts:** Real power — what your equipment actually consumes

The relationship: **Watts = VA × Power Factor**. For typical computer loads, the power factor is 0.6–0.7, so a 1000 VA UPS delivers 600–700W of real power.

**Always size by watts, not VA.** If your gear draws 300W, you need a UPS that delivers at least 300W (typically a 500+ VA unit). Running at 60–80% of rated capacity is ideal — it maximizes runtime and battery life.

### UPS Types

| Type | Protection | Price Range | Best For |
|------|-----------|-------------|----------|
| **Standby (Offline)** | Basic: switches to battery on outage (5–12ms transfer) | $50–150 | Low-power servers, routers, switches |
| **Line-Interactive** | Better: AVR corrects voltage fluctuations without battery drain | $80–300 | Home servers, NAS, most homelabs |
| **Online (Double Conversion)** | Best: always runs on battery, zero transfer time | $300–1000+ | Critical infrastructure, sensitive equipment |

**For home servers, a line-interactive UPS is the right choice.** It handles both outages and voltage fluctuations (brownouts, surges) without burning through the battery. Standby UPS units work fine for low-power setups. Online UPS is overkill and noisy (the inverter fan runs constantly).

## Sizing Calculator

### Step 1: Measure your actual power draw

Plug a [Kill A Watt meter](https://www.p3international.com/products/p4400.html) ($20–30) between your equipment and the wall outlet. Note the idle wattage — this is what the UPS must sustain during an outage.

If you don't have a meter, use these estimates:

| Equipment | Idle Power (W) | Load Power (W) |
|-----------|---------------|----------------|
| Intel N100 mini PC | 6–10 | 20–25 |
| Dell OptiPlex Micro | 15–25 | 40–65 |
| Dell OptiPlex SFF | 25–40 | 60–100 |
| Synology DS920+ (4 HDDs) | 25–35 | 40–55 |
| Synology DS1621+ (6 HDDs) | 35–45 | 55–70 |
| Custom NAS (4 HDDs) | 40–60 | 70–100 |
| Tower server (Xeon) | 60–120 | 150–300 |
| Unmanaged 8-port switch | 5–8 | 5–8 |
| Managed 24-port switch | 15–30 | 20–40 |
| Router (consumer) | 10–15 | 10–15 |
| Raspberry Pi 4/5 | 3–5 | 7–10 |
| Cable modem | 8–12 | 8–12 |

### Step 2: Add up your total idle wattage

Example homelab:

| Device | Idle (W) |
|--------|----------|
| Dell OptiPlex Micro (server) | 20W |
| Synology DS920+ (NAS) | 30W |
| UniFi Switch 8 PoE | 15W |
| Cable modem + router | 20W |
| **Total** | **85W** |

### Step 3: Choose a UPS with adequate runtime

Target at least **10 minutes** of runtime at your actual load. This is enough for NUT (Network UPS Tools) to detect the outage and initiate a clean shutdown.

| UPS Model | VA/W Rating | Runtime at 85W | Runtime at 200W | Price (Feb 2026) |
|-----------|-------------|----------------|-----------------|------------------|
| APC BE600M1 | 600 VA / 330W | ~25 min | ~8 min | $60–80 |
| APC BR700G | 700 VA / 420W | ~30 min | ~12 min | $80–110 |
| CyberPower CP1000PFCLCD | 1000 VA / 600W | ~45 min | ~18 min | $120–150 |
| APC BR1500MS2 | 1500 VA / 900W | ~60+ min | ~25 min | $180–230 |
| CyberPower CP1500PFCLCD | 1500 VA / 1000W | ~70+ min | ~30 min | $180–220 |
| APC SMT1500 | 1500 VA / 1000W | ~65 min | ~28 min | $350–450 |

For the example homelab at 85W: the APC BE600M1 provides ~25 minutes — plenty for a clean shutdown. No need for the 1500 VA unit.

### Step 4: Verify the outlet count

UPS units have two types of outlets:
- **Battery + Surge:** Connected to the battery — these stay powered during an outage
- **Surge Only:** Surge protection but no battery backup

Put your critical equipment (server, NAS, router, switch) on the battery outlets. Non-critical items (monitors, desk lamps) go on surge-only outlets.

## Automated Shutdown with NUT

Network UPS Tools (NUT) monitors the UPS and triggers a clean shutdown when the battery gets low.

### Install NUT

```bash
sudo apt install nut
```

### Configure NUT for a USB-connected UPS

Edit `/etc/nut/ups.conf`:

```ini
[myups]
    driver = usbhid-ups
    port = auto
    desc = "APC Back-UPS"
```

Edit `/etc/nut/upsd.conf`:

```ini
LISTEN 0.0.0.0 3493
```

Edit `/etc/nut/upsd.users`:

```ini
[admin]
    password = your_secure_password
    upsmon master
```

Edit `/etc/nut/upsmon.conf`:

```ini
MONITOR myups@localhost 1 admin your_secure_password master
SHUTDOWNCMD "/sbin/shutdown -h now"
POWERDOWNFLAG /etc/killpower
```

Edit `/etc/nut/nut.conf`:

```ini
MODE=standalone
```

Start and enable:

```bash
sudo systemctl enable nut-server nut-monitor
sudo systemctl start nut-server nut-monitor
```

### Check UPS status

```bash
upsc myups
```

Key fields:
- `battery.charge`: Current battery percentage
- `battery.runtime`: Estimated runtime in seconds
- `ups.status`: OL (online/normal), OB (on battery), LB (low battery)

### NUT with Docker

Run NUT in a container and share the USB device:

```yaml
services:
  nut:
    image: instantlinux/nut-upsd:2.8.1
    restart: unless-stopped
    devices:
      - /dev/bus/usb:/dev/bus/usb
    ports:
      - "3493:3493"
    environment:
      - API_USER=admin
      - API_PASSWORD=your_secure_password
    volumes:
      - ./nut-config:/etc/nut
```

### Shutting down multiple machines

If your NAS and server are separate machines, run NUT in client mode on the secondary machine:

On the NAS (`/etc/nut/nut.conf`):

```ini
MODE=netclient
```

`/etc/nut/upsmon.conf`:

```ini
MONITOR myups@server_ip 1 admin your_secure_password slave
SHUTDOWNCMD "/sbin/shutdown -h now"
```

When the UPS hits low battery, both machines shut down cleanly.

## Battery Maintenance

### Battery lifespan

Typical UPS batteries (sealed lead-acid) last 3–5 years. Replacement batteries cost $20–50 for most consumer UPS units.

Signs the battery needs replacement:
- UPS beeps constantly or shows a "replace battery" indicator
- Runtime has dropped significantly from when it was new
- The UPS fails self-test

### Temperature matters

Battery lifespan halves for every 10°C above 25°C (77°F). Keep the UPS in a cool, ventilated location — not inside a closed cabinet or next to a heat-generating server.

### Self-test

Most UPS units run a periodic self-test (weekly by default). You can also trigger one manually:

```bash
upscmd myups test.battery.start
```

## FAQ

### Can I use a UPS for my router and modem too?
Yes, and you should. A UPS on your router + modem keeps your internet connection alive during brief outages, which means your server stays accessible remotely and monitoring alerts still work.

### How long should a UPS last before shutdown?
10 minutes is the practical minimum. This gives NUT time to detect the outage, wait for brief outages to resolve, and execute a clean shutdown. 15–20 minutes provides comfortable margin.

### Does the UPS need to power everything?
No. Only connect equipment that needs a clean shutdown (servers, NAS, network gear). Monitors, printers, and non-critical peripherals don't need battery backup.

### Should I buy APC or CyberPower?
Both are reliable. APC has broader NUT compatibility and a longer track record. CyberPower offers better value at the 1000–1500 VA range. Check NUT's hardware compatibility list before buying a less common brand.

### Can I use a car battery or lithium UPS?
LiFePO4 (lithium) UPS units exist and offer 2–3x longer battery life than lead-acid. They're more expensive upfront ($200–500) but may be cheaper over a 10-year lifespan. EcoFlow and Bluetti make home UPS units with lithium batteries.

## Related

- [Best UPS for Home Servers](/hardware/best-ups-home-server/)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Home Server Battery Backup](/hardware/home-server-battery-backup/)
- [Electricity Cost Calculator](/hardware/electricity-cost-calculator/)
- [Wake-on-LAN Guide](/hardware/wake-on-lan/)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)

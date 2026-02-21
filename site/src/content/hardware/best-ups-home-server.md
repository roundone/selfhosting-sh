---
title: "Best UPS for Home Servers in 2026"
description: "The best uninterruptible power supplies for home servers and NAS. Sizing guide, runtime estimates, and automatic shutdown configuration."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "ups", "power", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**APC Back-UPS BE600M1 (600VA, ~$65) for a single mini PC.** It gives you 20-45 minutes of runtime at 10-30W, USB connectivity for automatic shutdown, and surge protection. For a mini PC + NAS + switch setup, step up to the CyberPower CP1000PFCLCD (1000VA, ~$130) or APC BR1500MS2 (1500VA, ~$180).

## Why You Need a UPS

A sudden power loss can:
- **Corrupt databases.** PostgreSQL, MariaDB, and Redis can lose uncommitted transactions or corrupt index files during a write operation.
- **Damage ZFS pools.** While ZFS is designed to be crash-consistent, repeated unclean shutdowns stress the system. A corrupted ZFS intent log can require pool recovery.
- **Lose Docker container state.** Running containers that are mid-write when power cuts can leave corrupted configs.
- **Damage HDDs.** Heads that don't park cleanly can physically damage platters (rare on modern drives, but possible).

A UPS gives your server time to shut down gracefully. With USB connectivity and NUT (Network UPS Tools) or `apcupsd`, your server automatically shuts down when battery runs low.

## Types of UPS

### Standby (Offline) — Best for Home

Runs on mains power normally. Switches to battery when power drops. Switchover time: 5-12ms. Perfectly fine for servers — modern PSUs ride through brief interruptions.

**Examples:** APC Back-UPS BE series, CyberPower SL series.

### Line-Interactive — Best for NAS

Includes an autotransformer that regulates voltage without switching to battery. Handles brownouts (low voltage) and overvoltage without draining the battery. 2-4ms switchover.

**Examples:** APC BR (Back-UPS Pro) series, CyberPower CP PFC series.

### Online (Double Conversion) — Overkill for Home

Continuously runs on battery while charging. Zero switchover time. Expensive and generates more heat/noise. Only needed for critical enterprise infrastructure.

**Recommendation:** Line-interactive for NAS and multi-device setups. Standby for a single mini PC. Skip online/double-conversion for home use.

## Top Picks

### 1. APC Back-UPS BE600M1 — Best for Single Mini PC

| Spec | Detail |
|------|--------|
| Type | Standby |
| VA / Watts | 600VA / 330W |
| Battery | 1x sealed lead-acid |
| Outlets | 7 (5 battery + surge, 2 surge only) |
| USB | 1x USB for monitoring + 1x USB charging port |
| Runtime (10W mini PC) | ~45 minutes |
| Runtime (30W mini PC + switch) | ~15 minutes |
| Price | ~$65 |

**Best for:** A single [N100 mini PC](/hardware/best-mini-pc/) drawing 6-15W idle. 45+ minutes of runtime gives you plenty of time for automatic shutdown.

### 2. CyberPower CP1000PFCLCD — Best for Mini PC + NAS

| Spec | Detail |
|------|--------|
| Type | Line-interactive, pure sine wave |
| VA / Watts | 1000VA / 600W |
| Battery | 2x sealed lead-acid |
| Outlets | 10 (5 battery + surge, 5 surge only) |
| USB | 1x USB for monitoring |
| LCD | Yes (runtime, load, battery status) |
| Runtime (50W: mini PC + 4-bay NAS + switch) | ~15-20 minutes |
| Runtime (30W: mini PC + switch) | ~30 minutes |
| Price | ~$130 |

**Best for:** A mini PC + NAS + network switch setup. Pure sine wave output is important — some NAS devices and active PFC power supplies don't work correctly with simulated sine wave UPS units.

### 3. APC BR1500MS2 — Best for Full Homelab

| Spec | Detail |
|------|--------|
| Type | Line-interactive, sine wave |
| VA / Watts | 1500VA / 900W |
| Battery | 2x sealed lead-acid |
| Outlets | 10 (6 battery + surge, 4 surge only) |
| USB | 1x USB for monitoring |
| LCD | Yes |
| Runtime (100W: full homelab stack) | ~15-20 minutes |
| Runtime (50W: mini PC + NAS + switch) | ~30 minutes |
| Price | ~$180 |

**Best for:** Multi-device homelabs drawing 50-100W total. Enough runtime for graceful shutdown of all devices.

### 4. APC Back-UPS BE425M — Budget Option

| Spec | Detail |
|------|--------|
| Type | Standby |
| VA / Watts | 425VA / 255W |
| Outlets | 6 (4 battery + surge, 2 surge only) |
| USB | 1x USB charging port (no monitoring) |
| Runtime (10W) | ~35 minutes |
| Price | ~$45 |

**Note:** No USB monitoring port — can't trigger automatic shutdown. Suitable only if you want basic battery backup without automatic shutdown, or if you add a separate USB monitoring cable.

## Sizing Your UPS

### Calculate Your Load

Measure or estimate total wattage of everything connected to the UPS:

| Device | Typical Power |
|--------|--------------|
| N100 mini PC | 8-15W |
| N305 mini PC | 12-20W |
| Synology DS224+ (2x HDD) | 18-22W |
| Synology DS423+ (4x HDD) | 28-35W |
| 8-port Gigabit switch | 5-8W |
| WiFi access point | 8-12W |
| Raspberry Pi 5 | 5-8W |
| Cable modem/router | 10-15W |

### Choose VA Rating

**Rule of thumb:** Your UPS VA rating should be at least 1.5x your total wattage for reasonable runtime.

| Total Load | Minimum UPS | Recommended UPS | Approx. Runtime |
|-----------|-------------|----------------|----------------|
| 10-20W | 425VA | 600VA | 30-60 min |
| 20-50W | 600VA | 1000VA | 15-30 min |
| 50-100W | 1000VA | 1500VA | 15-20 min |
| 100-200W | 1500VA | 2200VA | 10-15 min |

**You don't need hours of runtime.** 10-15 minutes is enough for automatic shutdown. The UPS exists to bridge brief outages (seconds to minutes) and enable clean shutdowns during extended outages — not to keep your server running through a 3-hour blackout.

## Automatic Shutdown Configuration

### NUT (Network UPS Tools) — Recommended

NUT works on Linux, supports most USB UPS brands, and can notify multiple servers from a single UPS connection.

```bash
# Install NUT
sudo apt install nut

# Configure UPS (APC or CyberPower via USB)
sudo nano /etc/nut/ups.conf
```

Add to `ups.conf`:
```ini
[myups]
    driver = usbhid-ups
    port = auto
    desc = "Home Server UPS"
```

Configure NUT mode:
```bash
sudo nano /etc/nut/nut.conf
```

```ini
MODE=standalone
```

Configure monitor:
```bash
sudo nano /etc/nut/upsmon.conf
```

```ini
MONITOR myups@localhost 1 admin secret master
SHUTDOWNCMD "/sbin/shutdown -h +0"
```

Start NUT:
```bash
sudo systemctl enable nut-server nut-monitor
sudo systemctl start nut-server nut-monitor
```

Test:
```bash
upsc myups
# Shows battery charge, runtime, load percentage
```

### Synology DSM

Synology has built-in UPS support:
1. Connect UPS to Synology via USB
2. Control Panel → Hardware & Power → UPS
3. Enable UPS support
4. Set "Time before Synology NAS enters Safe Mode" (default: when battery is low)

### TrueNAS

1. System Settings → Services → UPS
2. Enable UPS service
3. Select driver (usually `usbhid-ups`)
4. Set shutdown mode and battery thresholds

### Multi-Device Shutdown

If one UPS protects multiple devices, use NUT's network mode. The server connected to the UPS via USB runs NUT in "master" mode. Other devices (NAS, second server) run NUT in "slave" mode, connecting over the network:

```
UPS ──USB── Server 1 (NUT master)
                  │
              Network
                  │
            Server 2 (NUT slave)
            NAS (NUT slave)
```

All devices receive the shutdown signal and power off gracefully.

## Battery Replacement

UPS batteries degrade over time. Expect to replace them every 3-5 years.

**Signs of a dying battery:**
- UPS reports low runtime even when fully charged
- UPS switches to battery during brief voltage dips that it used to handle
- Battery fails self-test

**Replacement batteries** are standard sealed lead-acid (SLA) and cost $20-40. Replace with the same specification (voltage, Ah rating). APC and CyberPower use common SLA batteries available from Amazon or battery specialty stores.

## FAQ

### Do I really need a UPS for a home server?

If you run databases (PostgreSQL, MariaDB) or ZFS: yes, strongly recommended. If you only run stateless containers (Pi-hole, reverse proxy): it's less critical but still protects your hardware and filesystem integrity. At $45-65 for a basic unit, it's cheap insurance.

### Pure sine wave vs simulated sine wave?

**Pure sine wave** if your UPS powers a NAS or any device with an active PFC power supply (most modern PSUs). Simulated sine wave can cause buzzing, overheating, or malfunction in active PFC devices. **Simulated sine wave** is fine for mini PCs with external barrel-jack power adapters.

### Can I use a UPS with a Raspberry Pi?

Yes, but standard UPS units are overkill. Consider a Pi-specific UPS HAT ($25-40) that provides battery backup directly on the GPIO header. These typically provide 30-60 minutes of runtime and signal the Pi to shut down via GPIO.

### How long does a UPS battery last?

3-5 years for sealed lead-acid batteries. Longer in cool environments (heat accelerates degradation). Set a calendar reminder to test or replace every 3 years.

### Should I put my router/modem on the UPS?

Yes, if you want network access during power outages. Your server being online is useless if the network is down. Budget 10-15W extra for modem + router.

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Best NAS for Home Servers](/hardware/best-nas/)
- [DIY NAS Build Guide](/hardware/diy-nas-build/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)

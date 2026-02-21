---
title: "Home Server Power Management"
description: "Master home server power management with CPU governors, HDD spin-down, Wake-on-LAN, UPS integration, and scheduled shutdowns to minimize electricity costs."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "foundations"
apps: []
tags: ["foundations", "power", "energy", "home-server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Power Management Matters

Your home server runs 24/7. That means home server power management is the single recurring cost you have the most control over — after your initial hardware choice. A 10W idle mini PC costs roughly $12/year in electricity. A 150W tower server costs roughly $180/year. Over five years, that is the difference between $60 and $900.

Hardware selection is the biggest power decision you will make. A modern N100 mini PC idles at 6–10W and handles dozens of Docker containers. A repurposed desktop tower idles at 60–150W doing the same work. No amount of software tuning bridges that gap.

After hardware, the highest-impact optimizations are the CPU power governor and HDD spin-down. Everything else — scheduled shutdowns, Wake-on-LAN, BIOS tweaks — provides incremental savings. This guide covers all of them, in order of impact.

## Prerequisites

- A running Linux server ([Getting Started](/foundations/getting-started/))
- Root or sudo access
- Basic command-line familiarity ([Linux Basics](/foundations/linux-basics-self-hosting/))
- A kill-a-watt meter or smart plug with power monitoring (optional but recommended)

## Measuring Power Consumption

You cannot optimize what you do not measure. Start by finding your server's actual power draw.

### Hardware Power Meters

The most accurate method is a plug-in power meter between your server and the wall outlet. Kill-a-watt meters cost $20–30 and show real-time watts, cumulative kWh, and cost projections.

Smart plugs with energy monitoring (TP-Link Kasa, Shelly Plug S) provide the same data and integrate with [Home Assistant](/apps/home-assistant/) for long-term tracking.

### Software Estimation with PowerTOP

Intel's PowerTOP estimates power consumption per component and identifies power-hungry processes:

```bash
sudo apt install powertop
sudo powertop
```

PowerTOP has four tabs — navigate with `Tab`:

- **Overview** — Top power consumers ranked by wake-ups/second
- **Idle Stats** — CPU C-state residency (deeper = less power)
- **Frequency Stats** — How often each CPU frequency is used
- **Tunables** — Auto-tunable settings with "Good" or "Bad" status

Apply all recommended tunables automatically:

```bash
sudo powertop --auto-tune
```

To make these survive reboots, create a systemd service:

```ini
# /etc/systemd/system/powertop-autotune.service
[Unit]
Description=PowerTOP auto-tune
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/powertop --auto-tune
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now powertop-autotune.service
```

### Checking Current Power Draw via RAPL

On Intel systems, Running Average Power Limit (RAPL) exposes CPU package power:

```bash
# Install turbostat (part of linux-tools)
sudo apt install linux-tools-common linux-tools-$(uname -r)

# Read CPU power draw (run for 5 seconds)
sudo turbostat --Summary --quiet --interval 5 --num_iterations 1
```

Look at the `PkgWatt` column for CPU package power consumption.

## Calculating Electricity Costs

The formula is straightforward:

**Monthly Cost = Watts × 24 hours × 30.44 days ÷ 1000 × $/kWh**

The US average electricity rate is approximately $0.16/kWh. Your rate may differ — check your utility bill.

| Idle Wattage | kWh/Month | Cost/Month ($0.16/kWh) | Cost/Year |
|-------------|-----------|----------------------|-----------|
| 5W | 3.7 | $0.58 | $7.01 |
| 10W | 7.3 | $1.17 | $14.02 |
| 25W | 18.3 | $2.93 | $35.06 |
| 50W | 36.6 | $5.86 | $70.13 |
| 75W | 54.9 | $8.79 | $105.19 |
| 100W | 73.3 | $11.72 | $140.26 |
| 150W | 109.9 | $17.58 | $210.38 |
| 200W | 146.5 | $23.44 | $281.28 |
| 300W | 219.8 | $35.17 | $421.92 |

Quick reference: **every 10W of idle power costs roughly $14/year at US average rates.** This is why hardware choice matters more than any software tweak — the difference between a 10W mini PC and a 100W tower is $126/year, every year.

For a deeper breakdown including hardware amortization, see [Home Server Cost Breakdown](/foundations/home-server-cost/).

## CPU Power States and Governors

The CPU frequency governor determines how aggressively your processor scales frequency up and down based on load. This is the single highest-impact software setting for power consumption.

### Check Current Governor

```bash
# View current governor for all cores
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Or use cpufreq-info for detailed stats
sudo apt install cpufrequtils
cpufreq-info
```

### Available Governors

| Governor | Behavior | Best For |
|----------|----------|----------|
| `performance` | Always maximum frequency | Latency-sensitive workloads, benchmarks |
| `powersave` | Always minimum frequency | Maximum power savings (often too aggressive) |
| `ondemand` | Scales up quickly on load, scales down slowly | General server use |
| `conservative` | Scales up gradually, scales down gradually | Smooth power transitions |
| `schedutil` | Kernel scheduler-driven scaling | Modern kernels (5.10+), recommended default |

**Recommendation:** Use `schedutil` on kernels 5.10+. It integrates directly with the kernel scheduler and provides the best balance of responsiveness and power savings. If `schedutil` is not available, use `ondemand`.

### Set the Governor

Temporarily (resets on reboot):

```bash
# Set schedutil on all cores
sudo cpufreq-set -g schedutil -c 0
sudo cpufreq-set -g schedutil -c 1
# Repeat for each core, or use:
echo schedutil | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

Permanently via systemd:

```ini
# /etc/systemd/system/cpu-governor.service
[Unit]
Description=Set CPU governor to schedutil

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo schedutil | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor'
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now cpu-governor.service
```

### TLP for Laptops and Portable Hardware

If your server is a repurposed laptop or uses mobile hardware, TLP provides comprehensive power management:

```bash
sudo apt install tlp tlp-rdw
sudo systemctl enable --now tlp.service
```

Edit `/etc/tlp.conf` for server-optimized settings:

```ini
# /etc/tlp.conf (key settings for a headless server)
CPU_SCALING_GOVERNOR_ON_AC=schedutil
CPU_ENERGY_PERF_POLICY_ON_AC=balance_power
CPU_BOOST_ON_AC=1

# Disable Wi-Fi power management if using Wi-Fi
WIFI_PWR_ON_AC=off

# USB autosuspend — disable for external drives
USB_AUTOSUSPEND=1
USB_EXCLUDE_BTUSB=1

# Disk settings
DISK_DEVICES="sda sdb"
DISK_APM_LEVEL_ON_AC="254 128"
DISK_SPINDOWN_TIMEOUT_ON_AC="0 12"
```

Check TLP status:

```bash
sudo tlp-stat -s
```

## HDD Spin-Down Configuration

Spinning hard drives consume 5–8W active and 0.5–1W spun down. If your server has data drives that are not accessed continuously, spinning them down saves meaningful power — especially with multiple drives.

### Check Current Settings

```bash
sudo hdparm -B -C /dev/sda
```

- `-B` shows the Advanced Power Management (APM) level (1–255)
- `-C` shows the current drive state (active/idle or standby)

### Set Spin-Down Timeout

```bash
# Spin down after 10 minutes of inactivity (value 120 = 10 minutes)
# hdparm -S values: 1-240 = value × 5 seconds, 241-251 = (value-240) × 30 minutes
sudo hdparm -S 120 /dev/sda

# Set APM level (lower = more aggressive power saving)
# 1 = max power saving, 127 = spindown permitted, 128-254 = no spindown, 255 = disable APM
sudo hdparm -B 127 /dev/sda
```

Make it persist across reboots — create a udev rule:

```bash
# /etc/udev/rules.d/69-hdparm.rules
ACTION=="add", KERNEL=="sd[a-z]", RUN+="/usr/sbin/hdparm -B 127 -S 120 /dev/%k"
```

### Caveats

- **Frequent spin-up/down cycles reduce drive lifespan.** Only enable spin-down for drives accessed infrequently (backup drives, media archives). Do not spin down your OS drive or Docker volume drive.
- **NVMe and SSDs do not benefit from spin-down.** They have no moving parts and their idle power is already minimal (1–3W). Skip this section for all-SSD setups.
- **SMART monitoring can prevent spin-down.** If you use `smartd`, configure it with `-n standby` to skip checks while drives are sleeping.

Edit `/etc/smartd.conf`:

```
/dev/sda -a -n standby,15 -o on -S on -s (S/../.././02|L/../../6/03)
```

The `-n standby,15` flag skips checks if the drive is in standby, allowing up to 15 consecutive skipped checks before forcing a wakeup.

## BIOS/UEFI Power Settings

These settings vary by motherboard, but the important ones exist on most systems. Access BIOS/UEFI by pressing `Del`, `F2`, or `F12` during POST (check your motherboard manual).

### Key Settings

| Setting | Recommended Value | Why |
|---------|------------------|-----|
| C-States | Enabled (all levels) | Allows CPU to enter deep sleep during idle. C6/C7 states save the most power. |
| Package C-State | Enabled / Auto | Allows the entire CPU package to sleep when all cores are idle. |
| SpeedStep / EIST (Intel) | Enabled | Allows dynamic frequency scaling. Required for governor control. |
| Cool'n'Quiet (AMD) | Enabled | AMD's equivalent of SpeedStep. |
| Power After AC Loss | Last State or Power On | Automatically restarts the server after a power outage. Critical for unattended operation. |
| Wake-on-LAN | Enabled | Allows remote wake from standby/shutdown. |
| ErP Ready | Disabled | ErP/EuP mode cuts standby power to near-zero but disables Wake-on-LAN. |

**The most important setting for self-hosting: "Power After AC Loss" set to "Power On" or "Last State."** Without this, a brief power blip means your server stays off until you physically press the power button.

## Wake-on-LAN Setup

Wake-on-LAN (WoL) lets you start a powered-off or suspended server remotely by sending a magic packet to its network card. Combine this with scheduled shutdowns to run the server only when needed — useful for media servers or backup targets that do not need 24/7 uptime.

### Enable WoL in the OS

First, verify your NIC supports WoL:

```bash
sudo apt install ethtool
sudo ethtool eth0 | grep -i wake
```

Look for `Supports Wake-on: pumbg` (the `g` means magic packet support) and `Wake-on: g` (currently enabled).

Enable it:

```bash
sudo ethtool -s eth0 wol g
```

Make it persist with a systemd service:

```ini
# /etc/systemd/system/wol.service
[Unit]
Description=Enable Wake-on-LAN
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/ethtool -s eth0 wol g
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now wol.service
```

Replace `eth0` with your actual interface name — check with `ip link show`.

### Sending a Wake Packet

From another machine on the same LAN:

```bash
# Install wakeonlan
sudo apt install wakeonlan

# Wake the server (use its MAC address)
wakeonlan AA:BB:CC:DD:EE:FF
```

Find the server's MAC address before shutting it down:

```bash
ip link show eth0 | grep ether
```

### Requirements

- WoL must be enabled in BIOS (see previous section)
- The sending machine must be on the same Layer 2 network (same switch/subnet)
- The server must have been shut down gracefully — WoL does not work after a hard power cut on most hardware
- ErP mode in BIOS must be disabled (it cuts standby power below what the NIC needs to listen for wake packets)

## Scheduled Shutdowns and Startups

If your server does not need 24/7 uptime — for example, a media server only used in the evenings — scheduled power management cuts costs significantly.

### Scheduled Shutdown with Cron

```bash
# Shut down at midnight every day
sudo crontab -e
```

Add:

```
0 0 * * * /sbin/shutdown -h now
```

For more on cron syntax, see [Cron Jobs for Maintenance](/foundations/linux-cron-jobs/).

### Scheduled Startup with RTC Wake

Most motherboards support RTC (Real-Time Clock) wake alarms. Set the system to wake at a specific time:

```bash
# Wake at 6:00 AM tomorrow (UTC)
echo 0 | sudo tee /sys/class/rtc/rtc0/wakealarm
echo $(date -d "tomorrow 06:00" +%s) | sudo tee /sys/class/rtc/rtc0/wakealarm

# Verify the alarm is set
cat /sys/class/rtc/rtc0/wakealarm
```

Automate it by setting the next wake alarm before each shutdown:

```bash
#!/bin/bash
# /usr/local/bin/scheduled-shutdown.sh
# Set wake alarm for 6:00 AM, then shut down

WAKE_HOUR=06
WAKE_MIN=00

# Calculate next wake time
NEXT_WAKE=$(date -d "tomorrow ${WAKE_HOUR}:${WAKE_MIN}" +%s)

# Set the RTC alarm
echo 0 > /sys/class/rtc/rtc0/wakealarm
echo "$NEXT_WAKE" > /sys/class/rtc/rtc0/wakealarm

# Shut down
/sbin/shutdown -h now
```

```bash
sudo chmod +x /usr/local/bin/scheduled-shutdown.sh
```

Then schedule it with cron:

```
0 0 * * * /usr/local/bin/scheduled-shutdown.sh
```

### Suspend vs Shutdown

| Mode | Resume Time | Power Draw | WoL Support |
|------|-------------|------------|-------------|
| Shutdown + RTC wake | 15–30 seconds | ~0.5W (standby) | Yes |
| Suspend to RAM (S3) | 2–5 seconds | 3–8W | Yes |
| Hibernate (S4) | 15–30 seconds | ~0.5W | Varies |

**Recommendation:** Use full shutdown + RTC wake or WoL for maximum savings. Suspend to RAM is faster but uses 3–8W continuously, which adds up. Hibernate is unreliable on many Linux setups with complex storage configurations.

## UPS Integration

An uninterruptible power supply (UPS) protects your server and data from power outages. For self-hosting, the key feature is automated graceful shutdown when battery runs low.

### NUT (Network UPS Tools)

NUT is the standard UPS management daemon on Linux. It supports hundreds of USB and serial UPS models.

```bash
sudo apt install nut
```

Configure the UPS driver:

```ini
# /etc/nut/ups.conf
[myups]
    driver = usbhid-ups
    port = auto
    desc = "Server UPS"
```

Configure the monitor:

```ini
# /etc/nut/upsmon.conf
MONITOR myups@localhost 1 admin password master
SHUTDOWNCMD "/sbin/shutdown -h now"
MINSUPPLIES 1
POLLFREQ 5
POLLFREQALERT 5
HOSTSYNC 15
DEADTIME 15
FINALDELAY 5
```

Set the NUT mode:

```ini
# /etc/nut/nut.conf
MODE=standalone
```

Configure user access:

```ini
# /etc/nut/upsd.users
[admin]
    password = your-secure-password-here
    upsmon master
```

Start and enable:

```bash
sudo systemctl enable --now nut-server.service
sudo systemctl enable --now nut-monitor.service
```

Verify:

```bash
upsc myups
```

This outputs battery charge, runtime, input voltage, and other status data. NUT automatically triggers a graceful shutdown when battery reaches the critical threshold (default: runtime below 30 seconds or charge below 20%).

### Sizing Your UPS

For a self-hosted server, you do not need a UPS that runs for hours. You need enough runtime for a graceful shutdown (2–3 minutes). A 600VA/360W UPS costs $60–80 and provides 5–15 minutes for a typical mini PC — more than enough.

Match your UPS VA rating to at least 1.5x your server's peak power draw. A 150W server needs a minimum 225VA UPS. A 10W mini PC works fine with the cheapest 400VA model available.

## Monitoring Power Usage

Long-term power monitoring helps you spot changes and verify optimizations.

### Smart Plug Monitoring

A smart plug with power monitoring (TP-Link Kasa EP25, Shelly Plug S) gives you accurate wall-draw measurements with historical data. Integrate with Home Assistant for dashboards and alerts.

### Software Monitoring

Integrate power data into your existing monitoring stack:

```bash
# Export RAPL power data to Prometheus (Intel systems)
# Use the node_exporter with the rapl collector enabled
# Power data appears as node_rapl_package_joules_total

# Manual reading
cat /sys/class/powercap/intel-rapl:0/energy_uj
```

For broader monitoring setup, see [Monitoring Your Home Server](/foundations/monitoring-basics/).

### What to Track

| Metric | Why | Target |
|--------|-----|--------|
| Idle power draw | Baseline cost | Below 15W for a mini PC, below 80W for a tower |
| Peak power draw | UPS sizing, outlet capacity | Know your worst case |
| Daily kWh | Electricity cost tracking | Multiply by your rate |
| Power draw after changes | Verify optimizations work | Should decrease |

## Common Mistakes

**Optimizing software before choosing efficient hardware.** You cannot tune a 150W tower down to 10W. If electricity cost matters, buy a low-power machine. This is the single highest-leverage decision.

**Spinning down drives that are accessed frequently.** Constant spin-up/down cycles shorten drive life and add latency to every access. Only spin down infrequently-accessed drives (cold storage, backup targets). Never spin down your Docker volume drive.

**Disabling C-states for "stability."** This is cargo-cult advice from the overclocking community. Modern server workloads are fine with deep C-states enabled. Disabling them wastes 5–15W continuously for no benefit.

**Forgetting "Power After AC Loss" in BIOS.** Without this set to "Power On" or "Last State," your server stays off after any power interruption. This is the number one reason unattended servers go offline.

**Using suspend instead of shutdown for scheduled downtime.** Suspend to RAM uses 3–8W. Over 12 hours of daily downtime, that is 13–35 kWh/year wasted. Full shutdown with RTC wake or WoL costs almost nothing.

**Over-sizing the UPS.** For self-hosting, you need 2–3 minutes of runtime for graceful shutdown, not 2 hours. A $70 UPS handles most home servers. Spend the savings on better hardware instead.

## Next Steps

- Measure your server's actual power draw with a kill-a-watt meter or smart plug
- Enable `schedutil` governor and PowerTOP auto-tune
- Set "Power After AC Loss" to "Power On" in BIOS
- Configure HDD spin-down for infrequently-accessed drives only
- Set up a UPS with NUT for graceful shutdown on power loss
- Integrate power monitoring into your monitoring stack

## Related

- [Home Server Cost Breakdown](/foundations/home-server-cost/) — full cost analysis including electricity
- [Monitoring Your Home Server](/foundations/monitoring-basics/) — track power usage over time
- [Systemd Service Basics](/foundations/linux-systemd/) — create persistent services for power settings
- [Cron Jobs for Maintenance](/foundations/linux-cron-jobs/) — schedule shutdowns and maintenance
- [Choosing a Linux Distro](/foundations/choosing-linux-distro/) — some distros handle power management better than others
- [Getting Started with Self-Hosting](/foundations/getting-started/) — initial server setup

## FAQ

### Does the CPU governor actually save meaningful power?

Yes. On Intel N100 hardware, switching from `performance` to `schedutil` drops idle power by 2–4W. That does not sound like much, but it is $3–6/year — and on higher-power CPUs (desktop i5/i7, Xeon), the difference is 10–20W at idle, saving $14–28/year. Combined with PowerTOP auto-tune, software settings typically reduce idle power by 15–25%.

### Should I run my server 24/7 or use scheduled shutdowns?

Run it 24/7 if you rely on always-available services — VPN, file sync, smart home, ad blocking. Use scheduled shutdowns only for servers that serve a specific time window, like a media server used in evenings. Most self-hosters need 24/7 uptime for at least some services, which makes hardware efficiency the right focus instead.

### Is it worth replacing a working tower server with a mini PC for power savings?

Do the math. If your tower idles at 100W and a mini PC idles at 10W, the annual savings are approximately $126 at $0.16/kWh. A capable N100 mini PC costs $150–200. The mini PC pays for itself in under two years while handling the same containerized workloads. If your tower is old enough that it also lacks modern efficiency features (C-states, SpeedStep), the savings are even larger.

### Do NVMe SSDs benefit from power management tuning?

Minimally. NVMe drives have built-in power state management (APST) that Linux enables by default. A typical NVMe SSD uses 1–3W active and under 50mW in the deepest sleep state. There is almost nothing to gain from manual tuning. Focus your effort on CPU governors and HDD spin-down instead.

### How much power does Docker itself add?

Essentially zero. Docker containers share the host kernel and add negligible overhead compared to running the same processes natively. The power cost comes from the workloads inside the containers, not from Docker's runtime. Running 50 idle containers uses no more power than running 5 — it is the active CPU, memory, and disk I/O inside them that matters.

---
title: "Wake-on-LAN for Home Servers: Setup Guide"
description: "Set up Wake-on-LAN on your home server to save power. Complete WoL guide covering BIOS, Linux, and remote wake tools for self-hosting."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "wake-on-lan", "power-saving", "networking"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## What Is Wake-on-LAN?

Wake-on-LAN (WoL) is a networking standard that lets you power on a computer remotely by sending a special "magic packet" over the network. The target machine's network adapter stays powered in a low-power state even when the system is off, listening for its MAC address in a broadcast packet. When it receives the magic packet, it signals the motherboard to boot.

For self-hosting, WoL lets you keep your server powered off when you don't need it and start it remotely when you do. A server that runs 8 hours a day instead of 24 cuts electricity costs by two-thirds.

## When WoL Makes Sense

WoL is ideal for:
- **Media servers** (Jellyfin/Plex) you only use evenings and weekends
- **NAS devices** accessed for occasional file transfers
- **Development servers** you spin up on demand
- **Backup servers** that only need to run during backup windows

WoL is **not** ideal for:
- Services that need 24/7 availability (Pi-hole, VPN, Home Assistant)
- Servers with frequent, unpredictable access patterns
- Critical infrastructure where boot time (30–90 seconds) is unacceptable

**The practical approach:** Run a low-power always-on device (Raspberry Pi, thin client) for 24/7 services, and use WoL to wake your big server when heavy workloads are needed.

## Setup: Step by Step

### 1. Enable WoL in BIOS/UEFI

Enter your BIOS (press F2, Del, or F12 during boot — varies by manufacturer).

Look for Wake-on-LAN under one of these menus:
- **Power Management** → Wake on LAN / PCI Wake
- **Advanced** → Network Boot / PXE
- **Remote Management** → Wake on LAN

The exact label varies:
- Dell: "Wake on LAN/WLAN"
- HP: "S5 Wake on LAN"
- Lenovo: "Wake on LAN" under Network
- ASRock/ASUS: "PCI-E Wake Up" or "Power On By PCIE"
- Gigabyte: "ErP" must be **disabled** or set to "S5 WoL"

**Critical:** If your BIOS has an "ErP" or "EuP" setting (Energy-related Products directive), **disable it**. ErP mode cuts standby power to the NIC, which prevents WoL from working.

### 2. Configure the Network Adapter on Linux

Install `ethtool`:

```bash
sudo apt install ethtool    # Debian/Ubuntu
sudo dnf install ethtool    # Fedora/RHEL
```

Check WoL support on your NIC:

```bash
sudo ethtool eth0 | grep -i wake
```

Output should include:

```
Supports Wake-on: pumbg
Wake-on: d
```

The `g` in "Supports Wake-on" means Magic Packet is supported. If `Wake-on` is `d` (disabled), enable it:

```bash
sudo ethtool -s eth0 wol g
```

### 3. Make the Setting Persistent

The `ethtool` command doesn't survive reboots. Make it persistent with a systemd service:

Create `/etc/systemd/system/wol.service`:

```ini
[Unit]
Description=Enable Wake-on-LAN
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/ethtool -s eth0 wol g
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl enable wol.service
sudo systemctl start wol.service
```

Alternatively, if you use systemd-networkd, create `/etc/systemd/network/50-wol.link`:

```ini
[Match]
MACAddress=aa:bb:cc:dd:ee:ff

[Link]
WakeOnLan=magic
```

Replace the MAC address with your NIC's actual address (find it with `ip link show`).

### 4. Configure the Network Adapter on Proxmox

Proxmox runs on Debian, so the same `ethtool` approach works. Additionally, add the WoL setting to `/etc/network/interfaces`:

```
auto vmbr0
iface vmbr0 inet static
    address 192.168.1.100/24
    gateway 192.168.1.1
    bridge-ports eth0
    bridge-stp off
    bridge-fd 0
    post-up /usr/sbin/ethtool -s eth0 wol g
```

### 5. Note Your MAC Address

You'll need the server's MAC address to send magic packets:

```bash
ip link show eth0
```

Look for the `link/ether` line — that's your MAC address (format: `aa:bb:cc:dd:ee:ff`).

## How to Send a Magic Packet

### From Linux

Install `wakeonlan`:

```bash
sudo apt install wakeonlan    # Debian/Ubuntu
```

Wake the server:

```bash
wakeonlan aa:bb:cc:dd:ee:ff
```

To send to a specific broadcast address (required if you're on a different subnet):

```bash
wakeonlan -i 192.168.1.255 aa:bb:cc:dd:ee:ff
```

### From macOS

```bash
brew install wakeonlan
wakeonlan aa:bb:cc:dd:ee:ff
```

### From Windows (PowerShell)

```powershell
$mac = 'AABBCCDDEEFF'
$magicPacket = [byte[]](,0xFF * 6) + ([byte[]]($mac -replace '..', '0x$& ' -split ' ' | Where-Object { $_ }) * 16)
$udpClient = New-Object System.Net.Sockets.UdpClient
$udpClient.Connect([System.Net.IPAddress]::Broadcast, 9)
$udpClient.Send($magicPacket, $magicPacket.Length)
$udpClient.Close()
```

### From a Phone

- **Android:** "Wake On Lan" by Mike Webb (free on Play Store)
- **iOS:** "Mocha WOL" or "RemoteBoot" (free)

### From Home Assistant

If Home Assistant is running on an always-on device, add a WoL switch to `configuration.yaml`:

```yaml
switch:
  - platform: wake_on_lan
    mac: "AA:BB:CC:DD:EE:FF"
    name: "Home Server"
    host: 192.168.1.100
```

This creates a toggle in your Home Assistant dashboard — tap it to wake your server. You can automate it with time-based or presence-based triggers.

## Remote WoL Over the Internet

WoL magic packets are broadcast-only — they don't cross routers or reach across the internet by default. To wake your server remotely:

### Option 1: Tailscale + Always-On Device (Recommended)

Run [Tailscale](/apps/tailscale/) on an always-on device (Raspberry Pi, thin client) that stays connected to your home network. SSH into that device from anywhere and send the WoL packet from there.

```bash
ssh pi@100.x.x.x "wakeonlan aa:bb:cc:dd:ee:ff"
```

This is the most secure approach — no ports exposed to the internet.

### Option 2: Port Forwarding

Forward UDP port 9 to your subnet's broadcast address on your router. This is less secure and many routers don't support forwarding to broadcast addresses.

### Option 3: VPN

If you run [WireGuard](/apps/wireguard/) or another VPN on an always-on device, connect to the VPN and send the magic packet from within your network.

## Automating Wake and Sleep

### Scheduled Wake

Some BIOS/UEFI firmware supports RTC (Real-Time Clock) wake — the system powers on at a scheduled time without any network packet. Check your BIOS for "RTC Alarm" or "Power On By RTC."

### Automatic Suspend After Idle

Configure your server to suspend when idle for a set period:

```bash
# Create /usr/local/bin/auto-suspend.sh
#!/bin/bash
IDLE_MINUTES=30
LOAD_THRESHOLD=0.1

LOAD=$(awk '{print $1}' /proc/loadavg)
ACTIVE_CONNECTIONS=$(ss -t state established | wc -l)

if (( $(echo "$LOAD < $LOAD_THRESHOLD" | bc -l) )) && [ "$ACTIVE_CONNECTIONS" -le 1 ]; then
    systemctl suspend
fi
```

Add to cron to check every 10 minutes:

```bash
*/10 * * * * /usr/local/bin/auto-suspend.sh
```

The server will suspend when load is below 0.1 and no active TCP connections exist, then wake on the next WoL packet.

## Power Savings

| Scenario | Average Watts | Annual Cost ($0.12/kWh) |
|----------|--------------|-------------------------|
| Server on 24/7 (idle) | 40W | $42 |
| Server on 24/7 (load) | 80W | $84 |
| WoL: 8h/day (idle average) | 14W avg | $15 |
| WoL: 4h/day (idle average) | 7W avg | $7 |
| Standby power (WoL enabled) | 1–3W | $1–3 |

A server that idles at 40W saves $27–35/year by running only when needed. Over a 5-year lifespan, that's $135–175 — enough to pay for the server itself if it was a refurbished mini PC.

## Troubleshooting

### Server won't wake

1. **Check BIOS settings.** ErP/EuP mode must be disabled. WoL must be enabled.
2. **Check ethtool.** Run `sudo ethtool eth0 | grep Wake` — if `Wake-on: d`, WoL is disabled at the OS level.
3. **Check the NIC LED.** When the server is off, the Ethernet port's LED should still be lit (indicating standby power). If it's dark, WoL isn't enabled in BIOS or the power supply isn't providing standby power.
4. **Check the cable.** WoL requires a wired Ethernet connection. Wi-Fi WoL exists but is unreliable on most hardware.
5. **Verify MAC address.** A typo in the MAC address is the most common cause of "it doesn't work."

### WoL works from shutdown but not suspend

Some NICs lose WoL configuration on suspend/resume. The systemd service approach (in step 3) should handle this, but you may also need to add a resume hook:

Create `/usr/lib/systemd/system-sleep/wol.sh`:

```bash
#!/bin/bash
if [ "$1" = "post" ]; then
    /usr/sbin/ethtool -s eth0 wol g
fi
```

```bash
sudo chmod +x /usr/lib/systemd/system-sleep/wol.sh
```

### WoL works on LAN but not remotely

Magic packets don't cross routers. Use one of the remote WoL methods described above (Tailscale, VPN, or port forwarding).

## FAQ

### Does WoL work over Wi-Fi?
Technically some Wi-Fi adapters support WoWLAN (Wake on Wireless LAN), but it's unreliable and depends on the adapter, driver, and access point. Always use a wired Ethernet connection for WoL.

### How much power does WoL standby use?
1–3W. The NIC's standby power comes from the 5V standby rail of the power supply. This is negligible — about $1–3/year.

### Can I wake a server behind a router from the internet?
Not directly, because magic packets are broadcast and don't cross routers. Use Tailscale, a VPN, or a port forward to an always-on device that can send the WoL packet locally.

### Does WoL work with all motherboards?
Most motherboards made after 2010 support WoL. Check your BIOS for the setting. Budget or older boards may only support WoL from sleep (S3) but not from full shutdown (S5).

## Related

- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Mini PC Power Consumption](/hardware/mini-pc-power-consumption/)
- [Low-Power Home Server](/hardware/low-power-home-server/)
- [Best UPS for Home Servers](/hardware/best-ups-home-server/)
- [Refurbished Thin Clients](/hardware/refurbished-thin-clients/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)

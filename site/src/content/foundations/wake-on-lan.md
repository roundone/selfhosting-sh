---
title: "Wake-on-LAN Setup for Self-Hosting"
description: "Complete wake on lan setup guide for home servers — enable WoL in BIOS, configure Linux with ethtool, send magic packets, and automate remote wakeups."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "wake-on-lan", "networking", "power"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Wake-on-LAN?

Wake-on-LAN (WoL) lets you power on a computer remotely by sending a special network packet called a magic packet. For self-hosting, a proper wake on lan setup means your server doesn't need to run 24/7. You boot it on demand, run your workloads, and shut it down — cutting power costs by 50-80% depending on your usage pattern.

WoL is essential for servers that don't need constant uptime. A Jellyfin media server that only runs during evenings, a backup server that wakes for nightly jobs, or a development machine you start from your phone — all perfect WoL use cases. Combined with [scheduled tasks](/foundations/linux-cron-jobs/) and auto-shutdown scripts, WoL turns a power-hungry server into an on-demand appliance.

The catch: WoL only works reliably on the local network. Over the internet, it's fragile and insecure without a VPN. Use [Tailscale](/foundations/tailscale-setup/) if you need to wake machines remotely.

## Prerequisites

- A server with a wired Ethernet connection (Wi-Fi WoL exists but is unreliable — don't bother)
- A motherboard that supports Wake-on-LAN (virtually all modern boards do)
- Linux installed on the server ([Linux Basics](/foundations/linux-basics-self-hosting/))
- Root/sudo access
- `ethtool` installed (`sudo apt install ethtool` on Debian/Ubuntu)
- A second device on the same network to send magic packets

## How WoL Works

When your server shuts down, the network interface card (NIC) stays in a low-power standby state, drawing about 1-2 watts. It listens for a specific packet — the magic packet — on the network.

A magic packet contains:

1. **6 bytes of `0xFF`** (the sync stream)
2. **The target machine's MAC address repeated 16 times** (96 bytes)

That's it — 102 bytes total. When the NIC sees its own MAC address repeated 16 times after the sync stream, it signals the motherboard to power on. The packet is typically sent as a UDP broadcast on port 9 or port 7.

The magic packet is a Layer 2 broadcast. It has no IP routing — it's flooded across the local network segment. This is why WoL works trivially on a LAN but requires workarounds for remote use.

## Enabling WoL in BIOS/UEFI

WoL must be enabled in firmware first. The setting location varies by manufacturer, but the process is the same.

1. Reboot your server and enter BIOS/UEFI (usually `F2`, `Del`, or `F12` during POST)
2. Find the power management or network settings section
3. Look for one of these labels:
   - **Wake on LAN** — enable it
   - **Wake on PCI/PCIe** — enable it (for add-in NICs)
   - **Power On By PCI-E** — enable it
   - **EuP/ErP Ready** — **disable** this (ErP compliance disables standby power to the NIC, which kills WoL)
   - **Deep Sleep** — **disable** this on some boards (same reason as ErP)
4. Save and exit

**Common BIOS locations by vendor:**

| Vendor | Typical Path |
|--------|-------------|
| ASUS | Advanced → APM Configuration → Power On By PCI-E |
| Gigabyte | Settings → Platform Power → Wake on LAN |
| ASRock | Advanced → ACPI Configuration → PCIE Devices Power On |
| MSI | Settings → Advanced → Wake Up Event Setup → Resume By PCI-E Device |
| Dell | Power Management → Wake on LAN |
| HP | Advanced → Power-On Options → Remote Wakeup |
| Lenovo | Power → Wake on LAN |
| Intel NUC | Power → Secondary Power Settings → Wake on LAN from S4/S5 |

If your BIOS has separate options for S4 (hibernate) and S5 (soft-off), enable WoL for **S5** — that's the state after a `shutdown -h now`.

## Configuring WoL in Linux

Even with BIOS enabled, Linux may disable WoL at the OS level during boot. You need to verify and enable it.

### Check Current WoL Status

```bash
# Find your Ethernet interface name
ip link show
# Look for your wired interface — usually eth0, enp0s3, enp0s25, or eno1

# Check WoL support and current setting
sudo ethtool enp0s3 | grep -i wake
```

Expected output:

```
Supports Wake-on: pumbg
Wake-on: d
```

The letters mean:

| Letter | Meaning |
|--------|---------|
| `p` | Wake on PHY activity |
| `u` | Wake on unicast message |
| `m` | Wake on multicast message |
| `b` | Wake on broadcast message |
| `g` | Wake on magic packet (this is WoL) |
| `d` | Disabled |

If `Wake-on` shows `d`, WoL is disabled at the OS level. If `Supports Wake-on` doesn't include `g`, your NIC doesn't support magic packet WoL (rare on modern hardware).

### Enable WoL

```bash
# Enable WoL for magic packets
sudo ethtool -s enp0s3 wol g

# Verify it's enabled
sudo ethtool enp0s3 | grep "Wake-on:"
# Should show: Wake-on: g
```

**This only lasts until the next reboot.** You must make it persistent.

## Making WoL Persistent Across Reboots

Linux resets ethtool settings on every boot. Pick one method to make WoL persistent.

### Method 1: systemd-networkd (Recommended for Modern Systems)

If you're using systemd-networkd (default on Ubuntu Server 20.04+, Debian 12+):

```bash
sudo nano /etc/systemd/network/50-wol.link
```

```ini
[Match]
MACAddress=aa:bb:cc:dd:ee:ff

[Link]
WakeOnLan=magic
```

Replace `aa:bb:cc:dd:ee:ff` with your server's MAC address. Find it with:

```bash
ip link show enp0s3 | grep link/ether
```

Apply the configuration:

```bash
sudo systemctl restart systemd-networkd
```

### Method 2: Netplan (Ubuntu Desktop/Server with Netplan)

If your system uses Netplan (check with `ls /etc/netplan/`):

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
      wakeonlan: true
```

Apply:

```bash
sudo netplan apply
```

### Method 3: systemd Service (Works Everywhere)

Create a oneshot service that runs ethtool at boot:

```bash
sudo nano /etc/systemd/system/wol-enable.service
```

```ini
[Unit]
Description=Enable Wake-on-LAN on enp0s3
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/ethtool -s enp0s3 wol g
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable wol-enable.service
sudo systemctl start wol-enable.service
```

### Method 4: NetworkManager (Desktop Distros)

If you're running NetworkManager:

```bash
# Find the connection name
nmcli connection show

# Enable WoL for that connection
nmcli connection modify "Wired connection 1" 802-3-ethernet.wake-on-lan magic

# Restart NetworkManager
sudo systemctl restart NetworkManager
```

### Verify After Reboot

After configuring persistence, reboot and check:

```bash
sudo reboot

# After reboot, SSH back in and verify
sudo ethtool enp0s3 | grep "Wake-on:"
# Should show: Wake-on: g
```

If it still shows `d`, your persistence method isn't working. Try a different method from the list above.

## Sending WoL Magic Packets

You need the server's **MAC address** and a tool to send the magic packet. Grab the MAC before shutting down:

```bash
ip link show enp0s3 | grep link/ether
# link/ether aa:bb:cc:dd:ee:ff brd ff:ff:ff:ff:ff:ff
```

Write this down. You'll need it every time.

### From Linux

```bash
# Install wakeonlan
sudo apt install wakeonlan    # Debian/Ubuntu
sudo dnf install wol          # Fedora

# Send magic packet
wakeonlan aa:bb:cc:dd:ee:ff

# Or specify the broadcast address (needed on some networks)
wakeonlan -i 192.168.1.255 aa:bb:cc:dd:ee:ff
```

Alternative using `etherwake`:

```bash
sudo apt install etherwake
sudo etherwake -i enp0s3 aa:bb:cc:dd:ee:ff
```

### From Windows

```powershell
# PowerShell — no extra software needed
$mac = 'AABBCCDDEEFF'
$magicPacket = [byte[]](,0xFF * 6) + (($mac -split '(.{2})' | Where-Object { $_ } | ForEach-Object { [byte]('0x' + $_) }) * 16)
$udpClient = New-Object System.Net.Sockets.UdpClient
$udpClient.Connect([System.Net.IPAddress]::Broadcast, 9)
$udpClient.Send($magicPacket, $magicPacket.Length) | Out-Null
$udpClient.Close()
```

Or use a free tool like [WakeMeOnLan](https://www.nirsoft.net/utils/wake_on_lan.html) from NirSoft — it scans your network and lets you wake devices with one click.

### From macOS

```bash
# Install via Homebrew
brew install wakeonlan

# Send magic packet
wakeonlan aa:bb:cc:dd:ee:ff
```

### From a Phone

- **Android:** [Wake On Lan](https://play.google.com/store/apps/details?id=co.uk.mrwebb.wakeonlan) (free, no ads)
- **iOS:** [Mocha WOL](https://apps.apple.com/app/mocha-wol/id422625778) (free) or [RemoteBoot WOL](https://apps.apple.com/app/remoteBoot-wol/id1137498492)

Enter your server's MAC address and the broadcast address (`192.168.1.255` for most home networks). Tap send. The server should boot within 5-10 seconds.

## WoL Over the Internet (via VPN)

Sending WoL magic packets over the internet directly is a bad idea. The magic packet is an unauthenticated UDP broadcast — anyone who knows your MAC address can wake your machine. You'd also need to forward UDP port 9 through your router and set up a directed broadcast, which most routers don't support.

**Use a VPN instead.** The approach: keep a small, low-power device (Raspberry Pi, router, or always-on NUC) on your LAN running [Tailscale](/foundations/tailscale-setup/). SSH into that device from anywhere, then send the magic packet locally.

### Setup with Tailscale

1. Install Tailscale on a device that's always on (a Pi Zero 2 W draws under 1 watt):

```bash
# On the always-on device
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

2. Install `wakeonlan` on that device:

```bash
sudo apt install wakeonlan
```

3. From anywhere in the world:

```bash
# SSH into the always-on device via Tailscale
ssh user@100.x.x.x

# Send the magic packet to your server
wakeonlan aa:bb:cc:dd:ee:ff
```

Your server boots. You can then Tailscale into the server directly once it's up (if Tailscale is configured to start at boot on the server).

This is the correct way to do remote WoL. No port forwarding, no security holes, works through any NAT or firewall.

## Automating WoL

### Scheduled Wake with a Cron Job

Run a cron job on an always-on device to wake your server on a schedule. See [Cron Jobs](/foundations/linux-cron-jobs/) for cron basics.

```bash
crontab -e
```

```cron
# Wake the server at 6 PM every day (for evening media streaming)
0 18 * * * /usr/bin/wakeonlan aa:bb:cc:dd:ee:ff

# Wake the server at 2 AM for nightly backups
0 2 * * * /usr/bin/wakeonlan aa:bb:cc:dd:ee:ff
```

Pair this with an auto-shutdown on the server itself:

```bash
# On the server — shut down at midnight if no active SSH sessions
sudo nano /usr/local/bin/auto-shutdown.sh
```

```bash
#!/bin/bash
# Shut down if no SSH sessions are active and load is low
SESSIONS=$(who | grep -c pts/)
LOAD=$(awk '{print int($1)}' /proc/loadavg)

if [ "$SESSIONS" -eq 0 ] && [ "$LOAD" -eq 0 ]; then
    /usr/sbin/shutdown -h +5 "Auto-shutdown in 5 minutes — no active sessions"
fi
```

```bash
sudo chmod +x /usr/local/bin/auto-shutdown.sh
```

Schedule it via [systemd timer](/foundations/linux-systemd/) or cron:

```cron
# Check every 30 minutes after 11 PM
*/30 23-5 * * * /usr/local/bin/auto-shutdown.sh
```

### Wake-on-LAN with Home Assistant

If you run Home Assistant, you can wake servers from automations, dashboards, or voice assistants.

Add to your `configuration.yaml`:

```yaml
wake_on_lan:

switch:
  - platform: wake_on_lan
    name: "Home Server"
    mac: "aa:bb:cc:dd:ee:ff"
    host: 192.168.1.50
    turn_off:
      service: shell_command.shutdown_server

shell_command:
  shutdown_server: "ssh -o StrictHostKeyChecking=no user@192.168.1.50 'sudo shutdown -h now'"
```

This creates a toggle switch. Turning it on sends the magic packet. Turning it off SSHes into the server and shuts it down. You can use this in automations:

```yaml
automation:
  - alias: "Wake server before Plex time"
    trigger:
      - platform: time
        at: "17:55:00"
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.home_server
```

For the SSH shutdown command to work, you need passwordless SSH from your Home Assistant host to the server. Generate an SSH key on the HA machine and add the public key to the server's `~/.ssh/authorized_keys`.

### Simple Wake Script

A wrapper script for quick use:

```bash
sudo nano /usr/local/bin/wake-server
```

```bash
#!/bin/bash
SERVER_MAC="aa:bb:cc:dd:ee:ff"
SERVER_IP="192.168.1.50"
TIMEOUT=120

echo "Sending magic packet to $SERVER_MAC..."
wakeonlan "$SERVER_MAC"

echo "Waiting for server to boot..."
SECONDS=0
while ! ping -c 1 -W 1 "$SERVER_IP" &>/dev/null; do
    if [ "$SECONDS" -ge "$TIMEOUT" ]; then
        echo "ERROR: Server did not respond within ${TIMEOUT}s"
        exit 1
    fi
    sleep 2
done

echo "Server is up after ${SECONDS}s"
```

```bash
sudo chmod +x /usr/local/bin/wake-server
```

## Troubleshooting WoL

### WoL Not Working at All

**Check 1: Is WoL enabled in BIOS?**
Reboot, enter BIOS, verify the Wake-on-LAN setting is enabled. Also check that ErP/EuP is **disabled**.

**Check 2: Is WoL enabled in Linux?**

```bash
sudo ethtool enp0s3 | grep "Wake-on:"
```

If it shows `d`, WoL is disabled at the OS level. Enable it with `sudo ethtool -s enp0s3 wol g`.

**Check 3: Are you using the right MAC address?**
Double-check with `ip link show`. A common mistake is using the Wi-Fi MAC instead of the Ethernet MAC.

**Check 4: Is the server plugged into Ethernet?**
WoL requires a wired connection. The Ethernet cable must be connected when the server is shut down. The link LEDs on the NIC should still blink/glow when the machine is off.

**Check 5: Is the PSU providing standby power?**
The power supply must be switched on (rear toggle) and plugged in. ATX standby power (5VSB) keeps the NIC alive.

### WoL Works Once, Then Stops

This usually means Linux is disabling WoL during shutdown. Some network drivers reset WoL settings when the interface goes down.

Fix: create a shutdown hook:

```bash
sudo nano /etc/systemd/system/wol-shutdown.service
```

```ini
[Unit]
Description=Re-enable WoL before shutdown
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/ethtool -s enp0s3 wol g

[Install]
WantedBy=halt.target reboot.target shutdown.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable wol-shutdown.service
```

### WoL Works from One Device but Not Another

The sending device must be on the same broadcast domain (same subnet/VLAN). If you have VLANs, the magic packet won't cross VLAN boundaries unless your router/switch is configured to relay broadcasts. See [Subnets and VLANs](/foundations/subnets-vlans/).

### Server Wakes Up Randomly

Something on your network is sending packets that the NIC interprets as a wake event. Fix by restricting WoL to magic packets only:

```bash
# Use 'g' only — not 'ug' or 'bg'
sudo ethtool -s enp0s3 wol g
```

Also check BIOS for "Wake on LAN from S1-S3" — disable this unless you specifically need it. Some boards wake on any network activity in light sleep states.

## Common Mistakes

**Using Wi-Fi instead of Ethernet.** Wi-Fi WoL (WoWLAN) is a different standard, requires specific driver support, and is unreliable. Always use a wired Ethernet connection.

**Forgetting to disable ErP/EuP in BIOS.** The EU Energy-related Products directive compliance mode cuts standby power to under 0.5W — which starves the NIC. WoL requires about 1-2W of standby power.

**Not making ethtool settings persistent.** Running `ethtool -s enp0s3 wol g` once works until the next reboot. Use one of the persistence methods above.

**Trying WoL over the internet without a VPN.** Magic packets are Layer 2 broadcasts. They don't route across the internet. Even with port forwarding tricks, ARP entries expire after a few minutes, making it unreliable. Use [Tailscale](/foundations/tailscale-setup/).

**Wrong broadcast address.** If `wakeonlan aa:bb:cc:dd:ee:ff` doesn't work, try specifying the broadcast address explicitly: `wakeonlan -i 192.168.1.255 aa:bb:cc:dd:ee:ff`. The default broadcast `255.255.255.255` doesn't work on all systems.

## Next Steps

- **Set up power management policies** to auto-shutdown your server during idle periods — [Power Management](/foundations/power-management/)
- **Configure Tailscale** for secure remote WoL — [Tailscale Setup](/foundations/tailscale-setup/)
- **Create systemd services** for your WoL automation — [Linux systemd](/foundations/linux-systemd/)
- **Schedule wake/sleep cycles** with cron — [Cron Jobs](/foundations/linux-cron-jobs/)
- **Segment your network** to control WoL broadcast domains — [Home Network Setup](/foundations/home-network-setup/)

## Related

- [Power Management for Home Servers](/foundations/power-management/)
- [Home Network Setup for Self-Hosting](/foundations/home-network-setup/)
- [Tailscale Setup for Self-Hosting](/foundations/tailscale-setup/)
- [Linux systemd Basics](/foundations/linux-systemd/)
- [Cron Jobs for Server Maintenance](/foundations/linux-cron-jobs/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Subnets and VLANs](/foundations/subnets-vlans/)

## FAQ

### Does Wake-on-LAN work over Wi-Fi?

Technically, WoWLAN (Wake on Wireless LAN) exists, but it's unreliable. Most Wi-Fi chipsets don't support it, and those that do require specific driver configurations that vary by chipset and kernel version. Use a wired Ethernet connection — it works consistently across all hardware.

### How much power does WoL use in standby?

A server in S5 (soft-off) with WoL enabled draws 1-3 watts from the power supply. The NIC stays in a low-power listening mode. Over a month, that's roughly $0.01-0.03 in electricity — negligible compared to the 50-150W a running server draws.

### Can I wake a server on a different VLAN or subnet?

Not directly. Magic packets are Layer 2 broadcasts and don't cross VLAN or subnet boundaries. You need a device on the same VLAN as the target server to send the packet. Alternatively, some managed switches support "directed broadcast" or "IP helper" forwarding for WoL packets, but this is switch-dependent and adds complexity. The simpler approach: put a low-power device (Pi Zero) on the same VLAN and SSH into it to send the packet.

### Is Wake-on-LAN secure?

The magic packet has no authentication. Anyone on your local network who knows the MAC address can wake your machine. On a trusted home network, this is a non-issue. Never expose WoL to the internet — use a VPN like [Tailscale](/foundations/tailscale-setup/) for remote wakeups.

### Does WoL work after a power outage?

It depends on your BIOS setting for "AC Power Recovery" or "After Power Loss." If set to "Power Off" (the default), the machine stays off after power returns but WoL will work once standby power is restored. If set to "Power On," the machine boots automatically when power returns — which may be what you want for a server anyway. WoL itself works fine after power is restored as long as the PSU is receiving mains power.

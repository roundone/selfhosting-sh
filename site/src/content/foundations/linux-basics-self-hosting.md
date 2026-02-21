---
title: "Linux Basics for Self-Hosting"
description: "Essential Linux commands and concepts every self-hoster needs — file navigation, package management, process control, and system administration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "linux", "basics", "ubuntu", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What You Need to Know

Linux is the operating system your self-hosting server runs. You do not need to be a Linux expert to self-host — you need about 20 commands and a few core concepts. This guide covers exactly what a self-hoster uses daily: navigating files, installing software, managing services, and troubleshooting problems.

Ubuntu Server 24.04 LTS is the recommended distribution for self-hosting. It has the largest community, the most Docker documentation, and five years of security updates. Everything in this guide uses Ubuntu/Debian commands.

## Prerequisites

- A Linux server (Ubuntu Server 24.04 LTS recommended) — see [Getting Started](/foundations/getting-started/)
- SSH access to your server ([SSH Setup Guide](/foundations/ssh-setup/))

## Navigating the File System

### Essential Commands

```bash
# Print current directory
pwd

# List files (long format, human-readable sizes, including hidden)
ls -lah

# Change directory
cd /opt/myapp
cd ..           # Go up one level
cd ~            # Go to home directory
cd -            # Go to previous directory

# Create directories
mkdir myapp
mkdir -p apps/immich/data    # Create nested directories

# Copy files and directories
cp file.txt backup.txt
cp -r myapp/ myapp-backup/   # Copy directory recursively

# Move/rename files
mv file.txt newname.txt
mv myapp/ /opt/myapp/

# Remove files and directories
rm file.txt
rm -r myapp/        # Remove directory recursively
rm -rf myapp/       # Force remove without prompts (be careful)
```

### Important Directories for Self-Hosting

| Directory | What's There |
|-----------|-------------|
| `/opt/` | Common location for self-hosted app directories |
| `/home/username/` | Your user's home directory |
| `/etc/` | System configuration files |
| `/var/log/` | System and application logs |
| `/var/lib/docker/` | Docker's data (images, containers, volumes) |
| `/mnt/` or `/media/` | Mounted external drives |
| `/tmp/` | Temporary files (cleared on reboot) |

## Reading and Editing Files

```bash
# View entire file
cat file.txt

# View file with pagination (scroll with arrows, quit with q)
less file.txt

# View first/last 20 lines
head -20 file.txt
tail -20 file.txt

# Watch a log file in real-time (Ctrl+C to stop)
tail -f /var/log/syslog

# Search inside files
grep "error" /var/log/syslog
grep -r "password" /opt/myapp/     # Search recursively in directory
grep -i "warning" logfile.txt      # Case-insensitive search
```

### Text Editors

**nano** — the simplest editor, pre-installed on Ubuntu:

```bash
nano /opt/myapp/docker-compose.yml
```

Key bindings: `Ctrl+O` save, `Ctrl+X` exit, `Ctrl+W` search, `Ctrl+K` cut line.

**vim** — more powerful, steeper learning curve:

```bash
vim /opt/myapp/docker-compose.yml
```

Survival basics: press `i` to type, press `Esc` then `:wq` to save and quit, `:q!` to quit without saving.

**The recommendation:** Use nano. It works like a normal text editor. Learn vim later if you want to, but nano handles every self-hosting editing task.

## Package Management (apt)

Ubuntu uses `apt` for installing, updating, and removing software.

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install a package
sudo apt install curl wget git htop -y

# Remove a package
sudo apt remove nginx
sudo apt autoremove -y      # Clean up unused dependencies

# Search for a package
apt search redis
```

### Keep Your System Updated

Run this regularly (weekly is sufficient for a self-hosting server):

```bash
sudo apt update && sudo apt upgrade -y
```

For automatic security updates:

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

This installs security patches automatically without upgrading major package versions.

## Users and sudo

Linux is a multi-user system. You should not run everything as `root`.

```bash
# Check who you are
whoami

# Run a command as root
sudo apt update

# Switch to root (not recommended for daily use)
sudo -i

# Create a new user
sudo adduser deploy

# Add user to sudo group
sudo usermod -aG sudo deploy

# Add user to docker group (so they can run docker without sudo)
sudo usermod -aG docker deploy
```

**The recommendation:** Create a non-root user for daily operations. Add it to the `docker` and `sudo` groups. Only use `sudo` when a command specifically needs root access. See [Linux Permissions](/foundations/linux-permissions/) for deeper coverage.

## Process and Service Management

### Checking What's Running

```bash
# Show all running processes
ps aux

# Interactive process viewer (like Task Manager)
htop

# Show system resource usage
free -h          # Memory
df -h            # Disk space
du -sh /opt/*    # Size of directories in /opt
```

### systemd Services

Most server software (including Docker) runs as systemd services. Key commands:

```bash
# Check service status
sudo systemctl status docker
sudo systemctl status ssh

# Start/stop/restart services
sudo systemctl start docker
sudo systemctl stop nginx
sudo systemctl restart docker

# Enable/disable service at boot
sudo systemctl enable docker     # Start on boot
sudo systemctl disable nginx     # Don't start on boot

# View service logs
sudo journalctl -u docker --since "1 hour ago"
sudo journalctl -u docker -f    # Follow logs in real-time
```

See [systemd Services](/foundations/linux-systemd/) for a deeper guide.

## Networking Commands

```bash
# Show IP addresses
ip addr show
# or the shorter version
ip a

# Show listening ports
sudo ss -tlnp

# Test if a port is reachable
curl -I http://localhost:8080

# Test DNS resolution
dig example.com +short
nslookup example.com

# Test network connectivity
ping -c 4 8.8.8.8

# Show active network connections
sudo ss -tnp
```

For networking concepts, see [DNS Explained](/foundations/dns-explained/) and [Ports Explained](/foundations/ports-explained/).

## Disk and Storage

```bash
# Show disk usage summary
df -h

# Show directory sizes
du -sh /opt/*
du -sh /var/lib/docker

# List block devices (disks and partitions)
lsblk

# Mount an external drive
sudo mount /dev/sdb1 /mnt/external

# Auto-mount on boot (add to /etc/fstab)
# Get the UUID first
sudo blkid /dev/sdb1
# Add a line to /etc/fstab:
# UUID=xxxx-xxxx /mnt/external ext4 defaults 0 2
```

For storage management with Docker, see [Docker Volumes](/foundations/docker-volumes/).

## Essential Utilities

Install these immediately on a new server:

```bash
sudo apt install -y \
  curl \         # HTTP requests
  wget \         # File downloads
  git \          # Version control
  htop \         # Process viewer
  ncdu \         # Disk usage analyzer (interactive)
  net-tools \    # ifconfig, netstat (legacy but useful)
  dnsutils \     # dig, nslookup
  tree \         # Directory tree visualization
  jq \           # JSON parser (useful for Docker/API output)
  unzip          # Extract zip files
```

## Practical Examples

### Set Up a Directory for a New App

```bash
# Create app directory structure
sudo mkdir -p /opt/immich/{data,uploads,db}

# Set ownership to your user
sudo chown -R $USER:$USER /opt/immich

# Create the Docker Compose file
nano /opt/immich/docker-compose.yml

# Start the app
cd /opt/immich && docker compose up -d
```

### Check Why an App Is Not Working

```bash
# Check if the container is running
docker ps -a

# Check container logs
docker logs immich-server --tail 50

# Check if the port is listening
sudo ss -tlnp | grep 2283

# Check disk space (maybe it's full)
df -h

# Check memory (maybe OOM killed the container)
free -h
dmesg | tail -20
```

### Monitor System Resources

```bash
# Quick system overview
htop

# Check disk usage by Docker
docker system df

# Find large files
sudo ncdu /

# Check for OOM kills
dmesg | grep -i "oom"
```

## Common Mistakes

### Running everything as root
Use a regular user with `sudo` for privilege elevation. Running everything as root means a single mistake (like `rm -rf /`) has no safety net. Docker should be run as your user (add yourself to the docker group), not as root.

### Not checking disk space before it's full
Docker images and volumes consume disk space silently. A full disk causes containers to crash, databases to corrupt, and the system to become unresponsive. Monitor with `df -h` regularly and set up [monitoring](/foundations/monitoring-basics/).

### Editing config files without a backup
Before editing any critical file:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

If your edit breaks something, restore the backup.

### Using `rm -rf` carelessly
There is no "Recycle Bin" in Linux. `rm -rf` permanently deletes files with no confirmation and no recovery. Double-check the path before pressing Enter. Use `ls` first to preview what would be deleted.

### Ignoring system updates
Unpatched systems get compromised. At minimum, enable automatic security updates with `unattended-upgrades`.

## Next Steps

- Learn about [Linux file permissions](/foundations/linux-permissions/)
- Set up [SSH key authentication](/foundations/ssh-setup/)
- Configure a [firewall with UFW](/foundations/firewall-ufw/)
- Install [Docker and Docker Compose](/foundations/docker-compose-basics/)
- Understand [systemd services](/foundations/linux-systemd/)

## FAQ

### Which Linux distribution should I use for self-hosting?
Ubuntu Server 24.04 LTS. It has the largest community, the best Docker documentation, and 5 years of support. Debian 12 is the lightweight alternative with longer support cycles. Avoid desktop distributions on servers — they waste resources on a GUI you will never use.

### Do I need to know Linux well to self-host?
No. The 20 commands in this guide cover 95% of daily self-hosting tasks. Docker abstracts away most software management — you rarely need to configure anything at the OS level beyond what's in this guide.

### How do I keep my server secure?
Four things: SSH key authentication (disable password login), UFW firewall (only open needed ports), fail2ban (block brute-force attempts), and automatic security updates. See [SSH Setup](/foundations/ssh-setup/), [UFW Firewall](/foundations/firewall-ufw/), and [Fail2ban](/foundations/fail2ban/).

### Should I use a GUI on my server?
No. A GUI consumes RAM and CPU that your self-hosted apps could use. Manage everything over SSH. For Docker management with a web UI, use [Portainer](/apps/portainer/) or [Dockge](/apps/dockge/) — they run as containers, not as a desktop environment.

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Linux Permissions](/foundations/linux-permissions/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [Docker Volumes](/foundations/docker-volumes/)

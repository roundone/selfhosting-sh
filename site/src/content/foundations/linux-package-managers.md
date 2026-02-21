---
title: "Linux Package Managers for Self-Hosting"
description: "A practical linux package manager guide covering APT, DNF, and Pacman — install software, manage updates, and keep your self-hosting server secure."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "linux", "package-manager", "apt", "dnf", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Package Managers?

A package manager is how your Linux server installs, updates, and removes software. If you have ever run `sudo apt install curl`, you have used one. This linux package manager guide covers the three you will encounter on self-hosting servers: APT (Debian/Ubuntu), DNF (Fedora/RHEL), and Pacman (Arch). You need to understand your package manager to keep your server patched, install dependencies for Docker and other tools, and add third-party repositories without compromising security.

For most self-hosting setups, **APT on Ubuntu Server 24.04 LTS is the right choice.** It has the largest community, the most Docker documentation, and five years of security updates. Everything in this guide applies to all three package managers, but APT gets the most coverage because that is what you should be running.

## Prerequisites

- A Linux server with SSH access ([SSH Setup Guide](/foundations/ssh-setup/))
- `sudo` privileges on the server
- Familiarity with basic Linux commands ([Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/))

## APT (Debian/Ubuntu)

APT is the default package manager on Debian, Ubuntu, and their derivatives. It handles downloading packages from repositories, resolving dependencies, and installing everything in the correct order.

### Installing Packages

```bash
# Update the package index (always do this first)
sudo apt update

# Install a single package
sudo apt install curl -y

# Install multiple packages at once
sudo apt install curl wget git htop jq unzip -y
```

The `-y` flag skips the confirmation prompt. Safe for packages you already know you want.

### Updating Packages

```bash
# Update package index
sudo apt update

# Upgrade all installed packages
sudo apt upgrade -y

# Upgrade with package removals if needed (kernel updates, etc.)
sudo apt full-upgrade -y
```

Run `sudo apt update && sudo apt upgrade -y` weekly at minimum. Better yet, automate it (see Automatic Security Updates below).

### Removing Packages

```bash
# Remove a package (keeps config files)
sudo apt remove nginx

# Remove a package and its config files
sudo apt purge nginx

# Clean up unused dependencies
sudo apt autoremove -y

# Clean the local package cache (frees disk space)
sudo apt clean
```

### Searching for Packages

```bash
# Search for packages by name or description
apt search redis

# Show detailed info about a package
apt show redis-server

# List installed packages
apt list --installed

# Check if a specific package is installed
apt list --installed 2>/dev/null | grep docker
```

### Pinning Package Versions

Version pinning prevents a package from being upgraded past a specific version. Useful when a newer version breaks your setup.

```bash
# Hold a package at its current version
sudo apt-mark hold docker-ce

# Check which packages are held
apt-mark showhold

# Release the hold when you're ready to upgrade
sudo apt-mark unhold docker-ce
```

For more granular control, create a pin file:

```bash
sudo nano /etc/apt/preferences.d/docker-pin
```

```text
Package: docker-ce
Pin: version 5:26.1*
Pin-Priority: 1001
```

A priority above 1000 forces that version even over newer ones. Use this sparingly — pinning too many packages leads to dependency conflicts.

### Unattended Upgrades (Automatic Security Patches)

This is non-negotiable for internet-facing servers. `unattended-upgrades` installs security patches automatically without touching major package versions.

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Enable it
sudo dpkg-reconfigure -plow unattended-upgrades
```

Verify the configuration:

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

The default configuration applies security updates only. The key lines:

```text
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

// Automatically reboot if required (set a time that works for you)
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
```

**The recommendation:** Enable automatic reboots at 4 AM. Kernel updates require a reboot to take effect, and postponing reboots indefinitely leaves known vulnerabilities active.

Check that it is working:

```bash
# Dry run — shows what would be upgraded
sudo unattended-upgrade --dry-run --debug

# Check the log
cat /var/log/unattended-upgrades/unattended-upgrades.log
```

## DNF (Fedora/RHEL/AlmaLinux/Rocky)

DNF replaced YUM as the default package manager on Red Hat-family distributions. If you are running Fedora, AlmaLinux, Rocky Linux, or RHEL, this is what you use.

### Core Commands

```bash
# Update package index and upgrade all packages
sudo dnf upgrade -y

# Install a package
sudo dnf install curl wget git htop -y

# Remove a package
sudo dnf remove nginx -y

# Search for a package
dnf search redis

# Show package details
dnf info redis

# List installed packages
dnf list installed

# Clean cached data
sudo dnf clean all

# Check for available updates without installing
dnf check-update
```

### Automatic Updates

```bash
# Install the automatic update tool
sudo dnf install dnf-automatic -y

# Configure it
sudo nano /etc/dnf/automatic.conf
```

Set these values:

```ini
[commands]
upgrade_type = security
apply_updates = yes
```

Enable the timer:

```bash
sudo systemctl enable --now dnf-automatic-install.timer
```

### Version Locking

```bash
# Install the versionlock plugin
sudo dnf install dnf-plugins-core -y

# Lock a package to its current version
sudo dnf versionlock add docker-ce

# List locked packages
dnf versionlock list

# Remove a lock
sudo dnf versionlock delete docker-ce
```

## Pacman (Arch Linux)

Pacman is Arch Linux's package manager. Arch is a rolling-release distribution — packages are always the latest version. This is great for desktops but risky for servers because updates can introduce breaking changes without warning.

**The recommendation:** Do not run Arch on production self-hosting servers. Use Ubuntu or Debian instead. If you insist on Arch (perhaps for a homelab learning environment), here are the essentials.

### Core Commands

```bash
# Sync package database and upgrade all packages
sudo pacman -Syu

# Install a package
sudo pacman -S curl wget git htop

# Remove a package and its unused dependencies
sudo pacman -Rns nginx

# Search for a package
pacman -Ss redis

# Show package info
pacman -Si redis

# List explicitly installed packages
pacman -Qe

# Clean the package cache (keep last 3 versions)
sudo paccache -r
```

### AUR (Arch User Repository)

The AUR contains community-maintained packages not in the official repos. Use an AUR helper like `yay`:

```bash
# Install yay (from the AUR, bootstrap manually)
sudo pacman -S --needed git base-devel
git clone https://aur.archlinux.org/yay.git
cd yay && makepkg -si

# Then use yay like pacman
yay -S some-aur-package
```

**Warning:** AUR packages are not audited. Inspect the PKGBUILD before installing anything from the AUR on a server.

## Quick Reference: Command Equivalents

| Task | APT (Debian/Ubuntu) | DNF (Fedora/RHEL) | Pacman (Arch) |
|------|---------------------|--------------------|--------------------|
| Update package index | `sudo apt update` | `sudo dnf check-update` | `sudo pacman -Sy` |
| Upgrade all packages | `sudo apt upgrade -y` | `sudo dnf upgrade -y` | `sudo pacman -Syu` |
| Install a package | `sudo apt install pkg -y` | `sudo dnf install pkg -y` | `sudo pacman -S pkg` |
| Remove a package | `sudo apt remove pkg` | `sudo dnf remove pkg` | `sudo pacman -Rns pkg` |
| Search for a package | `apt search pkg` | `dnf search pkg` | `pacman -Ss pkg` |
| Show package info | `apt show pkg` | `dnf info pkg` | `pacman -Si pkg` |
| List installed | `apt list --installed` | `dnf list installed` | `pacman -Q` |
| Clean cache | `sudo apt clean` | `sudo dnf clean all` | `sudo paccache -r` |
| Lock version | `sudo apt-mark hold pkg` | `sudo dnf versionlock add pkg` | Edit `/etc/pacman.conf` IgnorePkg |

## Adding Third-Party Repositories Safely

Third-party repos are how you install software not in the default repositories — Docker, Tailscale, Grafana, and similar tools. They are necessary, but each one you add is a trust decision.

### APT: Adding a Repository

```bash
# 1. Download the GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 2. Add the repository with the key reference
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Update and install
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y
```

### DNF: Adding a Repository

```bash
# Add a .repo file
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# Install
sudo dnf install docker-ce docker-ce-cli containerd.io -y
```

### Rules for Third-Party Repos

1. **Only add repos from the software vendor directly.** Get Docker's repo from docker.com, Tailscale's from tailscale.com, and so on. Never use a random PPA you found on a forum.
2. **Always use signed repositories.** The `signed-by` parameter in APT ensures packages are cryptographically verified.
3. **Audit what you have added.** List your third-party sources periodically:

```bash
# APT — list all repo sources
ls /etc/apt/sources.list.d/

# DNF — list enabled repos
dnf repolist

# Pacman — check /etc/pacman.conf for custom repos
```

4. **Remove repos you no longer use.** Every repo is a potential attack vector if it gets compromised.

## Automatic Security Updates

Regardless of your distribution, automatic security updates should be running. Unpatched servers are the leading cause of compromises.

| Distro | Tool | Setup |
|--------|------|-------|
| Ubuntu/Debian | `unattended-upgrades` | `sudo apt install unattended-upgrades -y && sudo dpkg-reconfigure -plow unattended-upgrades` |
| Fedora/RHEL | `dnf-automatic` | `sudo dnf install dnf-automatic -y && sudo systemctl enable --now dnf-automatic-install.timer` |
| Arch | No built-in auto-update | Manual: `sudo pacman -Syu` regularly. Consider a cron job, but test updates first. |

**What about Docker containers?** Package managers handle the host OS. Docker containers are updated separately — see [Updating Docker Containers](/foundations/docker-updating/). The host OS and Docker containers are two independent update tracks. Keep both current.

## Snap vs Flatpak vs AppImage

You will encounter these alternative package formats. Here is when they matter for self-hosting (short answer: rarely).

**Snap** (Canonical/Ubuntu):
- Sandboxed, auto-updating packages.
- Ubuntu ships some server tools as Snaps (e.g., `lxd`).
- Higher resource usage and slower startup than native packages.

**Flatpak** (desktop-focused):
- Primarily for desktop GUI applications.
- Not relevant for headless servers.

**AppImage** (portable binaries):
- Single-file executables that run anywhere.
- No dependency management, no auto-updates.
- Occasionally useful for one-off tools.

**The recommendation for self-hosting: use Docker for application deployment, not Snap or Flatpak.** Docker gives you version pinning, isolated networking, volume management, and reproducible deployments. Package managers handle the host OS (kernel, SSH, system tools). Docker handles the applications (Nextcloud, Jellyfin, Immich). This separation keeps your host minimal and your applications portable. See [Docker Compose Basics](/foundations/docker-compose-basics/) for the full setup.

The only exception: if a tool is only available as a Snap and there is no Docker image (rare), install the Snap. Otherwise, Docker wins for self-hosted services.

## Common Mistakes

### Adding Untrusted Repositories

Every third-party repository you add can push arbitrary software to your server. A compromised PPA can deliver malware through a routine `apt upgrade`. Only add repos from official vendors, and always use GPG-signed sources. Remove repos for software you have uninstalled.

### Breaking Dependencies with Force Flags

```bash
# Never do this unless you truly understand the consequences
sudo dpkg --force-all -i broken-package.deb
sudo apt install -f  # This is fine — it fixes broken dependencies
```

Force-installing packages bypasses dependency checks and can leave your system in an unrecoverable state. If a package will not install cleanly, figure out why rather than forcing it through.

### Forgetting to Update Regularly

An unpatched server is an exploitable server. Security vulnerabilities in OpenSSH, the Linux kernel, and system libraries are discovered constantly. Enable automatic security updates on every server you manage. Check manually at least monthly for non-security upgrades.

### Mixing Package Sources

Installing the same software from both the distribution repos and a third-party repo causes version conflicts. Pick one source per package and stick with it. If you add Docker's official repo, make sure you are not also pulling Docker from Ubuntu's default repos:

```bash
# Check which repo provides your Docker
apt policy docker-ce
```

### Running dist-upgrade Without Reading Changelogs

`sudo apt full-upgrade` or `sudo dnf distro-sync` can remove packages and change major versions. On a production self-hosting server, read what will change before confirming. The `-y` flag is fine for routine `upgrade`, but think twice before blindly running `full-upgrade -y`.

## FAQ

### Which package manager is best for self-hosting servers?

APT on Ubuntu Server 24.04 LTS or Debian 12. The combination of long-term support, extensive documentation, and the largest community makes troubleshooting easier. Every major self-hosted app provides Docker installation instructions for Ubuntu/Debian first.

### Should I use my package manager or Docker to install self-hosted apps?

Docker, almost always. Use your package manager for system-level software: the kernel, SSH, system libraries, Docker itself, monitoring agents, and CLI tools. Use Docker for applications: Nextcloud, Jellyfin, Vaultwarden, and everything else. This keeps your host OS clean and makes applications portable between servers. See [Docker Compose Basics](/foundations/docker-compose-basics/) for why this matters.

### How do I know if a package is safe to install?

Check the source. Packages from your distribution's official repositories are vetted. Third-party repos should come directly from the software vendor's website. Verify GPG signatures are in place. Avoid random PPAs, especially those shared on forums or blog comments without an official affiliation.

### Can I use both APT and Snap on the same server?

Yes, but keep it minimal. Use APT for system packages and Docker for applications. Only fall back to Snap if a tool has no Docker image and no APT package. Running duplicate services from different package managers wastes resources and complicates updates.

### How often should I update my server?

Security updates: automatically, daily (via `unattended-upgrades` or `dnf-automatic`). Non-security updates: manually, at least monthly. Kernel updates require a reboot — schedule reboots during low-traffic hours. Check [Security Hardening](/foundations/security-hardening/) for a complete server maintenance checklist.

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Choosing a Linux Distro for Self-Hosting](/foundations/choosing-linux-distro/)
- [Security Hardening](/foundations/security-hardening/)
- [Linux Systemd Services](/foundations/linux-systemd/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Updating Docker Containers](/foundations/docker-updating/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)

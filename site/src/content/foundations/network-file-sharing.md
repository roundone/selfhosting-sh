---
title: "Network File Sharing for Self-Hosted Servers"
description: "Set up network file sharing on your self-hosted server with SMB, NFS, SFTP, and WebDAV — protocol comparison, configs, and mounting guides."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "networking", "samba", "nfs", "sftp", "webdav", "file-sharing"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Network File Sharing?

Network file sharing lets machines on your network read and write files stored on a central server. For a self-hosted server, this is foundational — you need it for media libraries, shared documents, backups, and feeding data into apps like [Jellyfin](/apps/jellyfin/) or [Nextcloud](/apps/nextcloud/). Four protocols dominate: SMB, NFS, SFTP, and WebDAV. Each has different strengths. Picking the right one for your network file sharing self-hosted server setup avoids performance headaches and permission nightmares down the road.

This guide covers all four protocols, walks through full server-side configuration, and shows you how to mount shares on Linux, Windows, and macOS clients.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started/)
- Basic Linux command-line knowledge — see [Linux Basics](/foundations/linux-basics-self-hosting/)
- Understanding of [Linux file permissions](/foundations/linux-permissions/)
- [Docker and Docker Compose](/foundations/docker-compose-basics/) installed (for SFTP and WebDAV sections)
- A [firewall configured](/foundations/firewall-ufw/) on your server
- At least one client machine on the same network

## Protocols Compared

Here is the honest breakdown. Each protocol exists because it solves a different problem.

### SMB/CIFS (Samba)

**Best for: Mixed networks (Linux server + Windows/macOS clients)**

SMB (Server Message Block) is Windows' native file sharing protocol. Samba is the Linux implementation. Every Windows PC, every Mac, and every smart TV already speaks SMB natively — no extra software needed on clients. It handles permissions, file locking, and metadata well across operating systems.

**Pros:**
- Zero-config on Windows and macOS clients — shows up in file explorers automatically
- Supports file locking (safe for concurrent access)
- Handles mixed permissions across operating systems
- Wide device support (smart TVs, media players, phones)

**Cons:**
- More overhead than NFS on all-Linux networks
- Configuration syntax is verbose
- Chatty protocol — higher latency over WAN

### NFS (Network File System)

**Best for: All-Linux environments**

NFS is the Unix-native file sharing protocol. It maps UIDs/GIDs directly between server and client, which makes it fast and transparent on Linux — files behave exactly like local files. NFS v4 added Kerberos authentication and works through firewalls better than v3.

**Pros:**
- Lowest overhead of any file sharing protocol on Linux
- Transparent UID/GID mapping — permissions just work between Linux machines
- Excellent for Docker volume backends and VM storage
- Mature, stable, battle-tested

**Cons:**
- Poor Windows/macOS support (technically possible, practically painful)
- NFSv3 trusts the client's reported UID — insecure without Kerberos
- No built-in encryption (use a VPN or NFSv4 + Kerberos)

### SFTP (SSH File Transfer Protocol)

**Best for: Secure remote file access, especially over the internet**

SFTP runs over SSH, which means encryption and authentication are built in. Every Linux server already has SSH. It is the natural choice when you need file access from outside your LAN — no VPN required, no additional ports to open (just port 22 or your custom SSH port).

**Pros:**
- Encrypted by default — safe over the internet
- Uses existing SSH infrastructure (keys, configs)
- Works through most firewalls (port 22 is rarely blocked)
- Fine-grained user isolation with chroot

**Cons:**
- Slower than SMB/NFS for bulk LAN transfers (encryption overhead)
- No native OS integration for mounting (needs SSHFS or a client app)
- Not suitable for media streaming

### WebDAV

**Best for: Web-based file access, cross-platform compatibility over HTTPS**

WebDAV extends HTTP for file management. It works through any HTTPS-capable network path — firewalls, proxies, CDNs. Some apps (CalDAV, CardDAV) are built on WebDAV. It is useful as a protocol bridge but slower than purpose-built file sharing protocols.

**Pros:**
- Works over standard HTTPS (port 443)
- Traverses firewalls and corporate proxies
- Native support in Windows, macOS, and many Linux file managers
- Good for integrating with web applications

**Cons:**
- Slower than SMB or NFS for large file operations
- File locking support is inconsistent across clients
- Higher CPU usage (HTTP overhead)

### Quick Decision Matrix

| Scenario | Use This |
|----------|----------|
| Linux server + Windows/macOS clients on LAN | **SMB (Samba)** |
| Linux server + Linux clients on LAN | **NFS** |
| File access from outside your network | **SFTP** |
| File access through corporate firewalls/proxies | **WebDAV** |
| Feeding media to Jellyfin/Plex from a NAS | **SMB** or **NFS** |
| Docker volume backend on a remote host | **NFS** |
| Automated backup target | **SFTP** or **NFS** |

**My recommendation:** Use **SMB for mixed networks** and **NFS for all-Linux setups**. Add SFTP for remote access. Use WebDAV only when HTTP traversal is a requirement.

## Setting Up Samba (SMB) on Linux

### Install Samba

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y samba

# Verify installation
smbd --version
```

As of February 2026, Ubuntu 22.04 ships Samba 4.15.x and Ubuntu 24.04 ships Samba 4.19.x.

### Create a Shared Directory

```bash
# Create the share directory
sudo mkdir -p /srv/share/public
sudo mkdir -p /srv/share/private

# Set ownership — replace 'shareuser' with your actual user
sudo useradd -M -s /usr/sbin/nologin shareuser
sudo chown -R shareuser:shareuser /srv/share
sudo chmod -R 2775 /srv/share
```

The `2775` permission sets the setgid bit, ensuring new files inherit the group ownership. See [Linux Permissions](/foundations/linux-permissions/) for a full explanation of permission bits.

### Add a Samba User

Samba maintains its own password database, separate from Linux system passwords:

```bash
# Set the Samba password for this user
sudo smbpasswd -a shareuser
# Enable the account
sudo smbpasswd -e shareuser
```

### Configure Samba

Back up the default config and create a clean one:

```bash
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak
```

Edit `/etc/samba/smb.conf`:

```ini
[global]
   workgroup = WORKGROUP
   server string = selfhosted-server
   server role = standalone server

   # Security
   map to guest = never
   usershare allow guests = no

   # Performance
   socket options = TCP_NODELAY IPTOS_LOWDELAY
   read raw = yes
   write raw = yes
   use sendfile = yes
   aio read size = 16384
   aio write size = 16384

   # Logging
   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file

   # Only allow connections from local network — adjust to your subnet
   hosts allow = 192.168.1.0/24 127.0.0.1
   hosts deny = 0.0.0.0/0

[public]
   comment = Public Share
   path = /srv/share/public
   browseable = yes
   read only = no
   guest ok = no
   valid users = shareuser
   create mask = 0664
   directory mask = 0775
   force user = shareuser
   force group = shareuser

[private]
   comment = Private Share
   path = /srv/share/private
   browseable = no
   read only = no
   guest ok = no
   valid users = shareuser
   create mask = 0600
   directory mask = 0700
   force user = shareuser
   force group = shareuser
```

### Validate and Start

```bash
# Check config syntax
testparm

# Restart Samba
sudo systemctl restart smbd nmbd
sudo systemctl enable smbd nmbd
```

### Open Firewall Ports

If you use UFW (see [Firewall Setup](/foundations/firewall-ufw/)):

```bash
sudo ufw allow from 192.168.1.0/24 to any app Samba
```

This opens TCP 139, TCP 445, UDP 137, and UDP 138 — but only from your local subnet. Never expose SMB to the internet.

## Setting Up NFS Exports

### Install NFS Server

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y nfs-kernel-server

# Verify
cat /proc/fs/nfsd/versions
```

### Create Export Directories

```bash
sudo mkdir -p /srv/nfs/media
sudo mkdir -p /srv/nfs/backups

# Set ownership
sudo chown -R nobody:nogroup /srv/nfs/media
sudo chmod -R 755 /srv/nfs/media

sudo chown -R nobody:nogroup /srv/nfs/backups
sudo chmod -R 755 /srv/nfs/backups
```

### Configure Exports

Edit `/etc/exports`:

```
# /etc/exports
# Format: /path client(options)

# Media share — read-only to all LAN clients
/srv/nfs/media    192.168.1.0/24(ro,sync,no_subtree_check,no_root_squash)

# Backups share — read-write, restricted to one client
/srv/nfs/backups  192.168.1.50(rw,sync,no_subtree_check,no_root_squash)
```

**Key options explained:**

| Option | What It Does |
|--------|-------------|
| `ro` / `rw` | Read-only or read-write access |
| `sync` | Write to disk before confirming (safer, slightly slower) |
| `no_subtree_check` | Disables subtree checking (improves reliability) |
| `no_root_squash` | Lets root on the client act as root on the server (use cautiously) |
| `root_squash` | Maps client root to `nobody` (default, more secure) |
| `all_squash` | Maps ALL client users to `nobody` (most restrictive) |

For most setups, use `root_squash` (the default) instead of `no_root_squash`. Only use `no_root_squash` when the client needs to write files as root — for example, a backup server.

### Apply and Start

```bash
# Apply export changes
sudo exportfs -arv

# Start and enable NFS
sudo systemctl restart nfs-kernel-server
sudo systemctl enable nfs-kernel-server
```

### Open Firewall Ports

```bash
# NFS uses port 2049 by default
sudo ufw allow from 192.168.1.0/24 to any port 2049 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 2049 proto udp
```

Like SMB, never expose NFS to the internet. Keep it on your LAN or behind a VPN like [WireGuard](/foundations/wireguard-setup/) or [Tailscale](/foundations/tailscale-setup/).

## SFTP with Docker

Running SFTP in a container isolates it from your host system and makes user management straightforward. The `atmoz/sftp` image is the standard choice.

### Docker Compose Configuration

Create a directory for the SFTP stack:

```bash
mkdir -p /opt/stacks/sftp
cd /opt/stacks/sftp
```

Create `docker-compose.yml`:

```yaml
services:
  sftp:
    image: atmoz/sftp:alpine
    container_name: sftp-server
    restart: unless-stopped
    ports:
      # Map to a non-standard port to reduce SSH scanning noise
      - "2222:22"
    volumes:
      # User data directories
      - sftp-data:/home/sftpuser/upload
      # SSH host keys — persist across container restarts
      - ./ssh_host_keys:/etc/ssh/ssh_host_ed25519_key:ro
      - ./ssh_host_keys.pub:/etc/ssh/ssh_host_ed25519_key.pub:ro
    # Format: "user:password:uid:gid:directories"
    # Creates user 'sftpuser' with UID 1001, GID 1001, and an 'upload' subdirectory
    command: "sftpuser:${SFTP_PASSWORD}:1001:1001:upload"

volumes:
  sftp-data:
    driver: local
```

Create a `.env` file:

```bash
# CHANGE THIS — use a strong password or switch to key-based auth
SFTP_PASSWORD=ChangeMe_Use-A-Real-Password-Here
```

### Generate Persistent Host Keys

Without persistent host keys, clients get fingerprint warnings every time the container recreates:

```bash
ssh-keygen -t ed25519 -f ./ssh_host_keys -N ""
```

### Start the SFTP Server

```bash
docker compose up -d
```

### Connect from a Client

```bash
sftp -P 2222 sftpuser@your-server-ip
```

For key-based authentication (recommended over passwords), mount your public keys into the container:

```yaml
    volumes:
      - sftp-data:/home/sftpuser/upload
      - ./ssh_host_keys:/etc/ssh/ssh_host_ed25519_key:ro
      - ./ssh_host_keys.pub:/etc/ssh/ssh_host_ed25519_key.pub:ro
      # Mount authorized keys for the user
      - ./sftpuser_authorized_keys:/home/sftpuser/.ssh/keys/id_ed25519.pub:ro
```

Users are chrooted to their home directory by default — they cannot browse outside `/home/sftpuser/`. See [Security Hardening](/foundations/security-hardening/) for more on chroot jails.

### Firewall Configuration

```bash
sudo ufw allow 2222/tcp comment "SFTP Docker"
```

## WebDAV with Docker

WebDAV is useful when you need file access through HTTP — particularly for clients behind restrictive firewalls or for integrating with web applications.

### Docker Compose Configuration

Create a directory for the WebDAV stack:

```bash
mkdir -p /opt/stacks/webdav
cd /opt/stacks/webdav
```

Create `docker-compose.yml`:

```yaml
services:
  webdav:
    image: bytemark/webdav:2.4
    container_name: webdav-server
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      # Authentication credentials — CHANGE THESE
      USERNAME: webdavuser
      PASSWORD: ${WEBDAV_PASSWORD}
      AUTH_TYPE: Basic
    volumes:
      # Persistent file storage
      - webdav-data:/var/lib/dav

volumes:
  webdav-data:
    driver: local
```

Create a `.env` file:

```bash
# CHANGE THIS — use a strong password
WEBDAV_PASSWORD=ChangeMe_Use-A-Real-Password-Here
```

### Start WebDAV

```bash
docker compose up -d
```

### Verify It Works

```bash
# Upload a test file
curl -u webdavuser:YourPassword -T /tmp/testfile.txt http://localhost:8080/testfile.txt

# List files
curl -u webdavuser:YourPassword -X PROPFIND http://localhost:8080/
```

**Important:** Run WebDAV behind a [reverse proxy](/foundations/reverse-proxy-explained/) with TLS in production. Basic auth over plain HTTP sends credentials in clear text. Use [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/), [Caddy](/foundations/caddy-setup/), or [Traefik](/foundations/traefik-setup/) to terminate TLS.

## Mounting Network Shares on Client Machines

### Linux Clients

#### Mount an SMB Share

```bash
# Install the CIFS utilities
sudo apt install -y cifs-utils

# Create mount point
sudo mkdir -p /mnt/server-share

# Mount (interactive password prompt)
sudo mount -t cifs //192.168.1.100/public /mnt/server-share \
  -o username=shareuser,uid=$(id -u),gid=$(id -g),vers=3.0

# Persistent mount — add to /etc/fstab:
# //192.168.1.100/public /mnt/server-share cifs credentials=/etc/samba/credentials,uid=1000,gid=1000,vers=3.0 0 0
```

Store credentials securely in `/etc/samba/credentials`:

```
username=shareuser
password=YourSambaPassword
```

```bash
sudo chmod 600 /etc/samba/credentials
```

#### Mount an NFS Share

```bash
# Install NFS client
sudo apt install -y nfs-common

# Create mount point
sudo mkdir -p /mnt/nfs-media

# Mount
sudo mount -t nfs 192.168.1.100:/srv/nfs/media /mnt/nfs-media

# Persistent mount — add to /etc/fstab:
# 192.168.1.100:/srv/nfs/media /mnt/nfs-media nfs defaults,_netdev 0 0
```

The `_netdev` option tells Linux to wait for the network to be up before attempting the mount.

#### Mount SFTP via SSHFS

```bash
# Install SSHFS
sudo apt install -y sshfs

# Mount
sshfs -p 2222 sftpuser@192.168.1.100:/upload /mnt/sftp-share

# Unmount
fusermount -u /mnt/sftp-share
```

### Windows Clients

#### SMB (Built-in)

1. Open File Explorer
2. Type `\\192.168.1.100\public` in the address bar
3. Enter credentials when prompted
4. Right-click the share and select "Map network drive" for persistence

#### NFS (Requires Feature Enable)

1. Open "Turn Windows features on or off"
2. Enable "Services for NFS" > "Client for NFS"
3. Open Command Prompt: `mount 192.168.1.100:/srv/nfs/media Z:`

#### WebDAV

1. Open File Explorer
2. Right-click "This PC" > "Add a network location"
3. Enter `http://192.168.1.100:8080` (or the HTTPS URL behind your reverse proxy)

### macOS Clients

#### SMB (Built-in)

1. Open Finder
2. Press Cmd+K (or Go > Connect to Server)
3. Enter `smb://192.168.1.100/public`
4. Enter credentials when prompted

#### NFS

```bash
# From Terminal
sudo mkdir -p /Volumes/nfs-media
sudo mount -t nfs -o resvport 192.168.1.100:/srv/nfs/media /Volumes/nfs-media
```

The `-o resvport` flag is required on macOS — NFS mounts fail without it.

#### WebDAV (Built-in)

1. Open Finder > Go > Connect to Server
2. Enter `http://192.168.1.100:8080`

## Performance Considerations

Protocol choice matters for throughput, especially with large files or many small files.

**Large file sequential transfers (LAN gigabit):**

| Protocol | Typical Throughput | Notes |
|----------|-------------------|-------|
| NFS | 110-115 MB/s | Lowest overhead |
| SMB | 100-110 MB/s | Slightly more overhead than NFS |
| SFTP | 60-90 MB/s | Encryption overhead |
| WebDAV | 40-70 MB/s | HTTP overhead |

**Many small files (thousands of <1 MB files):**

NFS and SMB handle this reasonably well. SFTP suffers because each file requires its own transfer negotiation. WebDAV is worst due to HTTP request overhead per file.

**Tuning tips:**

- **SMB:** Set `socket options = TCP_NODELAY IPTOS_LOWDELAY` in `smb.conf` (already included in our config above). Use SMB3 (`vers=3.0` on mount) for better performance and encryption support.
- **NFS:** Use `async` instead of `sync` in exports if you can tolerate the risk of data loss on server crash. Use `rsize=1048576,wsize=1048576` mount options for larger read/write buffers.
- **SFTP:** Use `-o Ciphers=aes128-gcm@openssh.com` for the fastest encryption cipher. Enable compression with `-C` for compressible data.
- **WebDAV:** Always put it behind a reverse proxy with keep-alive connections to reduce TCP handshake overhead.

## Common Mistakes

### 1. Exposing SMB or NFS to the Internet

SMB (port 445) and NFS (port 2049) are designed for trusted local networks. Exposing them to the internet is a critical security risk. Use a VPN for remote access, or use SFTP/WebDAV over HTTPS instead. See [Security Hardening](/foundations/security-hardening/).

### 2. UID/GID Mismatches with NFS

NFS maps permissions by numeric UID/GID, not by username. If your server user has UID 1000 but the client user has UID 1001, the client sees files as owned by a different user. Fix this by ensuring UIDs match across machines, or use `all_squash` with `anonuid`/`anongid` in your exports.

### 3. Forgetting to Persist Samba Host Keys or WebDAV Data

Docker containers lose state on recreation. Always use named volumes or bind mounts for data directories. For SFTP, persist the host keys — otherwise clients get scary fingerprint mismatch warnings after every container rebuild.

### 4. Using `no_root_squash` by Default

`no_root_squash` gives the client's root user full root access on the NFS server. Only use it when necessary (backup servers, trusted automation). Use the default `root_squash` for general file sharing.

### 5. Not Restricting SMB/NFS to Your Subnet

Both Samba (`hosts allow`) and NFS (export client specifications) support network restrictions. Always limit access to your LAN subnet. Never use `*` or `0.0.0.0/0` in production exports.

### 6. Skipping Credential Files for Automounts

Putting passwords directly in `/etc/fstab` is readable by any user who can read the file. Use a separate credentials file with `chmod 600` for SMB mounts. For NFS, rely on network restrictions since NFSv3 does not authenticate users.

## FAQ

### Which protocol should I use for a Jellyfin or Plex media library?

Use **SMB** if your media server runs on a different machine than your storage and you have Windows or macOS clients that also access the library. Use **NFS** if everything is Linux. Both give you near-wire-speed for sequential media playback. Avoid SFTP and WebDAV for media — the overhead is unnecessary on a LAN.

### Can I use NFS as a Docker volume backend?

Yes. Docker supports NFS volumes natively. Add this to your `docker-compose.yml`:

```yaml
volumes:
  nfs-media:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,rw,nfsvers=4
      device: ":/srv/nfs/media"
```

This mounts the NFS share directly into the container without mounting it on the host first. See [Docker Volumes](/foundations/docker-volumes/) for more volume driver options.

### Is SFTP the same as FTPS?

No. SFTP runs over SSH (port 22). FTPS is FTP with TLS bolted on (ports 990, 989, plus passive ports). SFTP is simpler, more secure, and firewall-friendly because it uses a single port. Always choose SFTP over FTPS.

### How do I share files between Docker containers?

You do not need a network file sharing protocol for this. Use Docker named volumes or bind mounts shared between containers in the same Compose stack. See [Docker Volumes](/foundations/docker-volumes/) and [Docker Compose Basics](/foundations/docker-compose-basics/).

### Do I need a NAS for network file sharing?

No. Any Linux server can serve files over SMB, NFS, SFTP, or WebDAV. A dedicated NAS (see [NAS Basics](/foundations/nas-basics/)) adds hardware RAID, a management UI, and sometimes ECC RAM — useful for large storage pools but not required. A Raspberry Pi with an external drive can serve files to a small network. See [Storage Planning](/foundations/storage-planning/) for sizing guidance.

## Related

- [Linux Permissions](/foundations/linux-permissions/) — understand ownership, chmod, and setgid
- [Docker Compose Basics](/foundations/docker-compose-basics/) — the foundation for Docker-based SFTP and WebDAV
- [NAS Basics](/foundations/nas-basics/) — dedicated storage hardware for file sharing at scale
- [Storage Planning](/foundations/storage-planning/) — sizing drives and planning capacity
- [Security Hardening](/foundations/security-hardening/) — lock down your server before exposing services
- [Firewall Setup with UFW](/foundations/firewall-ufw/) — restrict access to file sharing ports
- [Docker Volumes](/foundations/docker-volumes/) — volume management for containerized services
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/) — put WebDAV behind TLS
- [Getting Started with Self-Hosting](/foundations/getting-started/) — the beginner's starting point

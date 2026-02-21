---
title: "LXC Containers for Self-Hosting"
description: "Learn how LXC containers work for self-hosting, when to choose them over Docker, and how to create, manage, snapshot, network, and run Docker inside LXC."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "lxc", "containers", "proxmox", "virtualization", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are LXC Containers?

LXC containers are lightweight Linux virtualization that runs isolated environments sharing the host kernel. Unlike full virtual machines, LXC containers don't emulate hardware or boot their own kernel — they carve out a separate userspace on the same kernel. Unlike Docker, which isolates a single application process, LXC containers behave like full Linux systems with init, multiple services, package managers, and persistent state.

For self-hosting, LXC containers fill the gap between bare metal and Docker. They give you VM-like isolation with near-native performance and minimal overhead. If you run [Proxmox](/foundations/proxmox-basics/), you're already using LXC — every "CT" in the Proxmox UI is an LXC container.

The practical use case: you want isolated environments for services that don't fit neatly into Docker, or you want to run Docker itself inside an isolated container rather than on bare metal. Pi-hole on LXC, a Docker host in LXC, a dedicated database server in LXC — these are all common and sensible patterns.

## Prerequisites

- A Linux server running Ubuntu 22.04+, Debian 12+, or Proxmox VE 8+ — see [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- Root or sudo access
- For standalone LXC: `lxc` and `lxd` packages (or `incus`, the community fork)
- For Proxmox: LXC support is built in, no extra packages needed
- Basic understanding of [Linux permissions](/foundations/linux-permissions/)

## How LXC Works (vs Docker)

Both LXC and Docker use the same underlying Linux kernel features — namespaces for isolation and cgroups for resource limits. The difference is what they isolate and how you interact with them.

### LXC: System Containers

LXC creates **system containers** — full Linux environments with their own init system, user accounts, package manager, and filesystem. An LXC container boots like a VM. You SSH into it, install packages with `apt`, run multiple services, and manage it like a regular server. The container persists its state on disk.

### Docker: Application Containers

Docker creates **application containers** — single-process environments built from layered images. A Docker container runs one application (and its child processes). It's ephemeral by design: `docker compose down` and `up` recreates it from the image. State lives in volumes, not in the container itself.

### When to Use Which

| Scenario | LXC | Docker | Why |
|----------|-----|--------|-----|
| Running a single self-hosted app | No | **Yes** | Docker images ship ready to run. One command deploys the app. |
| Running 20+ self-hosted apps | No | **Yes** | Docker Compose handles multi-app stacks cleanly. |
| Isolating a Docker host | **Yes** | N/A | Run Docker inside an LXC container for host-level isolation. |
| Network services (Pi-hole, DNS) | **Yes** | Possible | LXC gives direct network access without Docker's NAT layer. |
| Database servers | **Yes** | Yes | LXC avoids Docker's storage driver overhead for I/O-heavy workloads. |
| Services needing systemd | **Yes** | No | Docker doesn't run systemd. LXC runs a full init system. |
| Legacy apps that expect a full OS | **Yes** | No | Some software assumes a full Linux environment. |
| Experimenting/testing | **Yes** | Yes | LXC containers are cheap to create and destroy. |

**The opinionated take:** Use Docker for application deployment — it's the ecosystem standard for self-hosted apps. Use LXC when you need system-level isolation: a dedicated Docker host, a network appliance, a database server, or anything that fights against Docker's single-process model. If you run Proxmox, LXC containers are your lightweight workhorse alongside VMs.

## Creating Your First LXC Container

There are two paths: standalone LXC/LXD (or Incus) on a regular Linux server, or Proxmox's built-in LXC management. Both create the same underlying containers.

### Path A: Standalone with Incus

Incus is the community fork of LXD (Canonical moved LXD behind a commercial license in 2023). Incus is the recommended tool for managing LXC containers outside of Proxmox.

Install Incus on Ubuntu 22.04+ or Debian 12+:

```bash
# Add the Zabbly repository (official Incus packages)
curl -fsSL https://pkgs.zabbly.com/key.asc | sudo gpg --dearmor -o /etc/apt/keyrings/zabbly.gpg

# For Ubuntu
echo "deb [signed-by=/etc/apt/keyrings/zabbly.gpg] https://pkgs.zabbly.com/incus/stable $(. /etc/os-release && echo "$VERSION_CODENAME") main" | sudo tee /etc/apt/sources.list.d/zabbly-incus.list

sudo apt update
sudo apt install -y incus

# Add your user to the incus-admin group
sudo usermod -aG incus-admin $USER
newgrp incus-admin
```

Initialize Incus (accept defaults for a simple setup):

```bash
incus admin init --minimal
```

Launch your first container:

```bash
# Launch an Ubuntu 24.04 container named "test-server"
incus launch images:ubuntu/24.04 test-server

# Verify it's running
incus list
```

Expected output:

```
+-------------+---------+---------------------+------+-----------+-----------+
|    NAME     |  STATE  |        IPV4         | IPV6 |   TYPE    | SNAPSHOTS |
+-------------+---------+---------------------+------+-----------+-----------+
| test-server | RUNNING | 10.0.0.100 (eth0)   |      | CONTAINER | 0         |
+-------------+---------+---------------------+------+-----------+-----------+
```

Get a shell inside the container:

```bash
incus exec test-server -- bash
```

You're now inside a full Ubuntu environment. Install packages, create users, configure services — it behaves like a regular server.

```bash
# Inside the container
apt update && apt install -y nginx
systemctl start nginx
systemctl enable nginx
curl localhost
# You'll see the nginx welcome page
exit
```

### Path B: Proxmox

If you run [Proxmox VE](/foundations/proxmox-basics/), LXC containers are a first-class feature.

1. Download a template: **Datacenter -> Storage -> local -> CT Templates -> Templates** -> download `ubuntu-24.04-standard`

2. Create the container: **Create CT** (top right of the Proxmox UI)
   - **General:** Hostname `test-server`, set root password, check **Unprivileged container**
   - **Template:** Select `ubuntu-24.04-standard`
   - **Disks:** Root disk 8GB (expand later if needed)
   - **CPU:** 2 cores
   - **Memory:** 1024 MB (1GB)
   - **Network:** DHCP or static IP on your LAN bridge (`vmbr0`)
   - **DNS:** Use host settings

3. Start the container and open the Console tab, or SSH in using the IP assigned.

Or create it via command line on the Proxmox host:

```bash
# Download template if not already present
pveam update
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst

# Create container (ID 200, 2 cores, 1GB RAM, 8GB disk)
pct create 200 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname test-server \
  --cores 2 \
  --memory 1024 \
  --swap 512 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --features nesting=1 \
  --start 1

# Enter the container
pct enter 200
```

The `--unprivileged 1` flag creates a safer container where root inside the container maps to an unprivileged user on the host. The `--features nesting=1` flag enables running containers inside the container (needed for Docker-in-LXC).

## Managing LXC Containers

### Incus Commands

```bash
# List all containers
incus list

# Start / stop / restart
incus start test-server
incus stop test-server
incus restart test-server

# Delete a container (must be stopped first)
incus stop test-server
incus delete test-server

# Force delete a running container
incus delete test-server --force

# View container details
incus info test-server

# Get a shell
incus exec test-server -- bash

# Run a single command
incus exec test-server -- apt update

# Copy files in/out
incus file push local-file.txt test-server/root/file.txt
incus file pull test-server/root/file.txt ./local-copy.txt
```

### Proxmox Commands

```bash
# List containers
pct list

# Start / stop / restart
pct start 200
pct stop 200
pct restart 200

# Enter the container shell
pct enter 200

# Destroy a container
pct destroy 200

# View container config
pct config 200

# Resize disk (expand to 16GB)
pct resize 200 rootfs 16G

# Modify resources on the fly
pct set 200 --memory 2048
pct set 200 --cores 4
```

### Snapshots

Snapshots capture the entire container state. Take one before any risky operation.

**Incus:**

```bash
# Create a snapshot
incus snapshot create test-server pre-upgrade

# List snapshots
incus snapshot list test-server

# Restore a snapshot
incus snapshot restore test-server pre-upgrade

# Delete a snapshot
incus snapshot delete test-server pre-upgrade
```

**Proxmox:**

```bash
# Create a snapshot
pct snapshot 200 pre-upgrade --description "Before Docker upgrade"

# List snapshots
pct listsnapshot 200

# Restore
pct rollback 200 pre-upgrade

# Delete snapshot
pct delsnapshot 200 pre-upgrade
```

### Cloning

Clone an existing container to create a copy. Useful for testing changes without risking your production setup.

**Incus:**

```bash
# Clone (container must be stopped)
incus stop test-server
incus copy test-server test-server-clone
incus start test-server
incus start test-server-clone
```

**Proxmox:**

```bash
# Full clone to new ID 201
pct clone 200 201 --hostname test-clone --full
pct start 201
```

## Networking in LXC

### Default Networking

By default, LXC containers get a network interface bridged to the host. In Proxmox, this is `vmbr0` — the same bridge your VMs use. The container gets an IP on your LAN (via DHCP or static assignment) and is reachable from any device on your network.

This is simpler than Docker's default networking. There's no NAT, no port mapping, no `docker-proxy` process. The container has its own IP, and ports work exactly as they would on a regular server. If you run Nginx on port 80 inside an LXC container, it's accessible on port 80 at the container's IP.

### Static IPs

For services like DNS servers or reverse proxies, assign a static IP.

**Incus:**

```bash
# Set a static IP on the container's eth0 interface
incus config device set test-server eth0 ipv4.address=192.168.1.100
```

Or configure it inside the container using netplan (Ubuntu):

```yaml
# /etc/netplan/50-cloud-init.yaml inside the container
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
```

```bash
netplan apply
```

**Proxmox:**

```bash
# Set static IP during creation or after
pct set 200 --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1
```

### VLANs

To place an LXC container on a specific VLAN (requires a VLAN-aware bridge):

**Proxmox:**

```bash
pct set 200 --net0 name=eth0,bridge=vmbr0,ip=192.168.10.50/24,gw=192.168.10.1,tag=10
```

This tags the container's traffic with VLAN ID 10. Your switch and router must be configured to handle this VLAN. See [Docker Networking](/foundations/docker-networking/) for related container networking concepts.

### Container-to-Container Communication

Containers on the same bridge can reach each other by IP address. For name resolution, you have several options:

1. **Use static IPs** and reference them directly (simplest)
2. **Run a local DNS server** (like Pi-hole) in one container and point other containers to it
3. **Edit `/etc/hosts`** inside each container (works but doesn't scale)

## Running Docker Inside LXC

This is one of the most practical LXC patterns for self-hosting: run your Docker stack inside an LXC container instead of on bare metal. You get host-level isolation — if Docker or a container compromises the environment, the blast radius is contained to that LXC container. Your Proxmox host and other LXC containers are unaffected.

### Requirements

The LXC container needs two features enabled:
- **Nesting** — allows running containers inside the container
- **keyctl** — needed by Docker's storage driver

**Proxmox (recommended approach):**

```bash
# Create the container with nesting and keyctl enabled
pct create 210 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname docker-host \
  --cores 4 \
  --memory 4096 \
  --swap 1024 \
  --rootfs local-lvm:32 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --features nesting=1,keyctl=1 \
  --start 1
```

Or edit an existing container's config:

```bash
# On the Proxmox host, edit the container's config
# Add or modify the features line
pct set 210 --features nesting=1,keyctl=1
pct restart 210
```

**Incus:**

```bash
incus launch images:ubuntu/24.04 docker-host \
  -c security.nesting=true \
  -c security.syscalls.intercept.mknod=true \
  -c security.syscalls.intercept.setxattr=true
```

### Install Docker Inside the LXC Container

Enter the container and install Docker as you would on any Ubuntu/Debian server:

```bash
# Enter the container
pct enter 210   # Proxmox
# or
incus exec docker-host -- bash   # Incus

# Inside the container, install Docker
apt update
apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify
docker run hello-world
docker compose version
```

If Docker fails to start with errors about cgroups or AppArmor, the container is missing the nesting or keyctl features. Go back and enable them.

For Docker Compose usage inside the container, see [Docker Compose Basics](/foundations/docker-compose-basics/).

### Storage Considerations for Docker-in-LXC

Docker's default storage driver (`overlay2`) works inside unprivileged LXC containers with nesting enabled. Allocate enough root disk space for your Docker images and volumes:

| Workload | Recommended LXC Disk |
|----------|--------------------|
| 1-5 lightweight apps | 16-32 GB |
| 10-20 apps with databases | 64-128 GB |
| Media-heavy (Jellyfin, Immich) | 128+ GB, or mount NFS/bind mounts for media |

For large media libraries, don't store the data inside the LXC container's root disk. Instead, mount an NFS share or bind-mount a host directory:

**Proxmox bind mount (add to container config):**

```bash
# On the Proxmox host
pct set 210 --mp0 /mnt/data/media,mp=/mnt/media
```

This mounts `/mnt/data/media` from the Proxmox host into the container at `/mnt/media`. Docker containers inside the LXC can then bind-mount `/mnt/media` for media storage.

## Practical Examples

### Example 1: Pi-hole in LXC

Pi-hole is a network-wide DNS ad blocker. Running it in LXC gives it a dedicated IP on your network — clean, simple, and no Docker NAT complications with DNS port 53.

**Proxmox:**

```bash
pct create 220 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname pihole \
  --cores 1 \
  --memory 512 \
  --swap 256 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.53/24,gw=192.168.1.1 \
  --nameserver 1.1.1.1 \
  --unprivileged 1 \
  --start 1

pct enter 220
```

Inside the container:

```bash
apt update && apt install -y curl
curl -sSL https://install.pi-hole.net | bash
```

Follow the installer prompts. When done, Pi-hole's DNS server is at `192.168.1.53` and the web UI is at `http://192.168.1.53/admin`. Point your router's DHCP DNS setting to `192.168.1.53` and your entire network gets ad blocking.

Resource usage: ~50 MB RAM idle. This is why LXC shines for lightweight services — a full VM would waste hundreds of MB on kernel overhead for a 50 MB workload.

### Example 2: Dedicated Docker Host in LXC

Run your entire self-hosted Docker stack inside a beefy LXC container:

```bash
pct create 210 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname docker-host \
  --cores 4 \
  --memory 8192 \
  --swap 2048 \
  --rootfs local-lvm:64 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.10/24,gw=192.168.1.1 \
  --unprivileged 1 \
  --features nesting=1,keyctl=1 \
  --onboot 1 \
  --start 1
```

Install Docker (see the Docker installation steps above), then deploy your apps with Docker Compose as usual. The LXC container acts as your Docker server, isolated from the Proxmox host.

### Example 3: Database Server in LXC

Running PostgreSQL in a dedicated LXC container instead of a Docker container avoids storage driver overhead and gives you direct filesystem access for backups:

```bash
pct create 230 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname postgres \
  --cores 2 \
  --memory 2048 \
  --swap 1024 \
  --rootfs local-lvm:32 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.20/24,gw=192.168.1.1 \
  --unprivileged 1 \
  --start 1

pct enter 230
```

Inside the container:

```bash
apt update
apt install -y postgresql-16

# PostgreSQL starts automatically. Configure it:
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your-strong-password-here';"

# Allow remote connections from your Docker host
echo "host all all 192.168.1.10/32 scram-sha-256" >> /etc/postgresql/16/main/pg_hba.conf

# Listen on all interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

systemctl restart postgresql
```

Your Docker apps can now connect to PostgreSQL at `192.168.1.20:5432` using a standard connection string. Backups are straightforward — `pg_dump` runs inside the container, and Proxmox can snapshot the entire container before upgrades.

## Common Mistakes

### Using Privileged Containers

Privileged LXC containers run as root on the host. A container escape gives the attacker root access to your Proxmox host or bare metal server. Always create **unprivileged** containers (`--unprivileged 1` in Proxmox, which is the default in Incus). The only exception is hardware passthrough that specifically requires a privileged container — and even then, explore alternatives first.

### Not Enabling Nesting for Docker

Docker inside an unprivileged LXC container fails silently or throws cryptic cgroup errors if nesting isn't enabled. Before troubleshooting Docker installation issues, verify that `nesting=1` (and `keyctl=1` on Proxmox) is set in the container features. This is the most common Docker-in-LXC issue.

### Forgetting Start on Boot

LXC containers don't start automatically after a host reboot unless you configure it. On Proxmox, set `--onboot 1`. With Incus, use `incus config set test-server boot.autostart true`. If your DNS server lives in an LXC container and it doesn't auto-start, your entire network loses DNS resolution after a power outage.

### Over-Provisioning Resources

LXC containers are lightweight. A Pi-hole container needs 512 MB RAM and 1 CPU core. A Docker host might need 4-8 GB RAM. Don't assign 8 GB RAM to a container running a single lightweight service — that memory is unavailable to other containers and VMs. Start small and increase when the container actually runs out.

### Ignoring Backup for LXC

LXC containers hold state — unlike Docker containers where you can recreate from an image, losing an LXC container's filesystem means losing all installed software, configuration, and data. Use Proxmox's `vzdump` for automated backups or `incus export` for Incus. Snapshots are not backups — they live on the same storage.

### Bind-Mount Permission Issues

When bind-mounting host directories into unprivileged containers, UID/GID mapping causes permission errors. The container's root (UID 0) maps to an unprivileged UID on the host (e.g., 100000). Fix this by adjusting ownership on the host:

```bash
# On the Proxmox host — map to the container's UID range
chown -R 100000:100000 /mnt/data/shared
```

Or use idmap entries in the container config for more granular control.

## Next Steps

- Deploy apps with Docker Compose inside your LXC container — [Docker Compose Basics](/foundations/docker-compose-basics/)
- Set up Proxmox to manage LXC and VMs — [Proxmox VE Basics](/foundations/proxmox-basics/)
- Understand networking between containers and hosts — [Docker Networking](/foundations/docker-networking/)
- Back up your containers and data — [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- Learn Linux fundamentals for managing LXC environments — [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)

## FAQ

### Should I use LXC or Docker for self-hosting?

Use Docker for deploying self-hosted applications — nearly every app ships a Docker image and Compose file. Use LXC for infrastructure-level isolation: a dedicated Docker host, a DNS server, a database server, or anything that needs a full Linux environment. They complement each other. The most common and practical setup is Docker running inside an LXC container on Proxmox.

### Can I run Docker inside an LXC container?

Yes. Enable nesting and keyctl features on the container, then install Docker inside as you would on any Ubuntu/Debian server. This is a well-supported, widely-used pattern in the Proxmox community. Performance is near-native — the overhead of LXC is negligible since it shares the host kernel.

### What is the difference between LXC and LXD (and Incus)?

LXC is the low-level container runtime — the kernel-level technology. LXD was the management layer built on top of LXC by Canonical, providing a CLI and REST API. In 2023, Canonical moved LXD behind a commercial CLA, and the community forked it as **Incus**. Use Incus for standalone LXC management. On Proxmox, you don't need either — Proxmox manages LXC containers directly with its own tools (`pct` commands and web UI).

### How much overhead do LXC containers add?

Almost none. LXC containers share the host kernel and use kernel namespaces for isolation. There is no hypervisor layer, no emulated hardware, no separate kernel. RAM usage is exactly what the processes inside the container consume. A minimal Ubuntu LXC container idles at around 30-50 MB RAM. Compare that to a VM running the same Ubuntu install at 300-500 MB minimum.

### Are LXC containers secure enough for production?

Unprivileged LXC containers provide strong isolation. The container's root user maps to an unprivileged UID on the host, meaning a container breakout doesn't grant host root access. This is comparable to Docker's default isolation model. For additional security, Proxmox supports AppArmor profiles and seccomp filters on LXC containers. For most self-hosting scenarios, unprivileged LXC containers are secure enough. Don't use privileged containers unless you have a specific, unavoidable reason.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Proxmox VE Basics](/foundations/proxmox-basics/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Docker Networking](/foundations/docker-networking/)
- [Linux Permissions](/foundations/linux-permissions/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [ZFS Basics](/foundations/zfs-basics/)
- [NAS Basics](/foundations/nas-basics/)

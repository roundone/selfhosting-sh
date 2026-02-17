---
title: "Linux Users and Groups for Self-Hosting"
description: "Manage Linux users, groups, and ownership for Docker containers and self-hosted services. Fix permission issues the right way."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["linux", "users", "groups", "permissions", "self-hosted"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Linux Users and Groups?

Every file, process, and Docker container on your server runs as a specific user and group. Getting user/group configuration right prevents the two most common self-hosting headaches: "permission denied" errors when containers try to read/write data, and security risks from running everything as root.

Linux uses numeric User IDs (UIDs) and Group IDs (GIDs) internally. The names you see (`www-data`, `nobody`) are just labels mapped to these numbers in `/etc/passwd` and `/etc/group`.

## Prerequisites

- A Linux server with SSH access ([SSH Setup](/foundations/ssh-setup))
- Basic command line knowledge ([Linux Basics](/foundations/linux-basics-self-hosting))
- Understanding of file permissions helps ([Linux Permissions](/foundations/linux-permissions))

## Key Concepts

### UIDs and GIDs

| ID | Typical Range | Purpose |
|----|--------------|---------|
| 0 | 0 | Root user/group — full system access |
| 1–999 | 1–999 | System accounts (services, daemons) |
| 1000+ | 1000+ | Regular users |

Your first non-root user (the one you SSH in as) is typically UID 1000. Docker containers often run processes as different UIDs internally.

### The Root User

UID 0 has unrestricted access to the entire system. Running containers as root is convenient but dangerous — a container escape vulnerability gives the attacker full server control.

### Service Accounts

Many self-hosted apps create their own system user inside the container. For example, Nextcloud runs as `www-data` (UID 33) inside its container. When that process writes to a bind-mounted volume, the files on the host are owned by UID 33.

## Managing Users

### Create a Dedicated User for Self-Hosting

Don't run all your services as your personal user. Create a dedicated user:

```bash
# Create a user with no login shell (security best practice)
sudo useradd --system --create-home --shell /usr/sbin/nologin selfhost

# Check the assigned UID/GID
id selfhost
# Output: uid=999(selfhost) gid=999(selfhost) groups=999(selfhost)
```

### Common User Commands

```bash
# List all users
cat /etc/passwd

# Check a specific user's UID/GID
id username

# Create a regular user with a home directory
sudo useradd -m -s /bin/bash username

# Delete a user (keeps their files)
sudo userdel username

# Delete a user and their home directory
sudo userdel -r username

# Change a user's password
sudo passwd username

# Lock a user account (disable login)
sudo usermod -L username
```

## Managing Groups

Groups let you share access between multiple users. The `docker` group is the most relevant for self-hosting.

### Common Group Commands

```bash
# Create a group
sudo groupadd mygroup

# Add a user to a group
sudo usermod -aG docker username

# Remove a user from a group
sudo gpasswd -d username groupname

# List groups a user belongs to
groups username

# List all members of a group
getent group docker
```

### The Docker Group

Any user in the `docker` group can run Docker commands without `sudo`. This is functionally equivalent to root access — a user with Docker access can mount any file system into a container and read/write it.

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in for the change to take effect
# Or run this to apply immediately in the current session:
newgrp docker
```

Only add trusted users to the `docker` group.

## Users and Groups in Docker Containers

This is where most self-hosting permission issues originate.

### How Container UIDs Map to Host UIDs

Docker containers share the host kernel. UID 33 inside a container is the same UID 33 on the host — they're the same user from the kernel's perspective, even if they have different names.

When a container process writes a file to a bind mount:

```
Container process (UID 33, "www-data") →
  writes to /var/www/html →
    mapped to host /srv/nextcloud/html →
      file on host owned by UID 33
```

If UID 33 on your host is a different user (or doesn't exist), you'll see a numeric ID when you `ls -la` the files on the host.

### Setting the Container User with PUID/PGID

Many container images (especially LinuxServer.io images) accept `PUID` and `PGID` environment variables:

```yaml
services:
  sonarr:
    image: lscr.io/linuxserver/sonarr:4.0.2
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - /srv/sonarr/config:/config
      - /srv/media:/media
    restart: unless-stopped
```

This tells the container to run its internal processes as UID 1000 / GID 1000, matching your host user. Files written to bind mounts will be owned by your user.

### Setting the User Directly

For containers without PUID/PGID support, use the `user` directive:

```yaml
services:
  myapp:
    image: myapp:1.0
    user: "1000:1000"
    volumes:
      - /srv/myapp:/data
    restart: unless-stopped
```

This forces all processes in the container to run as UID 1000, GID 1000.

### Fixing Permission Issues

The most common self-hosting error: container can't write to its data directory.

```bash
# Check what UID/GID the container expects
docker exec container_name id
# or
docker exec container_name ls -la /data

# Set ownership on the host volume to match
sudo chown -R 1000:1000 /srv/myapp

# Or match the container's expected user
sudo chown -R 33:33 /srv/nextcloud
```

See [Docker Volume Permissions](/foundations/docker-volume-permissions) for a thorough troubleshooting guide.

## Practical Examples

### Shared Media Library

Multiple containers (Jellyfin, Sonarr, Radarr) need access to the same media directory:

```bash
# Create a shared group
sudo groupadd -g 2000 media

# Add your user to it
sudo usermod -aG media $USER

# Set the media directory ownership
sudo chown -R 1000:2000 /srv/media
sudo chmod -R 775 /srv/media

# Set the setgid bit so new files inherit the group
sudo chmod g+s /srv/media
```

Then in each container, set the GID to 2000:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.9.6
    user: "1000:2000"
    volumes:
      - /srv/media:/media:ro
    restart: unless-stopped
```

### Running rootless Docker

For maximum security, run Docker in rootless mode — the Docker daemon itself runs as a non-root user:

```bash
# Install rootless Docker
dockerd-rootless-setuptool.sh install

# Start rootless Docker
systemctl --user start docker

# Verify
docker info | grep "Root Dir"
```

Rootless Docker adds an extra layer of isolation. A container escape gives the attacker only your user's permissions, not root.

## Common Mistakes

### Running Everything as Root

Using `sudo docker` for everything or running containers as root. This works but eliminates the security boundary between containers and host. Use specific UIDs instead.

### Forgetting `newgrp` After Adding to a Group

After `usermod -aG docker username`, the change doesn't take effect until the user logs out and back in. Use `newgrp docker` for an immediate fix in the current session.

### Mismatched UIDs Between Container and Host

Container expects UID 1000 but your host user is UID 1001. Files get created with the wrong owner. Always check `id` on both the host and inside the container.

### Using `chmod 777` as a Fix

Setting everything to world-writable (777) fixes permission errors but creates a security hole. Any process on the system can read, write, and delete those files. Fix the ownership instead.

## Next Steps

- Fix specific Docker permission errors with [Docker Volume Permissions](/foundations/docker-volume-permissions)
- Understand file permissions in depth at [Linux Permissions](/foundations/linux-permissions)
- Secure your server with [Security Hardening](/foundations/security-hardening)
- Learn about Docker's isolation model in [Docker Security](/foundations/docker-security)

## FAQ

### What UID/GID should I use for my containers?

Use your regular user's UID/GID (usually 1000:1000) for most containers. This ensures files written by containers are owned by your user and easy to manage. Check with `id` on your host.

### Is adding a user to the docker group safe?

The `docker` group grants root-equivalent access. Only add users who you'd trust with root access. For shared servers, consider rootless Docker or Podman instead.

### How do I find what user a container runs as?

Run `docker exec container_name id` on a running container. Or check `docker inspect container_name | grep '"User"'` for the configured user.

### Can two containers share files if they run as different users?

Yes, using a shared group. Create a group, add both container UIDs to it, and set the directory's group ownership. Use `chmod g+rw` to grant group read/write access.

### What is user namespace remapping?

Docker can remap container UIDs to different host UIDs using the `userns-remap` feature. UID 0 inside the container maps to a high-numbered unprivileged UID on the host, adding security isolation. Configure it in `/etc/docker/daemon.json`.

## Related

- [Linux Permissions](/foundations/linux-permissions)
- [Docker Volume Permissions](/foundations/docker-volume-permissions)
- [Docker Security](/foundations/docker-security)
- [Security Hardening](/foundations/security-hardening)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [SSH Setup](/foundations/ssh-setup)
- [Docker Compose Basics](/foundations/docker-compose-basics)

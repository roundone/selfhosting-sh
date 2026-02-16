---
title: "Linux File Permissions for Self-Hosting"
description: "Understand Linux file permissions, ownership, and access control — essential knowledge for managing Docker volumes and self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["linux", "permissions", "security", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Linux File Permissions?

Linux file permissions control who can read, write, and execute files and directories on your server. Every file has three permission sets: one for the owner, one for the group, and one for everyone else. Getting permissions wrong is the #1 cause of "permission denied" errors in self-hosted Docker containers.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- SSH access to your server ([SSH Setup Guide](/foundations/ssh-setup))
- Basic terminal familiarity ([Linux Basics](/foundations/linux-basics-self-hosting))

## Understanding Permission Notation

Every file and directory has permissions displayed as a 10-character string:

```bash
ls -la /opt/myapp/
# drwxr-xr-x 2 john docker 4096 Feb 16 10:00 data
# -rw-r--r-- 1 john docker  512 Feb 16 10:00 config.yml
```

Breaking down `-rw-r--r--`:

| Position | Character | Meaning |
|----------|-----------|---------|
| 1 | `-` | File type (`-` = file, `d` = directory, `l` = symlink) |
| 2-4 | `rw-` | Owner permissions (read, write, no execute) |
| 5-7 | `r--` | Group permissions (read only) |
| 8-10 | `r--` | Others permissions (read only) |

The three permission types:

| Permission | Symbol | On Files | On Directories |
|-----------|--------|----------|----------------|
| Read | `r` (4) | View file contents | List directory contents |
| Write | `w` (2) | Modify file | Create/delete files inside |
| Execute | `x` (1) | Run as program | Enter directory (cd into it) |

## Numeric (Octal) Notation

Permissions are often expressed as three digits. Each digit is the sum of the permission values:

```
r = 4, w = 2, x = 1

rwx = 4+2+1 = 7
rw- = 4+2+0 = 6
r-x = 4+0+1 = 5
r-- = 4+0+0 = 4
```

Common permission sets:

| Octal | Symbol | Typical Use |
|-------|--------|-------------|
| `755` | `rwxr-xr-x` | Directories, executable scripts |
| `644` | `rw-r--r--` | Regular files, configs |
| `600` | `rw-------` | Private keys, secrets, `.env` files |
| `700` | `rwx------` | Private directories |
| `775` | `rwxrwxr-x` | Shared group directories |
| `666` | `rw-rw-rw-` | Files writable by everyone (avoid this) |

## Changing Permissions with chmod

```bash
# Numeric notation (recommended — explicit and unambiguous)
chmod 755 /opt/myapp/
chmod 644 /opt/myapp/config.yml
chmod 600 /opt/myapp/.env

# Symbolic notation
chmod u+x script.sh        # Add execute for owner
chmod g+w shared-dir/      # Add write for group
chmod o-rwx private.key    # Remove all permissions for others
chmod a+r public-file.txt  # Add read for all (a = all)

# Recursive (apply to directory and all contents)
chmod -R 755 /opt/myapp/data/
```

**Recommendation:** Use numeric notation. It's explicit — `chmod 644 file` tells you exactly what the result will be. Symbolic notation like `chmod g+w` only tells you what changed, not the final state.

## Ownership: Users and Groups

Every file has an owner (user) and a group. Check with `ls -la`:

```bash
ls -la /opt/myapp/data/
# -rw-r--r-- 1 www-data www-data 1024 Feb 16 10:00 database.db
#               ^^^^^^^^ ^^^^^^^^
#               owner    group
```

### Changing Ownership with chown

```bash
# Change owner
chown john /opt/myapp/config.yml

# Change owner and group
chown john:docker /opt/myapp/config.yml

# Recursive (directory and all contents)
chown -R 1000:1000 /opt/myapp/data/

# Change group only
chgrp docker /opt/myapp/
```

### Why UID/GID Numbers Matter for Docker

Docker containers run processes as specific user IDs (UIDs) and group IDs (GIDs). When a container writes to a mounted volume, the files on your host are owned by that UID/GID — not a named user.

```bash
# Container runs as UID 1000 inside
# Files on host appear as UID 1000
ls -ln /opt/myapp/data/
# -rw-r--r-- 1 1000 1000 4096 Feb 16 10:00 app.db
```

Common Docker UIDs:

| UID | Used By |
|-----|---------|
| `0` | root (avoid for app processes) |
| `33` | www-data (many web apps) |
| `65534` | nobody (restricted processes) |
| `1000` | Default first user; many containers use this |

To find what UID a container uses:

```bash
docker exec mycontainer id
# uid=1000(appuser) gid=1000(appuser) groups=1000(appuser)
```

## Fixing Docker Volume Permission Issues

The most common permission problem in self-hosting: your container can't read/write its data directory.

### Method 1: Match Host Ownership to Container UID

```bash
# Find the container's UID
docker exec mycontainer id
# uid=1000(appuser) gid=1000(appuser)

# Set host directory ownership to match
chown -R 1000:1000 /opt/myapp/data/
```

### Method 2: Use PUID/PGID Environment Variables

LinuxServer.io containers (and many others) support `PUID` and `PGID` variables:

```yaml
services:
  myapp:
    image: lscr.io/linuxserver/someapp:latest
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - /opt/myapp/data:/config
```

This tells the container to run as UID 1000, matching your host user. Use `id` on your host to find your UID:

```bash
id
# uid=1000(john) gid=1000(john) groups=1000(john),999(docker)
```

### Method 3: Run Container as Specific User

```yaml
services:
  myapp:
    image: someapp:v1.0
    user: "1000:1000"
    volumes:
      - /opt/myapp/data:/data
```

**Caution:** Not all containers support running as non-root. Check the app's documentation first.

## Special Permissions

### setuid and setgid

```bash
# setuid (4xxx) — file executes as the file's owner
chmod 4755 /usr/bin/someprogram

# setgid (2xxx) — new files in directory inherit the directory's group
chmod 2775 /opt/shared-data/
```

The setgid bit on directories is useful for shared Docker volumes where multiple containers need group access.

### Sticky Bit

```bash
# Sticky bit (1xxx) — only file owner can delete files in directory
chmod 1777 /tmp
```

You'll rarely need to set this yourself, but `/tmp` uses it.

## ACLs: Fine-Grained Access Control

When basic permissions aren't enough (e.g., you need to give two different users write access without a shared group), use ACLs:

```bash
# Install ACL tools
sudo apt install acl

# Give user 'backup' read access to a directory
setfacl -R -m u:backup:rx /opt/myapp/data/

# Give group 'monitoring' read access
setfacl -R -m g:monitoring:rx /opt/myapp/data/

# View ACLs
getfacl /opt/myapp/data/

# Remove all ACLs
setfacl -b /opt/myapp/data/
```

## Practical Examples

### Securing a Docker Compose Setup

```bash
# Create app directory structure
sudo mkdir -p /opt/myapp/{data,config,logs}

# Set ownership to your user
sudo chown -R 1000:1000 /opt/myapp/

# Config files: owner read/write, group read, no others
chmod 640 /opt/myapp/config/*.yml

# .env file with secrets: owner only
chmod 600 /opt/myapp/.env

# Data directory: owner full, group read/execute
chmod 750 /opt/myapp/data/

# docker-compose.yml: readable but not writable by group
chmod 644 /opt/myapp/docker-compose.yml
```

### Setting Up Shared Storage for Multiple Containers

```bash
# Create shared media directory
sudo mkdir -p /opt/media/{movies,music,photos}

# Create a 'media' group
sudo groupadd -g 1500 media

# Add your user to the group
sudo usermod -aG media $(whoami)

# Set ownership and setgid
sudo chown -R root:media /opt/media/
sudo chmod -R 2775 /opt/media/

# Now all new files inherit the 'media' group
# Use GID 1500 in your Docker containers
```

## Common Mistakes

### 1. Using chmod 777 to "Fix" Permission Errors

`chmod 777` gives everyone full access. It "works" but is a massive security risk. Instead, find the correct UID and set proper ownership.

```bash
# Bad — never do this
chmod -R 777 /opt/myapp/data/

# Good — match the container's UID
chown -R 1000:1000 /opt/myapp/data/
chmod -R 755 /opt/myapp/data/
```

### 2. Forgetting Execute Permission on Directories

Directories need `x` (execute) permission to be entered. Without it, even `ls` fails:

```bash
# This makes the directory unlistable
chmod 644 /opt/myapp/data/

# Directories need execute permission
chmod 755 /opt/myapp/data/
```

### 3. Running Docker as Root Unnecessarily

If your container writes files as root (UID 0), those files are owned by root on your host. This makes backups and management harder. Use `PUID`/`PGID` or the `user:` directive when possible.

### 4. Not Securing .env Files

`.env` files often contain database passwords, API keys, and secrets. They should never be world-readable:

```bash
chmod 600 .env
```

### 5. Recursive chmod on Mixed Files and Directories

`chmod -R 755` gives execute permission to all files — which you don't want for data files. Use `find` to set different permissions for files vs directories:

```bash
# Set directories to 755
find /opt/myapp/ -type d -exec chmod 755 {} \;

# Set files to 644
find /opt/myapp/ -type f -exec chmod 644 {} \;
```

## Quick Reference

| Task | Command |
|------|---------|
| View permissions | `ls -la` |
| View with numeric UIDs | `ls -ln` |
| Change permissions | `chmod 755 file` |
| Change owner | `chown user:group file` |
| Recursive change | `chmod -R 755 dir/` or `chown -R user:group dir/` |
| Find your UID/GID | `id` |
| Find container's UID | `docker exec container id` |
| View ACLs | `getfacl file` |
| Set ACL | `setfacl -m u:user:rwx file` |

## FAQ

### What permissions should my Docker data directories have?

Set ownership to match the container's UID/GID (usually 1000:1000) and use `755` for directories. Check with `docker exec <container> id` to confirm the UID.

### Why are my Docker volume files owned by root?

The container process runs as root inside the container. Use the `PUID`/`PGID` environment variables (if supported) or the `user: "1000:1000"` directive in your `docker-compose.yml` to run as a non-root user.

### How do I share files between multiple Docker containers?

Create a shared group on the host, set the directory's group ownership and setgid bit (`chmod 2775`), and configure all containers to use the same GID. See the shared storage example above.

### Is chmod 777 ever acceptable?

No. There is always a better solution — matching UID/GID ownership, using groups, or setting ACLs. `chmod 777` is a security vulnerability that exposes your data to every process on the system.

### How do I fix "Permission denied" errors in Docker containers?

Check the container's UID with `docker exec <container> id`, then set the host directory ownership to match with `chown -R <uid>:<gid> /path/to/volume`. See the "Fixing Docker Volume Permission Issues" section above.

## Next Steps

- [Docker Volumes](/foundations/docker-volumes) — how volumes work and why permissions matter
- [SSH Setup Guide](/foundations/ssh-setup) — secure remote access to your server
- [Docker Compose Basics](/foundations/docker-compose-basics) — define multi-container applications

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [Docker Volumes Explained](/foundations/docker-volumes)
- [Docker Networking](/foundations/docker-networking)
- [SSH Setup Guide](/foundations/ssh-setup)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [Getting Started with Self-Hosting](/foundations/getting-started)

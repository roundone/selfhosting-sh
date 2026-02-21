---
title: "How to Self-Host Portainer with Docker"
description: "Deploy Portainer CE — a web-based Docker management UI for containers, images, volumes, and networks."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "docker-management"
apps:
  - portainer
tags: ["self-hosted", "docker-management", "portainer", "docker", "containers"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Portainer?

[Portainer CE](https://www.portainer.io/) is a web-based management UI for Docker that lets you view, start, stop, and restart containers, manage images, volumes, networks, and deploy full Compose stacks — all from a browser. It replaces command-line Docker management for anyone who prefers a GUI. Portainer CE is free, open-source, and the most widely used Docker management interface in the self-hosting community.

If you run more than a handful of containers, Portainer gives you a single dashboard to monitor everything. You can inspect logs, open a shell into a running container, pull images, and deploy new stacks without touching a terminal.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (Portainer is lightweight)
- Docker socket access (`/var/run/docker.sock`)
- A domain name (optional, for remote HTTPS access)

## Docker Compose Configuration

Create a directory for Portainer:

```bash
mkdir -p ~/portainer && cd ~/portainer
```

Create a `docker-compose.yml` file:

```yaml
services:
  portainer:
    image: portainer/portainer-ce:2.33.7
    container_name: portainer
    restart: unless-stopped
    ports:
      # HTTPS web UI — primary access method
      - "9443:9443"
      # HTTP web UI — use if behind a reverse proxy that handles TLS
      - "9000:9000"
      # TCP tunnel server for Edge Agents — remove if you don't use Edge
      - "8000:8000"
    volumes:
      # Docker socket — gives Portainer control over your Docker host
      - /var/run/docker.sock:/var/run/docker.sock
      # Persistent data — Portainer's database, TLS certs, settings
      - portainer_data:/data
    networks:
      - portainer_net

volumes:
  portainer_data:

networks:
  portainer_net:
    name: portainer_net
```

**About the Docker socket mount:** Mounting `/var/run/docker.sock` gives Portainer full control over Docker on the host — it can create, remove, start, and stop any container, pull any image, and manage volumes and networks. This is necessary for Portainer to function, but it means Portainer has root-equivalent access to your Docker host. Secure your Portainer instance accordingly: use a strong admin password, restrict network access, and consider placing it behind a reverse proxy with authentication.

Start Portainer:

```bash
docker compose up -d
```

## Initial Setup

Open `https://your-server-ip:9443` in your browser. You will see a self-signed certificate warning — accept it to continue.

**Create your admin account immediately.** Portainer enforces a timeout on initial setup. If you do not create an admin account within a few minutes of first launch, the instance locks itself for security. If this happens, restart the container to reset the timeout:

```bash
docker compose restart portainer
```

Set a strong admin username and password, then click **Create user**.

After login, you land on the **Home** screen. Portainer auto-detects the local Docker environment. Click on your **local** environment to see:

- **Dashboard** — container count, image count, volume count, network count at a glance
- **Containers** — list of all running and stopped containers
- **Stacks** — Docker Compose deployments managed through Portainer
- **Images** — all pulled images on the host
- **Volumes** — all Docker volumes
- **Networks** — all Docker networks

## Configuration

### Managing Containers

Navigate to **Containers** for a full list of every container on the host. For each container you can:

- **Start / Stop / Restart / Kill / Remove** — one-click controls
- **Logs** — stream container logs in real time with search and auto-refresh
- **Inspect** — view the full container configuration (environment variables, mounts, network settings, labels)
- **Console** — open an interactive shell (`/bin/bash` or `/bin/sh`) directly in the container from your browser
- **Stats** — live CPU, memory, and network usage graphs

This is where Portainer saves the most time. Checking logs or restarting a misbehaving container takes one click instead of `docker logs -f container_name` and `docker restart container_name`.

### Docker Compose Stacks

**Stacks** is Portainer's term for Docker Compose deployments. Navigate to **Stacks > Add stack** to deploy a `docker-compose.yml` from:

- **Web editor** — paste your Compose file directly into the browser
- **Upload** — upload a `docker-compose.yml` from your local machine
- **Git repository** — point to a Git repo containing your Compose file; Portainer pulls and deploys it automatically
- **Custom template** — use a saved template

Git-backed stacks are useful for version-controlled deployments. Portainer can auto-redeploy when the repo changes (see Webhooks below).

**When to use Stacks vs the CLI:** Use Stacks for quick deployments and for services you manage primarily through the Portainer UI. Use the CLI for production stacks where you want full control over the Compose file, environment variables, and deployment process. Many self-hosters use both — Portainer for monitoring and the CLI for deployments.

### Managing Images

Navigate to **Images** to see every image on your Docker host. You can:

- **Pull** a new image by name and tag
- **Remove** unused images
- **Prune** — bulk-remove all dangling (untagged) images to free disk space

Portainer shows the image size, creation date, and which containers use each image. This makes it easy to spot bloated or orphaned images.

### Managing Volumes

**Volumes** lists all Docker volumes with their driver, mount point, and creation date. You can:

- **Create** new named volumes
- **Remove** unused volumes (Portainer warns if a volume is in use)
- **Browse** volume contents (on supported storage drivers)

Check the **In use** column before removing anything. Deleting an active volume destroys data.

### Managing Networks

**Networks** shows all Docker networks. You can create bridge, overlay, or macvlan networks, and connect or disconnect containers from any network. This is useful for isolating services or troubleshooting connectivity between containers.

### App Templates

Portainer ships with built-in **App Templates** — one-click deployments for common self-hosted apps like WordPress, Nginx, Redis, and MariaDB. These are fine for quick experiments, but for production self-hosting, write your own Compose files. The built-in templates use generic configurations and often pull `:latest` tags. Your own Compose files with pinned versions and tailored environment variables are more reliable and reproducible.

## Advanced Configuration

### Multiple Docker Hosts (Agents)

Portainer can manage Docker on remote hosts via the **Portainer Agent**. On each remote host, deploy the agent:

```yaml
services:
  portainer-agent:
    image: portainer/agent:2.33.7
    container_name: portainer-agent
    restart: unless-stopped
    ports:
      - "9001:9001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
```

Then in your main Portainer instance, go to **Environments > Add environment > Agent** and enter the remote host's IP and port 9001. You can now manage all your Docker hosts from a single Portainer dashboard.

### Edge Agent

The **Edge Agent** is for Docker hosts behind NAT or firewalls that cannot accept inbound connections. The Edge Agent initiates an outbound connection to your Portainer server over port 8000 (the TCP tunnel server). This is why the Docker Compose config exposes port 8000 — remove it if you do not use Edge Agents.

To set up an Edge Agent, go to **Environments > Add environment > Edge Agent** and follow the generated deployment command.

### User Management and RBAC

Portainer CE supports basic user management:

- **Admin** — full control over everything
- **Standard users** — access restricted to assigned environments and resources
- **Teams** — group users and assign team-level access to environments

Full role-based access control (RBAC) with granular permissions is a Business Edition feature. For most self-hosters running a single server, the CE user model is sufficient. If you need per-container or per-stack permissions for multiple users, consider Portainer Business or use Linux user permissions at the Docker socket level.

### Container Webhooks

Portainer can generate a **webhook URL** for any container. When the webhook is called (via HTTP POST), Portainer pulls the latest version of the container's image and redeploys it. This enables automated redeployments from CI/CD pipelines or image registry webhooks.

To set up a webhook: open a container's details, scroll to **Webhook**, and toggle it on. Copy the generated URL and configure your image registry or CI pipeline to POST to it after a new image is pushed.

## Reverse Proxy

Portainer serves its own HTTPS on port 9443 using a self-signed certificate. For proper TLS with a real certificate, place Portainer behind a reverse proxy.

When behind a reverse proxy, use port 9000 (HTTP) internally and let the proxy handle TLS termination. You can remove the `9443:9443` port mapping from your Compose file in this case.

Example Nginx Proxy Manager configuration:

- **Scheme:** `http`
- **Forward Hostname:** `portainer` (container name) or your server IP
- **Forward Port:** `9000`
- **SSL:** enabled via the proxy

For a full reverse proxy setup guide, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Portainer stores all its data in the `/data` volume:

- Internal database (users, settings, environment configs, stack definitions)
- Self-signed TLS certificates
- Edge Agent keys and configurations

To back up Portainer, back up the `portainer_data` volume:

```bash
docker compose stop portainer
docker run --rm -v portainer_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/portainer-backup-$(date +%Y%m%d).tar.gz -C /data .
docker compose start portainer
```

Portainer also has a built-in backup feature under **Settings > Backup configuration** where you can download or schedule backups of the internal database. For a complete backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Admin Account Creation Timeout

**Symptom:** You navigate to `https://your-server:9443` and see a message saying the instance has been locked or timed out.

**Fix:** Restart the container to reset the initialization timeout:

```bash
docker compose restart portainer
```

Access the UI immediately after the restart and create your admin account. Portainer enforces this timeout as a security measure — an uninitialized instance with no password is a risk.

### Docker Socket Permission Denied

**Symptom:** Portainer starts but shows "failed to connect to Docker" or displays no containers.

**Fix:** Verify the Docker socket is mounted correctly and the Portainer container has permission to access it:

```bash
ls -la /var/run/docker.sock
```

The socket should be owned by `root:docker`. If you are running Docker rootless or have a non-standard socket path, update the volume mount in your Compose file to match your actual socket location.

### Stacks Not Updating After Edit

**Symptom:** You edit a stack in the Portainer UI and click "Update the stack," but the containers do not reflect the changes.

**Fix:** When updating a stack, check the **Re-pull image and redeploy** option. Without this, Portainer reuses cached images even if you changed the image tag. For environment variable changes, the containers must be recreated — Portainer handles this automatically when you update the stack, but verify the new variables appear in the container's inspect view.

### Cannot Connect to Remote Docker Host

**Symptom:** Adding a remote environment via the Portainer Agent fails with a connection timeout.

**Fix:** Verify that port 9001 is open on the remote host's firewall, the Portainer Agent container is running on the remote host, and both the Agent and Portainer server are on the same version. Version mismatches between Agent and server cause connection failures. Check the Agent logs:

```bash
docker logs portainer-agent
```

## Resource Requirements

- **RAM:** ~100 MB idle, ~200 MB under active use with many containers
- **CPU:** Very low — Portainer is a lightweight Go application
- **Disk:** ~200 MB for the application and database. Grows slowly with stack history and user data.

Portainer is one of the lightest self-hosted management tools available. It runs comfortably on a Raspberry Pi 4 or any entry-level VPS.

## Verdict

Portainer CE is the best Docker management UI for self-hosters. It saves real time on everyday tasks — checking logs, restarting containers, inspecting environment variables, and deploying stacks. If you run more than three or four containers, install Portainer. The overhead is negligible and the convenience is immediate.

Power users will still use the CLI for complex deployments and scripting, but Portainer is the fastest way to get a visual overview of your Docker host and handle quick management tasks. The multi-host Agent feature is a bonus if you run Docker across several machines.

The main alternative is [Dockge](/apps/dockge) — a simpler, more focused tool built around `docker-compose.yml` file management. Choose Portainer if you want a comprehensive Docker management dashboard with container inspection, image management, network control, and multi-host support. Choose Dockge if you want a clean, minimal interface focused specifically on managing Compose stacks. For most self-hosters, Portainer is the right starting point.

## Related

- [Best Self-Hosted Docker Management](/best/docker-management)
- [Portainer vs Dockge](/compare/portainer-vs-dockge)
- [Cosmos Cloud vs Portainer](/compare/cosmos-cloud-vs-portainer)
- [Portainer vs Lazydocker](/compare/portainer-vs-lazydocker)
- [Watchtower (deprecated) vs Portainer](/compare/watchtower-vs-portainer)
- [Diun vs Portainer](/compare/diun-vs-portainer)
- [How to Self-Host Dockge](/apps/dockge)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Docker Volumes](/foundations/docker-volumes)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Security Basics](/foundations/security-hardening)

---
title: "How to Self-Host Yacht with Docker Compose"
description: "Deploy Yacht with Docker Compose for a lightweight web UI to manage Docker containers, templates, and app deployments on your server."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - yacht
tags:
  - self-hosted
  - docker
  - yacht
  - container-management
  - docker-ui
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Yacht?

[Yacht](https://yacht.sh) is a lightweight Docker container management UI designed for self-hosters. It provides a clean web interface for deploying, managing, and monitoring containers, with built-in app templates that let you deploy popular self-hosted apps in a few clicks. Think of it as a simpler alternative to Portainer — fewer features, but faster to learn.

> **⚠️ Deprecated — Not Recommended for New Installations.** Yacht has not been updated since January 2023. The last published Docker tag is `v0.0.7-alpha`. The `v0.0.8` tag does not exist on Docker Hub. The project appears abandoned with no active development. **We strongly recommend [Portainer](/apps/portainer) or [Dockge](/apps/dockge) instead.** This guide is preserved for reference only.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- 1 GB of free disk space

## Docker Compose Configuration

Create a directory and `docker-compose.yml`:

```bash
mkdir -p ~/yacht && cd ~/yacht
```

```yaml
services:
  yacht:
    # Last tagged build: Jan 2023 — project in major rewrite
    image: selfhostedpro/yacht:v0.0.7-alpha-2023-01-12--05
    container_name: yacht
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - yacht-data:/config
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      PUID: 1000
      PGID: 1000
      # Secret key for session encryption — change this
      SECRET_KEY: "your-random-secret-key-change-me"
      # Disable telemetry
      DISABLE_ANALYTICS: "true"

volumes:
  yacht-data:
```

Start the stack:

```bash
docker compose up -d
```

**Security note:** Mounting the Docker socket (`/var/run/docker.sock`) gives Yacht full control over your Docker daemon. This is equivalent to root access on the host. Only expose Yacht on trusted networks.

## Initial Setup

1. Open `http://your-server-ip:8000`
2. Log in with the default credentials:
   - **Email:** `admin@yacht.sh`
   - **Password:** `pass`
3. **Change the password immediately** — go to the user icon in the top right and update your credentials.

## Configuration

### Adding App Templates

Yacht's template system lets you deploy apps from curated lists:

1. Go to **Templates** in the sidebar
2. Click **Add Template**
3. Enter a template URL. The default SelfhostedPro template:
   ```
   https://raw.githubusercontent.com/SelfhostedPro/selfhosted_templates/master/Template/yacht.json
   ```
4. Click **Submit**

You can now deploy apps from the template library with pre-configured settings.

### Deploying a Container

From the template library:
1. Browse templates and click **Deploy** on the app you want
2. Review and adjust port mappings, volumes, and environment variables
3. Click **Deploy**

Manually:
1. Go to **Apps** > **New Application**
2. Fill in the image name, ports, volumes, environment variables, and restart policy
3. Click **Deploy**

### Container Management

From the **Apps** page you can:
- Start, stop, restart, and remove containers
- View container logs in real-time
- Inspect container details (ports, volumes, environment)
- Access container shell (exec into running containers)

## Advanced Configuration (Optional)

### Using Compose Projects

Yacht supports Docker Compose projects for multi-container stacks:

1. Go to **Projects** in the sidebar
2. Create a new project with a `docker-compose.yml` definition
3. Yacht manages the entire stack lifecycle

### Custom Templates

Create your own template JSON files for apps you deploy frequently. Host them on a web server or GitHub and add the URL to Yacht.

### Theme Customization

Yacht supports dark and light themes. Toggle via the theme switcher in the top navigation bar.

## Backup

Back up the config volume:

```bash
docker compose stop yacht
docker run --rm -v yacht-data:/config -v $(pwd):/backup alpine \
  tar czf /backup/yacht-backup.tar.gz /config
docker compose start yacht
```

The `/config` volume contains Yacht's database (user accounts, templates, settings). Container data for apps deployed through Yacht lives in their own volumes.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Cannot connect to Docker daemon

**Symptom:** Yacht shows "Cannot connect to the Docker daemon" or no containers appear.

**Fix:** Verify the Docker socket is mounted correctly and the socket file exists:
```bash
ls -la /var/run/docker.sock
```
Ensure the user running the container has access to the Docker socket. If using rootless Docker, the socket path differs.

### Default login not working

**Symptom:** `admin@yacht.sh` / `pass` is rejected.

**Fix:** The credentials are only set on first startup. If the config volume already has data from a previous installation, the old credentials persist. Remove the volume and recreate:
```bash
docker compose down -v
docker compose up -d
```

### Template deployment fails

**Symptom:** Deploying from a template shows an error.

**Fix:** Check that the template URL is reachable from the server. Some templates reference images that may not exist for your architecture (ARM vs x86). Check container logs:
```bash
docker logs yacht
```

### Port conflicts

**Symptom:** Container fails to start with port binding errors.

**Fix:** Change the host port in your `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Use 8001 if 8000 is taken
```

### High memory usage

**Symptom:** Yacht uses more memory than expected.

**Fix:** Yacht's memory usage increases with the number of containers it monitors. For servers with 50+ containers, consider using [Portainer](/apps/portainer) which handles scale better.

## Resource Requirements

- **RAM:** ~80 MB idle, ~150 MB with 20+ managed containers
- **CPU:** Low — web UI is lightweight
- **Disk:** ~200 MB for application, plus template cache

## Verdict

**We do not recommend Yacht for new installations.** The project has been abandoned since January 2023 with no stable release ever published (only alpha tags). The maintainer mentioned a rewrite ("Yacht Next") but no progress has materialized in over three years.

For Docker management, use [Portainer](/apps/portainer) (feature-complete, actively maintained) or [Dockge](/apps/dockge) (lightweight, Compose-focused). Both are superior choices in every dimension — features, security updates, and community support.

## Frequently Asked Questions

### Is Yacht still maintained?

The current version (v0.0.x) receives minimal updates. The developer is working on a rewrite called Yacht Next, but there's no stable release date. For production use, consider Portainer or Dockge instead.

### Can Yacht manage Docker Compose stacks?

Yes, through the Projects feature. However, the Compose support is basic compared to Dockge or Portainer. You can't edit Compose files directly in the UI as easily.

### How does Yacht compare to Portainer?

Yacht is simpler with better app templates. Portainer is more feature-complete with Swarm/K8s support, RBAC, and active development. See our [Portainer vs Yacht comparison](/compare/portainer-vs-yacht).

### Does Yacht support ARM/Raspberry Pi?

Yes. The `selfhostedpro/yacht` image is available for both amd64 and arm64 architectures.

## Related

- [How to Self-Host Portainer](/apps/portainer)
- [How to Self-Host Dockge](/apps/dockge)
- [Portainer vs Yacht](/compare/portainer-vs-yacht)
- [Portainer vs Dockge](/compare/portainer-vs-dockge)
- [Dockge vs Yacht](/compare/dockge-vs-yacht)
- [Best Docker Management Tools](/best/docker-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)

---
title: "Docker Networking for Self-Hosting"
description: "Understand Docker bridge networks, host networking, container DNS, and inter-container communication for self-hosted apps."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "networking", "containers"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docker Networking?

Docker networking controls how containers communicate -- with each other, with the host machine, and with the outside world. For self-hosting, this is foundational. Nearly every app you deploy needs to talk to a database, a cache, a reverse proxy, or another service. Get networking wrong and containers silently fail to connect, ports conflict, or services leak onto interfaces you didn't intend.

Docker provides several network drivers. You'll use two or three of them regularly. The rest are edge cases. This guide covers what matters for running self-hosted apps.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Basic familiarity with ports and IP addresses ([Networking Concepts](/foundations/ports-explained/))

## Default Network Behavior

When you run `docker compose up` without defining any networks, Docker Compose creates a default bridge network named after your project directory. Every service in the Compose file joins this network automatically.

```yaml
# docker-compose.yml
services:
  app:
    image: myapp:1.0
  db:
    image: postgres:16
```

Running `docker compose up -d` here creates a network called `myproject_default` (where `myproject` is the directory name). Both `app` and `db` join it. The `app` container can reach the database at hostname `db` on port 5432 -- no configuration needed.

This default behavior works fine for simple stacks. You only need custom networks when you want isolation between groups of containers or need to share a network across multiple Compose files.

## Bridge Networks

Bridge networks are the standard network type for Docker containers. Each bridge network is an isolated Layer 2 segment. Containers on the same bridge can talk to each other. Containers on different bridges cannot, unless explicitly connected to both.

### Defining Custom Bridge Networks

```yaml
services:
  app:
    image: ghcr.io/example/app:2.4.0
    networks:
      - backend
      - proxy

  db:
    image: postgres:16
    networks:
      - backend

  nginx:
    image: nginx:1.25
    networks:
      - proxy
    ports:
      - "80:80"

networks:
  backend:
  proxy:
```

In this setup:

- `app` is on both `backend` and `proxy` -- it can reach the database and the reverse proxy.
- `db` is only on `backend` -- it cannot be reached by `nginx` directly. This is intentional. Your database should never be accessible from the proxy network.
- `nginx` is only on `proxy` -- it forwards traffic to `app` but has no path to `db`.

This is the pattern you should use for any app with a database. Put the database on a private backend network. Put the app on both the backend and the proxy network. The database stays isolated.

### Why Custom Networks Matter

The default network puts every container on the same segment. That means your reverse proxy can reach your database, your monitoring stack can reach your media server's internals, and any compromised container can scan everything else.

Custom bridge networks give you segmentation with zero performance cost. Use them.

## Host Networking

Host networking removes the network isolation between the container and the host. The container uses the host's network stack directly -- no bridge, no NAT, no port mapping.

```yaml
services:
  pihole:
    image: pihole/pihole:2024.07.0
    network_mode: host
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "changeme"
    volumes:
      - pihole_data:/etc/pihole
      - dnsmasq_data:/etc/dnsmasq.d
    restart: unless-stopped

volumes:
  pihole_data:
  dnsmasq_data:
```

### When to Use Host Networking

- **DNS servers** like [Pi-hole](/apps/pi-hole/) that need to bind to port 53 on all interfaces and handle raw DNS traffic.
- **Network monitoring tools** that need to see actual client IPs without NAT translation.
- **DHCP servers** that need Layer 2 access to the host's network.

### When to Avoid It

Most of the time. Host networking disables port isolation, so the container can bind to any port on the host. You lose the ability to run two containers on the same port. You lose network-level isolation. For standard web apps with a reverse proxy in front, bridge networking is always the better choice.

**Rule of thumb:** If the app works fine behind a reverse proxy on a bridge network, don't use host networking.

## Container DNS

Docker runs an embedded DNS server at `127.0.0.11` inside every user-defined bridge network. Containers resolve each other by service name -- the name you define in `docker-compose.yml`.

```yaml
services:
  wordpress:
    image: wordpress:6.5
    environment:
      WORDPRESS_DB_HOST: mariadb   # <-- resolved by Docker DNS
      WORDPRESS_DB_NAME: wp
    networks:
      - backend

  mariadb:
    image: mariadb:11.3
    environment:
      MARIADB_DATABASE: wp
      MARIADB_ROOT_PASSWORD: changeme
    networks:
      - backend

networks:
  backend:
```

The `wordpress` container connects to `mariadb:3306` using the service name as the hostname. Docker DNS resolves `mariadb` to the container's IP on the `backend` network. No hardcoded IPs, no hosts file entries.

### Key DNS Behaviors

- **Service name = hostname.** The service name in your Compose file is the DNS name other containers use.
- **Only works on user-defined networks.** The legacy default bridge (`docker0`) does not support DNS resolution by name. Docker Compose's auto-created networks are user-defined, so they do support it.
- **Container name works too.** If you set `container_name: my-db`, other containers can resolve `my-db`. But service names are more reliable -- use those.
- **External DNS still works.** Containers can resolve public domains (google.com, github.com) normally. Docker forwards these to the host's configured DNS servers.

### The localhost Trap

Inside a container, `localhost` means the container itself, not the host machine. This is the single most common networking mistake in self-hosting.

If your app config says `DB_HOST=localhost`, it tries to connect to a database inside the same container -- which doesn't exist. Use the service name instead: `DB_HOST=mariadb`.

Similarly, if you need to reach a service running directly on the host (not in Docker), use the special hostname `host.docker.internal` on Docker Desktop, or the host's actual IP address on Linux. Do not use `localhost`.

## Connecting Services Across Compose Files

A reverse proxy typically lives in its own Compose file and needs to reach apps defined in other Compose files. External networks solve this.

### Step 1: Create a Shared Network

```bash
docker network create proxy
```

### Step 2: Reference It in Your Reverse Proxy Compose File

```yaml
# reverse-proxy/docker-compose.yml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:2.11.3
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    networks:
      - proxy
    restart: unless-stopped

volumes:
  npm_data:
  npm_letsencrypt:

networks:
  proxy:
    external: true
```

### Step 3: Join the Same Network from Your App

```yaml
# nextcloud/docker-compose.yml
services:
  nextcloud:
    image: nextcloud:29.0
    networks:
      - proxy
      - backend
    restart: unless-stopped

  db:
    image: postgres:16
    networks:
      - backend
    restart: unless-stopped

networks:
  proxy:
    external: true
  backend:
```

Now `nginx-proxy-manager` can reach `nextcloud` by service name across Compose files. The `db` container stays isolated on the `backend` network -- the reverse proxy cannot reach it.

This pattern scales to any number of apps. Every app joins the shared `proxy` network for ingress and keeps its own private network for backend services. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for the full configuration.

## Port Mapping

Port mapping publishes a container port on the host. It only matters for traffic entering from outside Docker -- container-to-container communication on the same network uses the container port directly, no mapping needed.

### `ports` vs `expose`

```yaml
services:
  app:
    image: myapp:1.0
    ports:
      - "8080:80"     # host:container -- accessible from outside
    expose:
      - "9090"         # only visible to other containers on the same network
```

- **`ports`** maps a container port to a host port. External traffic can reach the container on `host-ip:8080`.
- **`expose`** documents which ports the container listens on internally. It does not publish anything to the host. Other containers on the same network can already reach any port on the container -- `expose` is purely informational.

### Binding to Specific Interfaces

By default, `ports: "8080:80"` binds to `0.0.0.0` -- all network interfaces. This means the port is accessible from the LAN, the internet (if not firewalled), and anywhere else.

To restrict to localhost only:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

This is important when you have a [reverse proxy](/foundations/reverse-proxy-explained/) in front. The app should only accept connections from the proxy, not directly from the internet. Bind to `127.0.0.1` or, better yet, skip `ports` entirely and keep the app on a shared bridge network with the proxy.

**Best practice for apps behind a reverse proxy:** Don't publish ports at all. Put the app and proxy on the same Docker network and let the proxy connect directly on the container port. No host port, no exposure.

## Macvlan Networks

Macvlan gives a container its own IP address on your physical LAN. To your router and other devices, the container looks like a separate machine with its own MAC address.

```yaml
services:
  pihole:
    image: pihole/pihole:2024.07.0
    networks:
      pihole_net:
        ipv4_address: 192.168.1.53
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "changeme"
    volumes:
      - pihole_data:/etc/pihole
      - dnsmasq_data:/etc/dnsmasq.d
    restart: unless-stopped

volumes:
  pihole_data:
  dnsmasq_data:

networks:
  pihole_net:
    driver: macvlan
    driver_opts:
      parent: eth0
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.48/28
```

### When Macvlan Makes Sense

- Running [Pi-hole](/apps/pi-hole/) or AdGuard Home as your network's DNS server. A dedicated LAN IP means you can point your router's DHCP to it without port conflicts.
- Running a service that needs to appear as a first-class network citizen (its own IP, no NAT).

### Trade-offs

Macvlan adds real complexity. The host cannot communicate with macvlan containers without a bridge shim. IP address management is manual. If your DHCP range overlaps with macvlan's `ip_range`, you get conflicts. For most self-hosted apps, bridge networking with port mapping or a reverse proxy is simpler and works perfectly.

**Recommendation:** Use macvlan only for DNS servers that need a dedicated LAN IP. For everything else, stick with bridge networks.

## Common Mistakes

**Using `localhost` to connect between containers.** Inside a container, `localhost` is the container itself. Use the service name from your Compose file. If the database service is named `db`, set `DB_HOST=db`.

**Forgetting to put services on the same network.** Two services on different bridge networks cannot reach each other. If your app can't connect to its database, check that both are on the same network.

**Publishing database ports to the host.** Adding `ports: "5432:5432"` to your PostgreSQL service exposes it to your entire network. Databases should only be on internal bridge networks with no published ports.

**Using the default bridge network (`docker0`) directly.** The default bridge does not support DNS resolution by container name. Always use Compose-managed networks or explicitly created user-defined bridges.

**Binding to `0.0.0.0` with no firewall.** Publishing a port binds to all interfaces by default. If your server has a public IP and no firewall, that port is open to the internet. Either bind to `127.0.0.1`, use a firewall, or skip port publishing and use a reverse proxy.

**Hardcoding container IPs.** Container IPs change on restart. Always use service names for inter-container communication. Docker DNS handles the resolution.

## Next Steps

- Set up a [reverse proxy](/foundations/reverse-proxy-explained/) to route traffic to your containerized apps with automatic SSL.
- Learn [Docker volume management](/foundations/docker-volumes/) for persistent storage across container restarts.
- Follow the [Getting Started](/foundations/getting-started/) guide to deploy your first self-hosted app.
- Read about [DNS fundamentals](/foundations/dns-explained/) to understand how name resolution works beyond Docker.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes and Persistent Storage](/foundations/docker-volumes/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Networking Concepts: Ports, DNS, DHCP](/foundations/ports-explained/)
- [DNS Explained](/foundations/dns-explained/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [How to Self-Host Pi-hole](/apps/pi-hole/)

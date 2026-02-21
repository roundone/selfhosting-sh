---
title: "Advanced Docker Compose Networking"
description: "Master Docker Compose networking — custom networks, external networks, multi-stack communication, macvlan, load balancing, and network isolation."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "networking", "docker-compose", "advanced", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Beyond Default Networking

Docker Compose automatically creates a bridge network for each project. That's enough for simple setups. But when you run multiple Compose stacks, need network isolation between services, or want containers to have real LAN IPs, you need advanced networking.

## Prerequisites

- Docker Compose basics ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Docker networking fundamentals ([Docker Networking](/foundations/docker-networking/))
- Understanding of IP addresses and subnets ([Subnets and VLANs](/foundations/subnets-vlans/))

## Custom Named Networks

### Why Use Custom Networks

Default Compose networking creates a network named `projectname_default`. This is fine for a single stack, but doesn't help when services in different stacks need to communicate.

```yaml
# Explicit named network in a single stack
services:
  app:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend  # Not on frontend — isolated from the web
  nginx:
    networks:
      - frontend

networks:
  frontend:
  backend:
```

This creates two networks. The `db` service is only accessible from `app`, not from `nginx`. The `app` service bridges both networks.

### Network Isolation

Use multiple networks to control which containers can talk to each other:

```yaml
services:
  # Public-facing reverse proxy
  proxy:
    image: caddy:2.7.6
    ports:
      - "80:80"
      - "443:443"
    networks:
      - proxy-net

  # Web application — accessible from proxy, can reach database
  webapp:
    image: myapp:v1.0
    networks:
      - proxy-net
      - db-net

  # Database — only accessible from webapp
  db:
    image: postgres:16.2
    networks:
      - db-net

  # Redis cache — only accessible from webapp
  redis:
    image: redis:7.2
    networks:
      - db-net

networks:
  proxy-net:
  db-net:
```

The database and Redis are completely unreachable from the proxy and the outside world. Even if the proxy is compromised, the attacker can't reach the database.

## External Networks (Cross-Stack Communication)

The most important advanced pattern. External networks let containers in different Docker Compose files communicate.

### Create the Shared Network

```bash
docker network create proxy-network
```

### Use It in Multiple Stacks

```yaml
# Stack 1: Reverse Proxy (docker-compose.yml in /opt/proxy/)
services:
  caddy:
    image: caddy:2.7.6
    ports:
      - "80:80"
      - "443:443"
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
```

```yaml
# Stack 2: Nextcloud (docker-compose.yml in /opt/nextcloud/)
services:
  nextcloud:
    image: nextcloud:29.0.0
    networks:
      - proxy-network
      - internal

  db:
    image: postgres:16.2
    networks:
      - internal  # Not on proxy-network — isolated

networks:
  proxy-network:
    external: true
  internal:
    # Internal-only network
```

```yaml
# Stack 3: Gitea (docker-compose.yml in /opt/gitea/)
services:
  gitea:
    image: gitea/gitea:1.22.0
    networks:
      - proxy-network
      - internal

  db:
    image: postgres:16.2
    networks:
      - internal

networks:
  proxy-network:
    external: true
  internal:
```

Now Caddy can reach both `nextcloud` and `gitea` by service name on the shared `proxy-network`. Each stack's database is isolated on its own `internal` network.

### Service Discovery Across Stacks

On the shared external network, containers are reachable by their **service name**:

```bash
# From the caddy container
docker exec caddy nslookup nextcloud  # Resolves to nextcloud's IP
docker exec caddy nslookup gitea      # Resolves to gitea's IP
```

**Potential conflict:** If two stacks define a service with the same name (e.g., both have a `db` service), and both are on the same external network, there will be a name conflict. Solution: use unique service names for anything on external networks, or keep conflicting names on internal-only networks.

## Custom Subnets

Specify exact IP ranges for your networks:

```yaml
networks:
  mynet:
    driver: bridge
    ipam:
      config:
        - subnet: 10.20.0.0/24
          gateway: 10.20.0.1
```

### Static IP Assignment

Assign fixed IPs to containers (useful for network-level configuration):

```yaml
services:
  pihole:
    image: pihole/pihole:2024.02.0
    networks:
      mynet:
        ipv4_address: 10.20.0.53

networks:
  mynet:
    driver: bridge
    ipam:
      config:
        - subnet: 10.20.0.0/24
```

Avoid static IPs unless you specifically need them. Docker's built-in DNS (service name resolution) is more flexible and survives container recreation.

## macvlan — Containers on the LAN

macvlan gives containers their own IP addresses on your physical network. Other devices on your LAN can reach them directly — no port mapping needed.

### Use Case

Running Pi-hole or AdGuard Home as the network's DNS server. The DNS server needs its own IP on the LAN.

```yaml
services:
  pihole:
    image: pihole/pihole:2024.02.0
    networks:
      lan:
        ipv4_address: 192.168.1.53  # Real LAN IP
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "changeme"

networks:
  lan:
    driver: macvlan
    driver_opts:
      parent: eth0  # Your physical network interface
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.48/28  # .48-.63 reserved for containers
```

### macvlan Limitations

1. **Host can't reach macvlan containers directly.** This is a Linux kernel limitation. Create a macvlan shim interface on the host as a workaround:

```bash
sudo ip link add macvlan-shim link eth0 type macvlan mode bridge
sudo ip addr add 192.168.1.62/32 dev macvlan-shim
sudo ip link set macvlan-shim up
sudo ip route add 192.168.1.53/32 dev macvlan-shim
```

2. **IP range must not overlap with your DHCP pool.** Reserve a range for containers that your router's DHCP won't assign.

3. **WiFi interfaces often don't support macvlan.** Use a wired connection.

## ipvlan — Alternative to macvlan

ipvlan is similar to macvlan but shares the host's MAC address. Use it when your network switch limits MAC addresses per port.

```yaml
networks:
  lan:
    driver: ipvlan
    driver_opts:
      parent: eth0
      ipvlan_mode: l2  # Layer 2 mode (same as macvlan behavior)
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.48/28
```

## Internal Networks

Mark a network as internal to prevent containers from reaching the internet:

```yaml
networks:
  db-only:
    internal: true  # No internet access
```

Use this for database networks where containers should only talk to each other, never to the outside world.

```yaml
services:
  app:
    networks:
      - web      # Internet access through this network
      - db-only  # Database access through this one

  db:
    networks:
      - db-only  # No internet access at all

networks:
  web:
  db-only:
    internal: true
```

## DNS Configuration Per Network

Override DNS settings for specific networks or services:

```yaml
services:
  myapp:
    dns:
      - 192.168.1.53  # Local Pi-hole
      - 1.1.1.1       # Fallback

  isolated-app:
    dns:
      - 1.1.1.1  # Direct to Cloudflare, bypass local DNS
    networks:
      - isolated

networks:
  isolated:
    driver: bridge
    dns:
      - 1.1.1.1
```

## Network Troubleshooting

```bash
# List all networks
docker network ls

# Inspect a network (see subnets, connected containers)
docker network inspect mynetwork

# Check which networks a container is on
docker inspect mycontainer --format '{{json .NetworkSettings.Networks}}' | jq

# Test cross-network connectivity
docker exec container1 ping container2

# Test DNS resolution
docker exec container1 nslookup service-name

# Manually connect a running container to a network
docker network connect mynetwork mycontainer

# Disconnect from a network
docker network disconnect mynetwork mycontainer

# Remove unused networks
docker network prune
```

See [Docker Networking Issues](/foundations/docker-networking-issues/) for comprehensive troubleshooting.

## Common Patterns for Self-Hosting

### The Proxy Pattern (Recommended)

One external network for the reverse proxy. Each stack has its own internal network for databases.

```
[Internet] → [Reverse Proxy] → proxy-network → [App containers]
                                                       ↕
                                                 internal-net → [Database]
```

### The Shared Database Pattern

One PostgreSQL instance shared by multiple apps:

```yaml
# Shared DB stack
services:
  postgres:
    image: postgres:16.2
    networks:
      - db-network

networks:
  db-network:
    external: true
```

Each app connects to the shared database via the external network. This saves RAM but creates a single point of failure.

### The Fully Isolated Pattern

Each stack is completely independent. No shared networks. The reverse proxy reaches apps through published localhost ports.

```yaml
services:
  myapp:
    ports:
      - "127.0.0.1:8080:80"  # Only accessible from host
```

Simpler but requires managing port numbers and doesn't allow container-to-container discovery across stacks.

## FAQ

### How many Docker networks can I create?

Hundreds. Each bridge network uses a /24 subnet by default (254 usable IPs). Docker's default pool allows 31 networks. Increase this by configuring `default-address-pools` in daemon.json.

### Do external networks survive `docker compose down`?

Yes. External networks are not managed by Compose — they persist until you manually remove them with `docker network rm`.

### Can I rename a Docker network?

No. Create a new network with the desired name, update your Compose files, and remove the old network.

### Should I put all my containers on one big network?

No. Use separate networks for isolation. A compromised container on a shared network can potentially access every other container. Segment by trust level: public-facing services on one network, databases on another.

## Related

- [Docker Networking](/foundations/docker-networking/)
- [Docker Networking Issues](/foundations/docker-networking-issues/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Subnets and VLANs](/foundations/subnets-vlans/)
- [Docker Security](/foundations/docker-security/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)

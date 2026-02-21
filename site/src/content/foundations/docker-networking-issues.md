---
title: "Docker Networking Issues — Fixes"
description: "Solve Docker networking problems — containers can't communicate, DNS failures, port binding errors, bridge network issues, and IP conflicts."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "networking", "troubleshooting", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Docker Networking Issues

Docker networking connects containers to each other and to the outside world. When it breaks, containers can't talk to their databases, can't reach the internet, or can't be reached by users. This guide covers every networking issue you'll encounter when self-hosting.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Understanding of Docker networks ([Docker Networking](/foundations/docker-networking/))
- Basic networking knowledge ([Networking Concepts](/foundations/ports-explained/))

## Container Can't Reach the Internet

### Diagnose

```bash
# Test from inside the container
docker exec mycontainer ping -c 3 8.8.8.8          # IP connectivity
docker exec mycontainer ping -c 3 google.com        # DNS resolution
docker exec mycontainer curl -sI https://google.com  # Full HTTP
```

If `ping 8.8.8.8` works but `ping google.com` doesn't — it's a DNS issue (see below).

If `ping 8.8.8.8` also fails — it's a routing or firewall issue.

### Fix: IP Connectivity Broken

```bash
# Check if Docker networking is functioning
docker run --rm alpine ping -c 3 8.8.8.8

# If this also fails, restart Docker
sudo systemctl restart docker

# Check if IP forwarding is enabled (required for Docker)
sysctl net.ipv4.ip_forward
# Should be 1

# Enable if disabled
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
```

Check if iptables/nftables rules are blocking Docker:

```bash
# Check iptables rules
sudo iptables -L DOCKER -n
sudo iptables -L FORWARD -n

# If rules are missing, restart Docker to recreate them
sudo systemctl restart docker
```

### Fix: DNS Fails Inside Container

```bash
# Check what DNS server the container uses
docker exec mycontainer cat /etc/resolv.conf
```

If it shows `127.0.0.53` (systemd-resolved's stub resolver), containers can't use it because `127.0.0.53` inside the container points to the container itself.

```yaml
# Fix per-container
services:
  myapp:
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

```bash
# Fix globally for all containers
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
EOF
sudo systemctl restart docker
```

See [DNS Debugging](/foundations/dns-debugging/) for more DNS solutions.

## Container-to-Container Communication Fails

### Same Docker Compose File

Containers in the same Compose file automatically share a network and can reach each other by service name.

```yaml
services:
  app:
    image: myapp:v1.0
    environment:
      DB_HOST: db       # Use the service name
      REDIS_HOST: redis  # Use the service name
  db:
    image: postgres:16.2
  redis:
    image: redis:7.2
```

If it doesn't work:

```bash
# Verify they're on the same network
docker compose ps  # Note the project name
docker network ls  # Find projectname_default
docker network inspect projectname_default  # Both containers should be listed

# Test DNS resolution between containers
docker exec app nslookup db
docker exec app ping -c 3 db
```

Common mistakes:
- Using `localhost` or `127.0.0.1` instead of the service name
- Using the container name instead of the service name
- Using the host's IP address (works but fragile)

### Different Docker Compose Files

Containers in different Compose files are on different networks by default. Create a shared network:

```bash
# Create an external network
docker network create shared-net
```

```yaml
# docker-compose.yml for app A
services:
  app-a:
    networks:
      - shared-net

networks:
  shared-net:
    external: true
```

```yaml
# docker-compose.yml for app B
services:
  app-b:
    networks:
      - shared-net

networks:
  shared-net:
    external: true
```

Now `app-a` can reach `app-b` by service name within the shared network.

### Using `host` Network Mode

Containers with `network_mode: host` use the host's network stack directly. They can't use Docker's built-in DNS resolution.

```yaml
# With host networking, use localhost or the host's IP
services:
  app:
    network_mode: host
    environment:
      DB_HOST: 127.0.0.1   # Not the service name
      DB_PORT: 5432
  db:
    ports:
      - "5432:5432"  # Must expose port to host
```

Avoid `network_mode: host` unless you have a specific reason. Bridge networking (the default) is better for isolation and service discovery.

## Port Binding Issues

### "port is already allocated"

```
Bind for 0.0.0.0:80 failed: port is already allocated
```

```bash
# Find what's using the port
sudo ss -tlnp | grep :80

# If it's another container
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":80"

# Fix: change the host port
ports:
  - "8080:80"  # Map to a different host port
```

See [Port Already In Use](/foundations/port-already-in-use/) for detailed solutions.

### Port Accessible Locally But Not Remotely

```bash
# Check how the port is bound
docker ps --format "table {{.Names}}\t{{.Ports}}"

# 127.0.0.1:8080->8080/tcp  ← only localhost
# 0.0.0.0:8080->8080/tcp    ← all interfaces
```

```yaml
# WRONG — only accessible from localhost
ports:
  - "127.0.0.1:8080:8080"

# RIGHT — accessible from the network
ports:
  - "8080:8080"
```

Also check your firewall:

```bash
sudo ufw status
# If port isn't allowed:
sudo ufw allow 8080/tcp
```

See [Firewall Setup](/foundations/firewall-ufw/).

### Container Port vs Host Port Confusion

```yaml
ports:
  - "HOST_PORT:CONTAINER_PORT"
  - "9090:8080"  # Access via host:9090, container listens on 8080
```

- **Container port:** What the application listens on inside the container. Defined by the app, usually not changeable.
- **Host port:** What you use to access from outside. This is what you change if there's a conflict.

## Network Subnet Conflicts

Docker creates bridge networks using private IP ranges (172.17.0.0/16, 172.18.0.0/16, etc.). These can conflict with:
- Your LAN subnet
- VPN subnets
- Corporate network ranges

### Diagnose

```bash
# See all Docker networks and their subnets
docker network ls
docker network inspect bridge --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'

# Check for conflicts with your routes
ip route
```

### Fix: Change Docker's Default Subnet

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "default-address-pools": [
    {"base": "10.10.0.0/16", "size": 24}
  ]
}
EOF
sudo systemctl restart docker
```

### Fix: Specify Subnet Per Network

```yaml
networks:
  mynet:
    ipam:
      config:
        - subnet: 10.20.0.0/24
```

## Docker Network Exhaustion

After creating many networks (common when running many Compose stacks), Docker runs out of available subnets.

```
could not find an available, non-overlapping IPv4 address pool
```

```bash
# Check how many networks exist
docker network ls | wc -l

# Remove unused networks
docker network prune

# If you need many networks, increase the pool
# Edit daemon.json to use a larger address pool
```

## Firewall Interactions

### Docker Bypasses UFW

Docker manipulates iptables directly, which can bypass UFW rules. A published port is accessible from the internet even if UFW doesn't allow it.

```bash
# This does NOT protect published Docker ports
sudo ufw deny 8080
# The port is still accessible because Docker adds its own iptables rules
```

**Solutions:**

1. **Bind to localhost only and use a reverse proxy:**

```yaml
ports:
  - "127.0.0.1:8080:8080"  # Only accessible via reverse proxy
```

2. **Disable Docker's iptables management** (not recommended for beginners):

```bash
# /etc/docker/daemon.json
{
  "iptables": false
}
```

This requires you to manually manage all Docker networking rules.

3. **Use `docker-compose` `expose` instead of `ports`:**

```yaml
services:
  myapp:
    expose:
      - "8080"  # Only accessible from other containers on the same network
    # No ports: section = not accessible from host
```

See [Docker Security](/foundations/docker-security/) for more on securing Docker networking.

## macvlan and ipvlan Issues

For running containers with their own IP addresses on the LAN (e.g., Pi-hole):

```yaml
networks:
  lan:
    driver: macvlan
    driver_opts:
      parent: eth0  # Your physical interface
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.224/27  # Range for containers
```

Common issues:
- **Host can't reach macvlan containers:** This is by design. Create a macvlan shim interface on the host if needed.
- **Wrong parent interface:** Check your interface name with `ip link show`.
- **IP conflicts:** Ensure the `ip_range` doesn't overlap with your DHCP pool.

## Diagnostic Commands

```bash
# List all networks
docker network ls

# Inspect a network (see connected containers)
docker network inspect mynetwork

# Check container's network config
docker inspect mycontainer --format '{{json .NetworkSettings.Networks}}' | jq

# Test connectivity between containers
docker exec container1 ping -c 3 container2

# Check DNS resolution
docker exec mycontainer nslookup servicename

# Check listening ports inside container
docker exec mycontainer ss -tlnp

# Check iptables rules Docker created
sudo iptables -L DOCKER -n
sudo iptables -L DOCKER-USER -n

# Trace network path
docker exec mycontainer traceroute 8.8.8.8
```

## FAQ

### Can two containers on different Compose stacks communicate without an external network?

Not by service name. You'd need to use the container's IP address, which is unreliable (it changes on recreation). Create an external shared network instead.

### Why does `network_mode: host` break service discovery?

Host networking bypasses Docker's network namespace, including its built-in DNS server. Containers can't resolve other container names. They access everything via `localhost` and published ports.

### Docker keeps creating networks and I'm running out of subnet space. What do I do?

Run `docker network prune` regularly. Set a larger default address pool in daemon.json. Use shared external networks instead of per-stack networks where possible.

### My VPN stops working when I start Docker. Why?

Docker's default bridge subnet (172.17.0.0/16) likely conflicts with your VPN's subnet. Change Docker's default address pool to a non-conflicting range.

## Related

- [Docker Networking](/foundations/docker-networking/)
- [Docker Compose Networking Advanced](/foundations/docker-compose-networking-advanced/)
- [Docker Common Issues](/foundations/docker-common-issues/)
- [Docker Security](/foundations/docker-security/)
- [DNS Debugging](/foundations/dns-debugging/)
- [Port Already In Use](/foundations/port-already-in-use/)
- [Firewall Setup](/foundations/firewall-ufw/)

---
title: "IPv6 for Self-Hosting"
description: "Configure IPv6 on your self-hosting server, enable it in Docker, set up dual-stack networking, and secure it with ip6tables firewall rules."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "foundations"
apps: []
tags: ["foundations", "ipv6", "networking", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is IPv6?

IPv6 is the successor to IPv4. Where IPv4 gives you a single address like `192.168.1.50`, IPv6 gives you an absurdly large address space -- enough that every device on your network gets a globally unique, publicly routable address. For ipv6 self-hosting, this changes the game: no more NAT, no more port forwarding, no more fighting your ISP for a public IP.

An IPv6 address looks like this: `2001:db8:1234:5678::1`. It is 128 bits long compared to IPv4's 32 bits. Your ISP likely already assigns you an IPv6 prefix (a `/64` or `/56` block) even if you have never used it.

The practical upside for self-hosting: every container, every service, every device gets its own public address. The practical downside: you need to secure all of them, because there is no NAT hiding your services from the internet.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+) with [Docker installed](/foundations/docker-compose-basics)
- An ISP that provides IPv6 connectivity (most do -- check below)
- Basic understanding of [networking concepts](/foundations/ports-explained) and [DNS](/foundations/dns-explained)
- A [firewall](/foundations/firewall-ufw) configured on your server

## IPv6 vs IPv4 for Self-Hosting

| Aspect | IPv4 | IPv6 |
|--------|------|------|
| Address format | `192.168.1.50` | `2001:db8:1234:5678::1` |
| Address space | ~4.3 billion total | 3.4 x 10^38 total |
| NAT required | Yes (residential) | No |
| Port forwarding needed | Yes | No -- addresses are globally routable |
| ISP CGNAT risk | Common | Not applicable |
| Firewall complexity | NAT provides accidental security | Must explicitly firewall every service |
| Docker support | Native | Requires configuration |
| DNS record type | A record | AAAA record |

**The recommendation: run dual-stack.** Use both IPv4 and IPv6 simultaneously. IPv6 eliminates NAT and port forwarding headaches. IPv4 ensures compatibility with the roughly 40% of internet traffic that is still v4-only. Do not go IPv6-only unless you understand the compatibility trade-offs.

### Why IPv6 Matters for Self-Hosting

1. **No NAT, no port forwarding.** Your ISP gives you a public IPv6 prefix. Every device and container gets a globally routable address. No more [port forwarding](/foundations/port-forwarding) rules on your router.

2. **No CGNAT problems.** Many ISPs put residential customers behind CGNAT (Carrier-Grade NAT), making port forwarding impossible on IPv4. IPv6 bypasses this entirely because every address is public.

3. **Simpler multi-service setups.** Instead of mapping different ports for different services through NAT, each service has its own address. No port conflicts.

4. **Future-proof.** IPv4 address exhaustion is real. Major ISPs, cloud providers, and CDNs are prioritizing IPv6. Running dual-stack now means you are ready.

## Checking Your IPv6 Support

### On Your Server

```bash
# Check if the kernel supports IPv6
cat /proc/net/if_inet6
```

If this file exists and has content, the kernel has IPv6 enabled. If it is empty or missing, IPv6 is disabled at the kernel level.

```bash
# Check your IPv6 addresses
ip -6 addr show
```

Look for a `scope global` address (not `scope link`). A global address means your server has a publicly routable IPv6 address:

```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet6 2001:db8:1234:5678::1/64 scope global dynamic
    inet6 fe80::1/64 scope link
```

- `2001:db8:...` -- global unicast address (publicly routable)
- `fe80::...` -- link-local address (only valid on the local network segment, always present)

### Check External Connectivity

```bash
# Ping a known IPv6 host
ping -6 -c 4 2001:4860:4860::8888

# Or use a domain
ping -6 -c 4 google.com

# Check your public IPv6 address
curl -6 https://ifconfig.co
```

If `ping -6` works, your server has working IPv6 connectivity.

### On a VPS

Most VPS providers (Hetzner, DigitalOcean, Linode, Vultr) assign IPv6 addresses by default. Check your provider's control panel. Hetzner gives you a full `/64` prefix with every server.

### On a Home Network

```bash
# On any device, visit:
# https://test-ipv6.com
# or
# https://ipv6-test.com
```

If your ISP provides IPv6, you will see a score of 10/10 or a confirmed IPv6 address. Common ISPs with IPv6 support: Comcast, AT&T, T-Mobile, Spectrum, Deutsche Telekom, BT. Common ISPs without full IPv6: some smaller regional providers, some cable companies.

If your ISP does not provide IPv6, you can still use it locally between containers. You just cannot accept inbound IPv6 traffic from the internet.

## Configuring IPv6 on Your Server

### Verify Kernel Support

IPv6 is enabled by default on modern Linux kernels. Verify it is not disabled:

```bash
sysctl net.ipv6.conf.all.disable_ipv6
```

If the output is `0`, IPv6 is enabled. If `1`, re-enable it:

```bash
# Enable IPv6 immediately
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=0
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=0

# Make it persistent
echo "net.ipv6.conf.all.disable_ipv6 = 0" | sudo tee -a /etc/sysctl.d/99-ipv6.conf
echo "net.ipv6.conf.default.disable_ipv6 = 0" | sudo tee -a /etc/sysctl.d/99-ipv6.conf
sudo sysctl --system
```

### Static IPv6 on Netplan (Ubuntu 22.04+)

If your provider does not handle IPv6 automatically via SLAAC or DHCPv6, configure it manually. Edit `/etc/netplan/01-netcfg.yaml`:

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
      addresses:
        - "2001:db8:1234:5678::1/64"
      routes:
        - to: "::/0"
          via: "2001:db8:1234:5678::ffff"
      nameservers:
        addresses:
          - "2001:4860:4860::8888"
          - "2001:4860:4860::8844"
```

Apply the configuration:

```bash
sudo netplan apply
```

Replace the addresses with the actual IPv6 prefix and gateway your ISP or VPS provider assigned. Do not use the `2001:db8:` documentation prefix in production -- it is reserved for examples.

### Verify Connectivity After Configuration

```bash
# Check address assignment
ip -6 addr show eth0

# Test connectivity
ping -6 -c 4 2001:4860:4860::8888

# Check routing
ip -6 route show
```

## Docker and IPv6

Docker does not enable IPv6 by default. You must explicitly configure it.

### Enabling IPv6 in the Docker Daemon

Edit or create `/etc/docker/daemon.json`:

```json
{
  "ipv6": true,
  "fixed-cidr-v6": "fd00:dead:beef::/48",
  "ip6tables": true,
  "experimental": true
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

**What each setting does:**

| Setting | Purpose |
|---------|---------|
| `"ipv6": true` | Enables IPv6 on the default bridge network |
| `"fixed-cidr-v6"` | Subnet for container IPv6 addresses. Use a ULA (Unique Local Address) prefix like `fd00::/48` for internal traffic, or a slice of your public prefix for globally routable containers |
| `"ip6tables": true` | Lets Docker manage ip6tables rules (analogous to how it manages iptables for IPv4) |
| `"experimental": true` | Required for `ip6tables` support in Docker versions before 27.0 |

**Choosing a prefix for `fixed-cidr-v6`:**

- **`fd00:dead:beef::/48`** -- ULA (private). Containers get IPv6 addresses that are not routable on the internet. Use this if you only need IPv6 between containers or if you handle public IPv6 at the reverse proxy level. This is the safer default.
- **A subnet of your public prefix** -- if your ISP gives you `2001:db8:1234::/48`, you could assign `2001:db8:1234:d0cc::/64` to Docker. Containers get publicly routable addresses. Powerful, but you must firewall properly.

**Recommendation:** Start with ULA (`fd00::/48`). Use public prefixes only if you specifically need containers to be directly reachable via IPv6 from the internet.

### Verify Docker IPv6

```bash
# Check the default bridge network
docker network inspect bridge | grep -A 10 "IPAM"

# Run a test container
docker run --rm alpine:3.20 ip -6 addr show eth0

# Test IPv6 connectivity from inside a container
docker run --rm alpine:3.20 ping -6 -c 4 2001:4860:4860::8888
```

### Docker Compose with IPv6 Networks

Define an IPv6-enabled network in your Compose file:

```yaml
services:
  app:
    image: nginx:1.27
    networks:
      - v6net
    ports:
      - "80:80"
      - "[::]:80:80"  # Explicitly bind to IPv6
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: changeme
    networks:
      - v6net
    restart: unless-stopped

networks:
  v6net:
    enable_ipv6: true
    ipam:
      config:
        - subnet: "fd00:cafe:1::/64"
```

Key points:

- **`enable_ipv6: true`** on the network definition enables IPv6 for that network.
- **`subnet`** under IPAM defines the IPv6 range. Use a ULA prefix for internal networks.
- **`[::]:80:80`** in ports explicitly binds to all IPv6 interfaces. Without this, Docker only binds to IPv4 by default.
- Containers on the same `v6net` can reach each other via both IPv4 and IPv6 using service names.

### Dual-Stack Docker Network (IPv4 + IPv6)

For a network that supports both protocols:

```yaml
networks:
  dualstack:
    enable_ipv6: true
    ipam:
      config:
        - subnet: "172.28.0.0/16"        # IPv4
        - subnet: "fd00:cafe:2::/64"     # IPv6
```

Containers on this network get both an IPv4 and IPv6 address. This is the approach you should use for most self-hosted services.

### External IPv6 Network Across Compose Files

If you run multiple Compose stacks that share a reverse proxy network:

```bash
# Create a dual-stack external network
docker network create \
  --ipv6 \
  --subnet=172.29.0.0/16 \
  --subnet=fd00:cafe:proxy::/64 \
  proxy
```

Reference it in your Compose files:

```yaml
services:
  myapp:
    image: myapp:2.0
    networks:
      - proxy
      - backend
    restart: unless-stopped

networks:
  proxy:
    external: true
  backend:
    enable_ipv6: true
    ipam:
      config:
        - subnet: "fd00:cafe:app1::/64"
```

## Dual-Stack Configuration

Dual-stack means running IPv4 and IPv6 simultaneously. This is the correct approach for self-hosting because it maximizes compatibility.

### DNS: A and AAAA Records

Set up both record types for your domain:

```
Type: A
Name: cloud
Value: 203.0.113.50          # Your IPv4 address

Type: AAAA
Name: cloud
Value: 2001:db8:1234:5678::1  # Your IPv6 address
```

When a client connects, it uses whichever protocol it prefers (modern systems prefer IPv6 via the "Happy Eyeballs" algorithm). Clients without IPv6 fall back to IPv4.

### Reverse Proxy Dual-Stack

Your reverse proxy must listen on both IPv4 and IPv6. Most reverse proxies handle this automatically.

**Nginx Proxy Manager:** Listens on both protocols by default if your host has IPv6 addresses. No extra configuration needed.

**Caddy** (in `Caddyfile`):

```
cloud.yourdomain.com {
    reverse_proxy myapp:8080
}
```

Caddy binds to both IPv4 and IPv6 by default.

**Traefik:** Listens on dual-stack by default. Verify in your static configuration:

```yaml
entryPoints:
  web:
    address: ":80"       # Binds to both IPv4 and IPv6
  websecure:
    address: ":443"
```

### Application-Level Dual-Stack

Most self-hosted applications work on IPv6 without changes. They bind to `0.0.0.0` (IPv4 all interfaces) or `::` (IPv6 all interfaces) inside the container. Docker's network layer handles the translation.

If an application explicitly binds to `0.0.0.0` and does not support IPv6, you do not need to worry -- your reverse proxy sits in front and accepts IPv6 connections from clients, then connects to the app over the Docker network (which can be IPv4 internally).

## Firewall Rules for IPv6

This is the most critical part of IPv6 self-hosting. With IPv4, NAT accidentally hides your services. With IPv6, every address is publicly routable. If you do not firewall, every container with a public IPv6 address is exposed to the internet.

### UFW (Handles Both Protocols)

UFW manages both IPv4 and IPv6 rules automatically. Verify IPv6 is enabled in UFW:

```bash
grep IPV6 /etc/default/ufw
# Should show: IPV6=yes
```

If it shows `no`, edit the file:

```bash
sudo sed -i 's/IPV6=no/IPV6=yes/' /etc/default/ufw
sudo ufw reload
```

UFW rules apply to both protocols:

```bash
# These rules cover both IPv4 and IPv6
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Verify with:

```bash
sudo ufw status verbose
```

You should see rules for both `Anywhere` and `Anywhere (v6)`.

### ip6tables (Direct Rules)

For more granular control, or if you do not use UFW, manage ip6tables directly:

```bash
# Default policies: drop incoming, allow outgoing
sudo ip6tables -P INPUT DROP
sudo ip6tables -P FORWARD DROP
sudo ip6tables -P OUTPUT ACCEPT

# Allow loopback
sudo ip6tables -A INPUT -i lo -j ACCEPT

# Allow established/related connections
sudo ip6tables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow ICMPv6 (REQUIRED — do not block this)
sudo ip6tables -A INPUT -p icmpv6 -j ACCEPT

# Allow SSH
sudo ip6tables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo ip6tables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo ip6tables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow DHCPv6 client (if using DHCPv6)
sudo ip6tables -A INPUT -p udp --dport 546 -j ACCEPT
```

**Critical: never block ICMPv6.** Unlike IPv4 where blocking ICMP is a minor inconvenience, blocking ICMPv6 breaks IPv6 entirely. Neighbor Discovery Protocol (NDP), Path MTU Discovery, and Stateless Address Autoconfiguration (SLAAC) all rely on ICMPv6. Always allow it.

### Make ip6tables Rules Persistent

```bash
# Install persistence package
sudo apt install iptables-persistent -y

# Save current rules
sudo ip6tables-save | sudo tee /etc/iptables/rules.v6

# Rules are automatically restored on boot
```

### Docker and ip6tables

When you set `"ip6tables": true` in `daemon.json`, Docker manages ip6tables rules for container port mappings -- the same way it manages iptables for IPv4. This means the same Docker-bypasses-UFW problem exists for IPv6.

The same solutions apply:

1. **Bind to localhost:** `"[::1]:8080:80"` for IPv6 localhost only
2. **Use Docker networks without port exposure** (recommended)
3. **Use ULA prefixes** so containers are not publicly routable

## Common Mistakes

### Blocking ICMPv6

IPv6 depends on ICMPv6 for basic functionality: neighbor discovery, router advertisements, path MTU discovery. Blocking it is like blocking ARP on IPv4 -- everything breaks. Always allow ICMPv6 in your firewall rules.

### Forgetting to Firewall Public IPv6 Addresses

With IPv4, NAT hides your services by default. With IPv6, every address is potentially public. If you assign containers public IPv6 addresses and do not firewall them, they are exposed to the internet. Use ULA prefixes for containers and let your reverse proxy handle public-facing traffic.

### Using Only IPv6

Going IPv6-only breaks access for the ~40% of internet traffic still on IPv4. Always run dual-stack unless you have a specific reason not to.

### Not Enabling IPv6 in Docker

Docker ignores IPv6 by default. Containers will not get IPv6 addresses unless you configure `daemon.json` and set `enable_ipv6: true` on your Docker networks. Do not assume it works just because the host has IPv6.

### Hardcoding IPv4 Addresses in Application Configs

If your application config has `DB_HOST=172.18.0.2`, it breaks on IPv6 networks. Use Docker service names (`DB_HOST=db`) -- Docker DNS resolves to the correct address regardless of protocol.

### Forgetting AAAA DNS Records

Setting up IPv6 on your server without adding AAAA DNS records means no one reaches you via IPv6. Add both A and AAAA records for every domain pointing to your server.

## Next Steps

- Configure [Docker networking](/foundations/docker-networking) to segment your containers securely
- Set up a [reverse proxy](/foundations/reverse-proxy-explained) to handle dual-stack traffic
- Harden your server with a [firewall](/foundations/firewall-ufw)
- Understand [DNS](/foundations/dns-explained) to configure A and AAAA records correctly
- Set up [port forwarding](/foundations/port-forwarding) for IPv4 (unnecessary for IPv6, but needed for v4 compatibility)

## Related

- [Docker Networking for Self-Hosting](/foundations/docker-networking)
- [Network Ports Explained](/foundations/ports-explained)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [DNS Explained](/foundations/dns-explained)
- [Home Network Setup](/foundations/home-network-setup)
- [Port Forwarding for Self-Hosting](/foundations/port-forwarding)
- [Getting Started with Self-Hosting](/foundations/getting-started)

## FAQ

### Do I need IPv6 for self-hosting?

No, but you should use it. IPv6 eliminates NAT and port forwarding, solves CGNAT problems, and is increasingly preferred by modern clients. Run dual-stack (both IPv4 and IPv6) for maximum compatibility and fewer networking headaches.

### Will my self-hosted apps work on IPv6 without changes?

Most apps work without modification. They bind to all interfaces inside the container, and Docker handles the networking layer. The main work is enabling IPv6 in Docker (via `daemon.json`), creating IPv6-enabled networks, and configuring your firewall.

### Is IPv6 less secure than IPv4?

No, but it requires a different security mindset. IPv4's NAT gives you accidental security by hiding services behind a single public IP. IPv6 makes every address public, so you must explicitly firewall everything. The protocol itself is not less secure -- the risk is misconfiguration.

### My ISP does not provide IPv6. Can I still use it?

You can use IPv6 internally between containers on your server (using ULA addresses like `fd00::/48`). You just cannot accept inbound IPv6 traffic from the internet. For external access, you fall back to IPv4 with port forwarding or use a tunnel broker like Hurricane Electric (he.net) for IPv6 connectivity.

### How do I test if my self-hosted service is reachable over IPv6?

Use `curl -6 https://yourservice.yourdomain.com` from a machine with IPv6 connectivity, or use an online tool like `https://ipv6-test.com/validate.php` to check if your domain resolves and responds over IPv6. Verify your AAAA DNS record exists with `dig AAAA yourservice.yourdomain.com`.

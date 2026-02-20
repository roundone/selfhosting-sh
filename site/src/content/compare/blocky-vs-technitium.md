---
title: "Blocky vs Technitium: Which DNS Server?"
description: "Blocky vs Technitium DNS compared — config-as-code vs web UI, features, resource usage, and which self-hosted DNS solution fits your setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ad-blocking"
apps:
  - blocky
  - technitium
tags:
  - comparison
  - blocky
  - technitium
  - dns
  - ad-blocking
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Blocky is the better choice if you want a lightweight, config-file-driven DNS proxy for ad blocking in infrastructure-as-code setups. Technitium is better if you need a full DNS server with a web UI, zone hosting, DHCP, and advanced DNS features. They're fundamentally different tools — Blocky is a DNS proxy, Technitium is a DNS server.

## Overview

**Blocky** is a DNS proxy and ad blocker written in Go. It's configured entirely via a YAML file with no web UI. It sits between your network and upstream DNS resolvers, caching responses and blocking unwanted domains. It's built from a `scratch` Docker image (no OS, no shell), runs as UID 100, and uses about 30 MB of RAM. It's ideal for declarative, version-controlled infrastructure.

**Technitium DNS Server** is a comprehensive authoritative and recursive DNS server with a full web UI. It can host zones, handle DNSSEC, serve DHCP, cluster for HA, and block ads — all from a browser-based admin panel. It's built on .NET 9 and targets users who need real DNS server functionality.

## Feature Comparison

| Feature | Blocky | Technitium |
|---------|--------|------------|
| Type | DNS proxy | Full DNS server |
| Configuration | YAML file only | Web UI (after first boot) |
| Web UI | None (API + Prometheus metrics) | Comprehensive |
| Ad blocking | Core feature (filter lists) | Plugin-based ("Advanced Blocking" app) |
| DNS-over-HTTPS | Yes (client and server) | Yes |
| DNS-over-TLS | Yes | Yes |
| DNS-over-QUIC | No | Yes |
| Authoritative DNS | No | Yes |
| Zone hosting | No | Yes |
| Split-horizon DNS | No | Yes |
| DHCP | No | Yes |
| Clustering | Via Redis (sync blocklists/cache) | Built-in (v14+) |
| DNSSEC validation | Yes (v0.28+) | Yes |
| Conditional forwarding | Yes | Yes |
| Client-specific rules | Yes (per-client groups in YAML) | Yes (via web UI) |
| Prometheus metrics | Built-in | Built-in |
| Persistent storage | None needed (stateless) | Yes (`/etc/dns`) |
| Runtime | Go (scratch image) | .NET 9 |
| Docker image | `spx01/blocky:v0.28.2` | `technitium/dns-server:14.3.0` |
| License | Apache-2.0 | GPL-3.0 |

## Installation Complexity

**Blocky** requires writing a YAML config file before it starts. There's no setup wizard. You define upstream DNS servers, blocklists, client groups, and cache settings in `config.yml`, mount it into the container, and start. The upside: your entire DNS config is a single file you can version control.

**Technitium** starts with minimal configuration via environment variables on first boot. After that, everything is managed through the web UI. You click through settings rather than editing files. The UI has a learning curve due to the number of features.

## Performance and Resource Usage

| Metric | Blocky | Technitium |
|--------|--------|------------|
| RAM (idle) | ~30 MB | ~150 MB |
| RAM (with blocklists) | ~60 MB | ~250 MB |
| CPU | Very low | Low-Medium |
| Disk | 0 (stateless) | ~200 MB |
| Startup time | <2 seconds | ~10 seconds |
| Docker image size | ~15 MB (scratch) | ~200 MB (.NET runtime) |

Blocky is 5x lighter than Technitium. It's stateless — no persistent volumes needed. Technitium stores all configuration, zones, and logs in `/etc/dns`.

## Community and Support

**Blocky** has 5,200+ GitHub stars and active development. Releases are regular (v0.28.2 November 2025). The maintainer is responsive. Documentation is good, with clear YAML config reference and examples.

**Technitium** has 5,000+ GitHub stars and is developed by a solo developer. Regular releases, good documentation, and responsive community support. No GitHub Releases (versions tracked via Docker Hub and blog).

## Use Cases

### Choose Blocky If...

- You want DNS config as code (YAML file, version-controlled)
- You're running in a Docker/Kubernetes environment with infrastructure-as-code practices
- You want the lightest possible DNS ad blocker
- You don't need a web UI for day-to-day management
- You want to integrate with Prometheus/Grafana for monitoring
- You value simplicity — DNS proxy with blocking, nothing more

### Choose Technitium If...

- You need authoritative DNS (host your own zones)
- You want a web UI for configuration and monitoring
- You need a DHCP server alongside DNS
- You want DNS-over-QUIC support
- You're managing a more complex network
- You need DNS clustering for high availability
- You want point-and-click configuration vs. editing YAML files

## Final Verdict

These tools complement different workflows rather than competing directly. Blocky is the minimalist's choice — a single YAML file, stateless operation, minimal resources. Technitium is the power user's choice — every DNS feature you could want in a web UI. Pick Blocky for a Kubernetes homelab or any setup where config-as-code matters. Pick Technitium when you need real DNS server features beyond proxying and blocking.

If your primary need is just ad blocking with a web UI, skip both and use [AdGuard Home](/apps/adguard-home) or [Pi-hole](/apps/pi-hole) instead.

## FAQ

### Can I migrate from Blocky to Technitium or vice versa?

There's no migration path. Blocky uses a YAML config file and Technitium stores settings in its internal database. You'd need to manually recreate your configuration. Blocklists (URL format) are compatible between both.

### Which is better for Kubernetes?

Blocky. It's stateless, configured via a single file (perfect for ConfigMaps), lightweight, and built specifically for cloud-native environments. Technitium's stateful nature and web UI-centric configuration are a worse fit for Kubernetes.

### Can I use Blocky with Grafana?

Yes. Blocky exposes Prometheus metrics on port 4000 by default. Add it as a Prometheus scrape target and import the community Grafana dashboard. See our [Grafana guide](/apps/grafana) and [Prometheus guide](/apps/prometheus).

## Related

- [How to Self-Host Blocky](/apps/blocky)
- [How to Self-Host Technitium](/apps/technitium)
- [Pi-hole vs Blocky](/compare/pi-hole-vs-blocky)
- [AdGuard Home vs Blocky](/compare/adguard-home-vs-blocky)
- [Pi-hole vs Technitium](/compare/pi-hole-vs-technitium)
- [AdGuard Home vs Technitium](/compare/adguard-home-vs-technitium)
- [Best Self-Hosted Ad Blockers](/best/ad-blocking)

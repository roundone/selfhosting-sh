---
title: "Unbound vs CoreDNS: Which DNS Resolver?"
description: "Unbound vs CoreDNS compared for self-hosted DNS resolution. Recursive resolving, caching, performance, and which to choose for your setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ad-blocking"
apps:
  - unbound
  - coredns
tags:
  - comparison
  - unbound
  - coredns
  - self-hosted
  - dns
  - networking
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Unbound is the better choice for a self-hosted recursive DNS resolver. It's purpose-built for recursive resolution, validates DNSSEC by default, and has a 20+ year track record of security and reliability. CoreDNS is better suited as a forwarding DNS server or service discovery tool (especially in Kubernetes). For privacy-focused DNS resolution at home, use Unbound. For infrastructure DNS, use CoreDNS.

## Overview

**Unbound** is a recursive DNS resolver developed by NLnet Labs. It resolves queries by querying authoritative nameservers directly — no middleman DNS provider needed. Written in C, it's designed for security, privacy, and DNSSEC validation. [Unbound site](https://nlnetlabs.nl/projects/unbound/)

**CoreDNS** is a DNS server written in Go. It's plugin-based and extremely flexible — it can forward queries, serve zones, integrate with Kubernetes, and more. It's the default DNS server in Kubernetes clusters. [CoreDNS site](https://coredns.io/)

## Feature Comparison

| Feature | Unbound | CoreDNS |
|---------|---------|---------|
| Recursive resolution | Yes (primary purpose) | Via plugin (limited) |
| DNS forwarding | Yes | Yes (primary mode) |
| DNSSEC validation | Yes (default) | Plugin-based |
| DNS-over-TLS (DoT) | Yes | Yes |
| DNS-over-HTTPS (DoH) | Yes | Plugin |
| Query caching | Yes (aggressive) | Yes |
| Local zone serving | Yes (basic) | Yes (full authoritative) |
| Kubernetes integration | No | Yes (native) |
| Plugin architecture | No (monolithic) | Yes (everything is a plugin) |
| Configuration | unbound.conf (key-value) | Corefile (block-based DSL) |
| Ad blocking | Via local-zone entries | Via hosts plugin |
| Logging | Query logging | Query logging + metrics |
| Prometheus metrics | External tool needed | Built-in plugin |
| Docker image | `mvance/unbound` (community) | `coredns/coredns` (official) |
| Written in | C | Go |
| License | BSD-3 | Apache-2.0 |
| Maturity | 20+ years | 8+ years |

## Installation Complexity

**Unbound** is moderately complex to configure. The `unbound.conf` file needs root hints (list of DNS root servers), access control rules, and optimization settings. The learning curve is steeper but the result is a fully recursive resolver with no upstream dependency.

**CoreDNS** is simpler to get started with, especially as a forwarding server. A minimal Corefile is 3 lines. The plugin model adds complexity as your needs grow, but basic setups are straightforward.

## Performance and Resource Usage

| Metric | Unbound | CoreDNS |
|--------|---------|---------|
| RAM (idle) | ~20-50 MB | ~15-30 MB |
| RAM (active cache) | ~50-200 MB | ~30-100 MB |
| CPU | Very low | Very low |
| First-query latency | Higher (recursive) | Lower (forwarding) |
| Cached query latency | ~1 ms | ~1 ms |
| Cache efficiency | Excellent (prefetch, serve-stale) | Good |

Unbound's recursive resolution means first-time queries take longer (50-200ms) because it walks the DNS hierarchy from root servers. Cached queries are instant. CoreDNS forwarding is faster on first query (forwards to an upstream like 1.1.1.1) but relies on a third party.

## Community and Support

**Unbound** has a mature community backed by NLnet Labs (Dutch non-profit). Documentation is comprehensive. Used by major ISPs and security-conscious organizations. Updates focus on security and DNSSEC compliance.

**CoreDNS** has a large community, especially in the Kubernetes ecosystem. Graduated CNCF project. Documentation is good but plugin-specific. Active development with frequent releases.

## Use Cases

### Choose Unbound If...

- You want full DNS privacy (no queries sent to third-party resolvers)
- DNSSEC validation is important to you
- You're running Pi-hole or AdGuard Home and want a local recursive resolver upstream
- You want a proven, security-audited DNS resolver
- You're building a privacy-focused home network

### Choose CoreDNS If...

- You run Kubernetes and need cluster DNS
- You want a flexible DNS server that can forward, cache, and serve zones
- You need Prometheus metrics integration
- You're building service discovery infrastructure
- You want quick setup with forwarding to upstream resolvers

## Common Pattern: Pi-hole + Unbound

The most popular self-hosted DNS setup is Pi-hole for ad blocking with Unbound as the upstream recursive resolver:

```
Client → Pi-hole (ad blocking) → Unbound (recursive resolution) → Root servers
```

This eliminates dependence on Google DNS, Cloudflare, or any other third-party resolver. Your DNS queries never leave your network until they reach authoritative nameservers.

## Final Verdict

**Unbound for DNS privacy and recursive resolution.** If you want your DNS queries to stay private and not depend on upstream providers, Unbound is the standard answer. It's what security researchers and privacy advocates recommend.

**CoreDNS for infrastructure and Kubernetes.** If you need DNS for container orchestration, service discovery, or a flexible forwarding/caching setup, CoreDNS is the right tool.

They're not direct competitors for most use cases — they solve different problems. The overlap is in basic DNS forwarding, where either works.

## FAQ

### Can I use Unbound without Pi-hole?

Yes. Unbound works standalone as your network's DNS resolver. Pi-hole adds ad blocking on top — it's a common pairing but not required.

### Does CoreDNS support recursive resolution?

Technically yes via the `unbound` plugin, but it's not CoreDNS's strength. If you want recursive resolution, use Unbound directly.

### Which is better for DNS-over-HTTPS?

Both support it, but Unbound's implementation is more mature. CoreDNS requires the `dns64`, `forward`, and TLS plugins configured together.

### Can I run both?

Yes. Some setups use CoreDNS as the client-facing DNS server (for metrics and flexibility) with Unbound as the upstream recursive resolver.

## Related

- [Pi-hole vs AdGuard Home](/compare/pi-hole-vs-adguard-home/)
- [How to Self-Host Pi-hole](/apps/pi-hole/)
- [How to Self-Host AdGuard Home](/apps/adguard-home/)
- [Technitium vs Unbound](/compare/technitium-vs-unbound/)
- [Blocky vs Pi-hole](/compare/blocky-vs-pihole/)
- [Best Self-Hosted DNS](/best/dns-networking/)

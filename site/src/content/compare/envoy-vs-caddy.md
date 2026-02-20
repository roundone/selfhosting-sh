---
title: "Envoy vs Caddy: Which Proxy to Self-Host?"
description: "Envoy vs Caddy compared for self-hosting. Automatic HTTPS, gRPC support, configuration complexity, and which reverse proxy fits your homelab."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - envoy
  - caddy
tags:
  - comparison
  - envoy
  - caddy
  - reverse-proxy
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Caddy wins for self-hosting by a landslide. Automatic HTTPS with zero configuration, a two-line Caddyfile per service, and 20-40 MB of RAM make it the simplest reverse proxy available. Envoy is far more powerful — native gRPC, advanced load balancing, built-in observability — but its configuration complexity is unjustifiable for typical homelabs. Use Envoy only when you have specific infrastructure requirements Caddy cannot meet.

## Overview

These proxies sit at opposite ends of the complexity spectrum. Caddy optimizes for simplicity — automatic everything, minimal config. Envoy optimizes for control — explicit everything, maximum observability.

**[Caddy](https://caddyserver.com/)** (v2.10.2) is a modern web server and reverse proxy with automatic HTTPS built in. Point it at a domain and it handles TLS certificates, HTTP/2, HTTP/3, and OCSP stapling without any SSL-related configuration. The Caddyfile format is the simplest config language of any proxy.

**[Envoy](https://www.envoyproxy.io/)** (v1.37.0) is a CNCF graduated cloud-native proxy built at Lyft. It provides L3/L4/L7 traffic management with first-class gRPC support, circuit breaking, distributed tracing, and Prometheus metrics. It powers Istio, AWS App Mesh, and Google Cloud's traffic infrastructure.

## Feature Comparison

| Feature | Envoy | Caddy |
|---------|-------|-------|
| Automatic HTTPS | No | Yes (zero config) |
| HTTP/2 | Yes | Yes |
| HTTP/3 (QUIC) | Yes | Yes |
| Static file serving | No | Yes (native) |
| gRPC proxying | Native (first-class) | Basic (pass-through) |
| gRPC-JSON transcoding | Yes | No |
| Load balancing | 5+ algorithms | Round Robin, IP Hash, etc. |
| Circuit breaking | Yes (detailed) | No |
| Automatic retries | Yes | No |
| Rate limiting | Yes (local + global) | Via plugin |
| Caching | No | Via plugin |
| Prometheus metrics | Built-in (detailed) | Via plugin |
| Distributed tracing | Built-in | No |
| Config format | YAML (verbose, typed) | Caddyfile (2 lines per service) |
| Config complexity | High | Very low |
| Plugin ecosystem | Filters + WASM | Go modules |
| Docker auto-discovery | No | Via plugin (caddy-docker-proxy) |
| Kubernetes support | Yes (Istio, native) | Via Ingress Controller |
| TCP/UDP proxying | Yes (native) | Via plugin |
| WebSocket | Yes | Yes |
| Reverse proxy | Yes | Yes |
| Web server | No | Yes |
| License | Apache 2.0 | Apache 2.0 |

## Installation Complexity

**Caddy:** One container, one Caddyfile. Adding a new proxied service:

```
app.example.com {
    reverse_proxy app-container:8080
}
```

That is the entire configuration. Caddy obtains and renews the SSL certificate automatically.

**Envoy:** One container, one YAML config. Adding a new proxied service requires defining a listener, filter chain, HTTP connection manager, route config, virtual host, route, and cluster — minimum 30 lines with fully-qualified `typed_config` annotations.

Winner: **Caddy.** It is not close. Caddy's configuration is 2 lines vs Envoy's 30+.

## Performance and Resource Usage

| Metric | Envoy | Caddy |
|--------|-------|-------|
| Idle RAM | 50-100 MB | 20-40 MB |
| Under load RAM | 200-500 MB | 50-100 MB |
| Written in | C++ | Go |
| Static file throughput | N/A | Very fast |
| Proxy throughput | Very high | High |

Caddy is lighter at idle and under typical homelab load. Envoy has higher peak throughput under extreme concurrency, but no homelab will reach that threshold.

Winner: **Caddy** for resource efficiency. Both are more than fast enough.

## Community and Support

| Metric | Envoy | Caddy |
|--------|-------|-------|
| GitHub stars | 26K+ | 61K+ |
| First release | 2016 | 2015 |
| Backed by | CNCF | Individual + sponsors |
| Documentation | Comprehensive (infra-focused) | Excellent (user-focused) |
| Self-hosting guides | Few | Many |

Caddy's documentation is exceptional — clear, well-organized, and written for people actually using the tool. Envoy's docs are thorough but target infrastructure engineers building service meshes.

Winner: **Caddy** for self-hosting documentation and community guides.

## Use Cases

### Choose Envoy If...
- You run gRPC services needing native proxying and JSON transcoding
- Circuit breaking with configurable thresholds is a requirement
- Built-in Prometheus metrics and distributed tracing matter
- You are integrating with Istio or a service mesh
- Dynamic configuration via xDS APIs is needed
- You have infrastructure engineering experience and specific needs

### Choose Caddy If...
- You want the simplest possible reverse proxy setup
- Automatic HTTPS with zero configuration is appealing
- You serve static sites alongside proxied services
- You prefer minimal, readable configuration
- You want the lightest resource usage
- You run a typical homelab with HTTP/HTTPS services
- You value a clean, well-documented tool

## Final Verdict

**Caddy wins for self-hosting.** For a typical homelab, Caddy does everything you need in two lines of config with automatic HTTPS. There is no reason to use Envoy's 30-line YAML configuration, manual certificate management, and steep learning curve for HTTP/HTTPS reverse proxying.

**Envoy wins for specialized infrastructure.** gRPC-native proxying, Maglev load balancing, circuit breaking, and built-in observability are capabilities Caddy does not offer. But these are capabilities most self-hosters do not need.

The recommendation is simple: use [Caddy](/apps/caddy). If you find yourself needing something Caddy cannot do, that is when you evaluate [Envoy](/apps/envoy), [Traefik](/apps/traefik), or [HAProxy](/apps/haproxy).

## FAQ

### Can Caddy handle gRPC like Envoy?
Caddy can proxy gRPC traffic, but as a basic pass-through. It does not understand gRPC at the protocol level — no transcoding, no per-method routing. If gRPC is central to your setup, Envoy is the better choice.

### Is Envoy faster than Caddy?
Under extreme load (thousands of concurrent connections), yes. For a homelab with a handful of users, performance is identical. Your internet connection is the bottleneck, not the proxy.

### Can I start with Caddy and switch to Envoy later?
Yes. Both use config files that are independent of each other. Switch your port mappings and deploy. Your backend services do not change.

## Related

- [How to Self-Host Envoy with Docker](/apps/envoy)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [Traefik vs Caddy](/compare/traefik-vs-caddy)
- [Caddy vs Nginx](/compare/caddy-vs-nginx)
- [Envoy vs Traefik](/compare/envoy-vs-traefik)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [Docker Compose Basics](/foundations/docker-compose-basics)

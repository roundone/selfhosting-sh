---
title: "Envoy vs Nginx: Which Proxy to Self-Host?"
description: "Envoy vs Nginx compared for self-hosting. Performance, gRPC support, configuration, observability, and which proxy fits your infrastructure needs."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - envoy
  - nginx
tags:
  - comparison
  - envoy
  - nginx
  - reverse-proxy
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Nginx is the better choice for self-hosters. It is lighter, simpler to configure, handles static files natively, and has the largest ecosystem of any web server. Choose Envoy if you specifically need native gRPC proxying, advanced load balancing algorithms, or built-in distributed tracing — otherwise Nginx covers everything you need with less complexity.

## Overview

Both are high-performance C/C++ and Go-based proxies used at internet scale, but they come from different eras and design philosophies.

**[Nginx](https://nginx.org/)** (v1.28.2) has been the most widely deployed web server since 2004. It handles reverse proxying, static file serving, caching, rate limiting, and load balancing. Its event-driven architecture and mature ecosystem make it the default choice for web infrastructure.

**[Envoy](https://www.envoyproxy.io/)** (v1.37.0) is a cloud-native proxy built in 2016 for modern microservice architectures. It provides L3/L4/L7 proxying with gRPC-native support, circuit breaking, automatic retries, and built-in observability via Prometheus and distributed tracing.

## Feature Comparison

| Feature | Envoy | Nginx |
|---------|-------|-------|
| Static file serving | No | Yes (native, excellent) |
| HTTP/2 | Native | Yes |
| HTTP/3 (QUIC) | Yes | Experimental (via module) |
| gRPC proxying | Native (first-class) | Basic (pass-through) |
| gRPC-JSON transcoding | Yes | No |
| Caching | No | Yes (built-in, powerful) |
| Rate limiting | Yes (local + global) | Yes (built-in, flexible) |
| Load balancing | 5+ algorithms | Upstream module (3-4 methods) |
| Circuit breaking | Yes (detailed) | No |
| Automatic retries | Yes | No (manual via proxy_next_upstream) |
| Health checks | HTTP, TCP, gRPC | Basic (upstream checks in Plus) |
| Prometheus metrics | Built-in (detailed) | Via stub_status + exporter |
| Distributed tracing | Built-in (Zipkin, Jaeger, OTEL) | Via module (OpenTelemetry) |
| Automatic HTTPS | No | No (use Certbot) |
| Config format | YAML (verbose) | nginx.conf (custom DSL) |
| Dynamic config | xDS APIs | Reload (SIGHUP) |
| Lua scripting | No | Yes (via OpenResty/njs) |
| TCP/UDP proxying | Yes | Yes (stream module) |
| WebSocket | Yes | Yes (manual config) |
| CGI/FastCGI | No | Yes |
| Config complexity | High | Medium |
| Written in | C++ | C |
| License | Apache 2.0 | BSD 2-Clause |

## Installation Complexity

**Nginx:** One container, one config file (`nginx.conf`). The config syntax is custom but well-documented with 20 years of community examples. Basic proxy setup takes 10-20 minutes.

**Envoy:** One container, one config file (`envoy.yaml`). The YAML uses fully-qualified type annotations and nested filter chains. A simple proxy requires 30+ lines vs Nginx's 10-15 lines for equivalent functionality.

Winner: **Nginx.** Simpler config, more examples available.

## Performance and Resource Usage

| Metric | Envoy | Nginx |
|--------|-------|-------|
| Idle RAM | 50-100 MB | 10-30 MB |
| Under load RAM | 200-500 MB | 30-100 MB |
| Static file serving | Not supported | Extremely fast |
| Reverse proxy throughput | Very high | Very high |
| Connection handling | Multi-threaded | Event-driven (epoll/kqueue) |

Nginx is lighter and faster for HTTP reverse proxying and static file serving. Its event-driven architecture and C implementation give it the lowest memory footprint of any major proxy. Envoy uses more memory for its observability subsystems, connection pools, and stats tracking.

Winner: **Nginx** for resource efficiency. Comparable for raw throughput.

## Community and Support

| Metric | Envoy | Nginx |
|--------|-------|-------|
| GitHub stars | 26K+ | 25K+ |
| First release | 2016 | 2004 |
| Market share | Growing (cloud-native) | 34% of all web servers |
| Backed by | CNCF | F5 Networks |
| Documentation | Comprehensive (infra-focused) | Extensive (20 years) |
| Self-hosting guides | Few | Countless |
| Enterprise version | No | Nginx Plus |

Nginx has 20 years of community knowledge. Any configuration question has been answered in hundreds of blog posts, Stack Overflow threads, and tutorials.

Winner: **Nginx** for community. Both are well-documented.

## Use Cases

### Choose Envoy If...
- You run gRPC services and need native proxying with JSON transcoding
- Built-in Prometheus metrics and distributed tracing are requirements
- Circuit breaking and automatic retries are needed for resilience
- You are integrating with Istio or a service mesh
- Dynamic configuration via xDS APIs is required
- Advanced load balancing (Maglev, ring hash) matters

### Choose Nginx If...
- You need static file serving alongside reverse proxying
- Caching for upstream responses is important
- You want the lightest resource usage
- Lua scripting for custom logic is needed (via njs or OpenResty)
- FastCGI for PHP applications matters
- You want the largest community and most documentation
- Simple, well-understood configuration is preferred

## Final Verdict

**Nginx wins for self-hosting.** It does everything a self-hoster needs — reverse proxying, static files, caching, rate limiting, SSL — with the lowest resource usage and the largest community. If you need automatic HTTPS, pair it with Certbot or use [Caddy](/apps/caddy) instead.

**Envoy wins for cloud-native infrastructure.** If you are running microservices with gRPC, need built-in observability, or are integrating with a service mesh, Envoy is the modern standard. It solves problems Nginx was not designed for.

For a typical self-hosting setup: use [Nginx](/apps/nginx) (or [Caddy](/apps/caddy) for simpler HTTPS). Envoy is the right choice only when you have specific requirements that justify its complexity.

## FAQ

### Can Envoy serve static files?
No. Envoy is a proxy, not a web server. It does not serve files from disk. Use Nginx, Caddy, or a dedicated static file server if you need to serve websites.

### Which is better for WordPress hosting?
Nginx, without question. It supports FastCGI for PHP, serves static assets natively, and has built-in caching optimized for WordPress. Envoy has no PHP support and cannot serve static files.

### Does Nginx support gRPC?
Nginx can proxy gRPC traffic, but as a pass-through. It does not understand the gRPC protocol natively — no transcoding, no per-method routing, no gRPC health checks. Envoy understands gRPC at the protocol level.

## Related

- [How to Self-Host Envoy with Docker](/apps/envoy)
- [How to Self-Host Nginx with Docker](/apps/nginx)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [Caddy vs Nginx](/compare/caddy-vs-nginx)
- [Envoy vs Traefik](/compare/envoy-vs-traefik)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [Docker Compose Basics](/foundations/docker-compose-basics)

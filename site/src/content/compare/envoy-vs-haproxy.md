---
title: "Envoy vs HAProxy: Which Proxy to Self-Host?"
description: "Envoy vs HAProxy compared for self-hosting. Load balancing, TCP proxying, observability, configuration, and which production-grade proxy to choose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - envoy
  - haproxy
tags:
  - comparison
  - envoy
  - haproxy
  - reverse-proxy
  - load-balancing
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

HAProxy is the better choice for most self-hosters who need a production-grade load balancer. It has simpler configuration, lower resource usage, and decades of proven reliability. Choose Envoy if you need gRPC proxying, service mesh integration, or advanced observability with Prometheus metrics and distributed tracing.

## Overview

Both are production-grade L4/L7 proxies used by the largest companies on the internet. HAProxy serves GitHub, Reddit, and Stack Overflow. Envoy powers Google Cloud, Lyft, and is the default proxy for Istio service meshes. Neither was designed for homelab use — both target infrastructure engineers running high-traffic production systems.

**[HAProxy](https://www.haproxy.org/)** (v3.3.3) has been the industry-standard load balancer since 2001. Its configuration language is purpose-built and well-documented. It excels at TCP load balancing, health checks, and high-availability setups.

**[Envoy](https://www.envoyproxy.io/)** (v1.37.0) is a modern, cloud-native proxy with first-class gRPC support, built-in Prometheus metrics, distributed tracing, and dynamic configuration via xDS APIs. It is the default data plane for Istio and other service meshes.

## Feature Comparison

| Feature | Envoy | HAProxy |
|---------|-------|---------|
| HTTP/2 | Native | Yes |
| HTTP/3 (QUIC) | Yes | Experimental |
| gRPC proxying | Native (first-class) | Basic (TCP) |
| gRPC-JSON transcoding | Yes | No |
| TCP/UDP proxying | Yes | Yes (TCP native, UDP limited) |
| Load balancing algorithms | 5+ (Round Robin, Least Request, Ring Hash, Maglev, Random) | 10+ (Round Robin, Least Connections, Source, URI, Header, etc.) |
| Stick tables | No | Yes (native, powerful) |
| Session persistence | Ring hash / Maglev | Multiple methods (cookie, source, etc.) |
| Circuit breaking | Yes (detailed) | Yes (via maxconn, maxqueue) |
| Rate limiting | Yes (local + external) | Yes (stick tables) |
| Health checks | HTTP, TCP, gRPC | HTTP, TCP, agent checks, custom scripts |
| Prometheus metrics | Built-in (detailed) | Via stats endpoint (convertible) |
| Distributed tracing | Yes (Zipkin, Jaeger, OpenTelemetry) | No |
| Stats dashboard | Admin panel (port 9901) | Stats page (built-in) |
| Automatic HTTPS | No | No |
| Config format | YAML (verbose) | haproxy.cfg (custom DSL) |
| Dynamic config | xDS APIs | Runtime API + Data Plane API |
| Hot reload | Zero-downtime restart | Graceful reload (SIGHUP) |
| Config complexity | High | Medium |
| CNCF status | Graduated | Not CNCF |
| License | Apache 2.0 | GPL v2 |

## Installation Complexity

**HAProxy:** One container, one config file (`haproxy.cfg`). The config syntax is custom but straightforward — frontends listen, backends serve, and rules connect them. No config ships with the container; you must provide one.

**Envoy:** One container, one config file (`envoy.yaml`). The YAML is verbose with fully-qualified type annotations. A simple proxy rule requires 30+ lines. The configuration model (listeners → filter chains → clusters) has a steep learning curve.

Winner: **HAProxy.** Its config format is more readable and requires fewer lines for equivalent functionality.

## Performance and Resource Usage

| Metric | Envoy | HAProxy |
|--------|-------|---------|
| Idle RAM | 50-100 MB | 15-30 MB |
| Under load RAM | 200-500 MB | 50-150 MB |
| Concurrency model | Multi-threaded workers | Multi-threaded (nbthread) |
| Max connections | Very high | Extremely high |
| Latency overhead | Very low | Lowest available |

HAProxy is lighter and faster at raw TCP/HTTP proxying. It holds the record for lowest latency proxy in many benchmarks. Envoy uses more memory because it maintains connection pools, detailed statistics, and tracing contexts.

Winner: **HAProxy** for raw performance and resource efficiency.

## Community and Support

| Metric | Envoy | HAProxy |
|--------|-------|---------|
| GitHub stars | 26K+ | 5K+ |
| First release | 2016 | 2001 |
| Backed by | CNCF | HAProxy Technologies (company) |
| Documentation | Extensive (infra-focused) | Excellent (practical) |
| Enterprise version | No | HAProxy Enterprise |
| Age/maturity | 10 years | 25 years |

HAProxy has 25 years of production use. Its documentation covers every edge case you can imagine. Envoy's documentation is comprehensive but targets cloud-native infrastructure engineers.

## Use Cases

### Choose Envoy If...
- You run gRPC services and need native gRPC proxying with transcoding
- Built-in Prometheus metrics and distributed tracing are requirements
- You are integrating with Istio or another service mesh
- You need dynamic configuration via xDS APIs
- Advanced load balancing algorithms (Maglev, ring hash) are needed

### Choose HAProxy If...
- You need the lightest, fastest proxy available
- TCP load balancing is your primary use case
- Stick tables for rate limiting and session persistence matter
- You want simpler, more readable configuration
- You need agent health checks or scripted health checks
- 25 years of battle testing gives you confidence
- GPL v2 licensing is acceptable

## Final Verdict

**HAProxy wins for most production use cases and all self-hosting scenarios.** It is lighter, faster, simpler to configure, and has 25 years of proven reliability. If you need a load balancer for databases, game servers, or high-traffic web applications, HAProxy is the default choice.

**Envoy wins for cloud-native workloads.** If you run gRPC microservices, need built-in observability, or are building on Istio, Envoy is the standard. Its dynamic configuration via xDS APIs enables control plane integration that HAProxy cannot match.

For self-hosters: neither is the ideal choice for a simple homelab. Both are production-grade tools designed for infrastructure engineers. If you just need a reverse proxy with HTTPS, use [Caddy](/apps/caddy/) or [Traefik](/apps/traefik/) instead.

## FAQ

### Can I use HAProxy and Envoy together?
Yes. Some architectures use HAProxy as the L4 edge load balancer and Envoy as the L7 sidecar proxy (the Istio model). This gives you HAProxy's connection handling at the edge and Envoy's observability per-service.

### Which is better for database load balancing?
HAProxy. It has decades of use as a PostgreSQL, MySQL, and Redis load balancer. Its TCP health checks, stick tables for session persistence, and simple configuration make it the standard choice. Envoy works for database proxying but is more complex to configure for this use case.

### Does either support automatic HTTPS?
Neither. Both require an external ACME client (Certbot) or manual certificate management. For automatic HTTPS, use [Caddy](/apps/caddy/) or [Traefik](/apps/traefik/).

## Related

- [How to Self-Host Envoy with Docker](/apps/envoy/)
- [How to Self-Host HAProxy with Docker](/apps/haproxy/)
- [How to Self-Host Traefik with Docker](/apps/traefik/)
- [Traefik vs HAProxy](/compare/traefik-vs-haproxy/)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

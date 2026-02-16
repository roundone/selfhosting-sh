---
title: "HAProxy vs Envoy: Which Load Balancer?"
description: "HAProxy vs Envoy compared for self-hosting and infrastructure. Traditional load balancer vs cloud-native proxy, performance, config, and use cases."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - haproxy
  - envoy
tags:
  - comparison
  - haproxy
  - envoy
  - load-balancer
  - reverse-proxy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

HAProxy is the better load balancer for self-hosting. It's simpler to configure, lighter on resources, and designed for exactly this use case. Envoy is a service mesh data plane built for cloud-native microservices at massive scale. For a homelab or small infrastructure, Envoy is massive overkill.

## Overview

**HAProxy** is a dedicated TCP/HTTP load balancer and reverse proxy that's been in production since 2001. It focuses on reliability, performance, and simplicity. Configuration is a single text file with a straightforward syntax.

**Envoy** is a cloud-native edge and service proxy from the CNCF (originally built by Lyft). It's designed as the data plane for service meshes (Istio, Consul Connect). Configuration uses verbose YAML with typed filter chains.

## Feature Comparison

| Feature | HAProxy | Envoy |
|---------|---------|-------|
| Primary use case | Load balancing | Service mesh data plane |
| Configuration | Single cfg file | Verbose YAML |
| Config complexity | Moderate | High |
| Dynamic configuration | Runtime API | xDS API (full dynamic) |
| Load balancing algorithms | 10+ (round-robin, leastconn, source, uri, etc.) | 5+ (round-robin, least-request, ring-hash, etc.) |
| Health checks | HTTP, TCP, custom scripts | HTTP, TCP, gRPC |
| SSL termination | Yes | Yes |
| HTTP/2 | Frontend + backend | Full end-to-end |
| HTTP/3 (QUIC) | Experimental | Yes |
| gRPC support | Via HTTP/2 passthrough | Native |
| Circuit breaking | Via health checks | Built-in |
| Observability | Stats page, Prometheus | Detailed stats, tracing, Prometheus |
| Docker image | `haproxy:3.3.3` (~10 MB) | `envoyproxy/envoy:v1.37.0` (~50 MB) |
| RAM usage | 30-50 MB | 50-100 MB |

## Installation Complexity

**HAProxy** — write a config file, mount it, done:

```
global
    log stdout format raw local0

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    log global

frontend web
    bind :80
    default_backend servers

backend servers
    server app1 192.168.1.10:8080 check
    server app2 192.168.1.11:8080 check
```

**Envoy** — a simple HTTP proxy requires ~40 lines of typed YAML:

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 10000
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: service_backend
  clusters:
    - name: service_backend
      connect_timeout: 5s
      type: STRICT_DNS
      load_assignment:
        cluster_name: service_backend
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 192.168.1.10
                      port_value: 8080
```

The difference in configuration complexity is immediately obvious.

## Performance and Resource Usage

Both are high-performance proxies. HAProxy is marginally more memory-efficient for simple load balancing. Envoy provides more detailed observability (distributed tracing, per-route metrics) at the cost of higher baseline resource usage.

For self-hosting scale (dozens of services, hundreds of connections), both are dramatically over-provisioned. Performance is not a differentiator at homelab scale.

## Community and Support

**HAProxy** has 25+ years of production history, enterprise backing from HAProxy Technologies, and comprehensive documentation. It's the standard in traditional infrastructure.

**Envoy** has the full weight of the CNCF ecosystem behind it. It's the de facto data plane for Kubernetes service meshes. Enterprise support comes through Istio, Consul Connect, and other mesh vendors.

## Use Cases

### Choose HAProxy If...

- You need a straightforward load balancer
- You want simple, readable configuration
- You're running a homelab or small infrastructure
- You need TCP/UDP load balancing
- You want the most battle-tested option

### Choose Envoy If...

- You're running Kubernetes with a service mesh
- You need xDS dynamic configuration (control plane integration)
- You need native gRPC load balancing
- You want detailed distributed tracing
- You're building cloud-native microservices

## Final Verdict

For self-hosting: HAProxy. No question. It does everything a homelab needs with a fraction of Envoy's configuration complexity. Envoy solves problems (dynamic service mesh, per-request observability, xDS control planes) that don't exist in a typical self-hosting setup.

## FAQ

### Is Envoy replacing HAProxy in the industry?

In Kubernetes/cloud-native environments, yes — Envoy is the dominant service proxy. In traditional infrastructure and self-hosting, HAProxy remains the standard. They serve different markets.

### Can I use Envoy as a simple reverse proxy?

Technically yes, but the configuration overhead is disproportionate to the task. A 5-line HAProxy config becomes 40+ lines in Envoy. Use HAProxy, Nginx, Caddy, or Traefik instead.

### Does HAProxy support dynamic configuration?

HAProxy has a Runtime API for updating servers, weights, and states without restart. It's not as dynamic as Envoy's xDS (which can push entire new configurations), but it covers the common cases.

## Related

- [How to Self-Host HAProxy](/apps/haproxy)
- [How to Self-Host Envoy Proxy](/apps/envoy)
- [Envoy vs Traefik](/compare/envoy-vs-traefik)
- [Traefik vs HAProxy](/compare/traefik-vs-haproxy)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)

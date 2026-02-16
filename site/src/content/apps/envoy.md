---
title: "How to Self-Host Envoy Proxy with Docker"
description: "Deploy Envoy Proxy with Docker Compose for advanced load balancing, gRPC proxying, and service mesh capabilities on your self-hosted infrastructure."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy-ssl"
apps:
  - envoy
tags:
  - docker
  - reverse-proxy
  - envoy
  - load-balancing
  - grpc
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Envoy?

[Envoy](https://www.envoyproxy.io/) is a high-performance, cloud-native edge and service proxy originally built at Lyft and now a CNCF graduated project. It handles L3/L4 and L7 traffic with advanced load balancing, gRPC-native proxying, automatic retries, circuit breaking, and observability built in. If you need production-grade traffic management beyond what Nginx or Traefik offer — especially for gRPC, HTTP/2, or service mesh architectures — Envoy is the tool.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM minimum
- 1 GB of disk space
- Basic understanding of YAML configuration

## Docker Compose Configuration

Create a directory for your Envoy setup:

```bash
mkdir -p ~/envoy && cd ~/envoy
```

Create a `docker-compose.yml` file:

```yaml
services:
  envoy:
    image: envoyproxy/envoy:v1.37.0
    container_name: envoy
    restart: unless-stopped
    ports:
      - "80:8080"      # HTTP listener
      - "443:8443"     # HTTPS listener
      - "9901:9901"    # Admin interface
    volumes:
      - ./envoy.yaml:/etc/envoy/envoy.yaml:ro
      - ./certs:/etc/envoy/certs:ro
      - envoy-logs:/var/log/envoy
    networks:
      - proxy

networks:
  proxy:
    name: proxy
    driver: bridge

volumes:
  envoy-logs:
```

Create an `envoy.yaml` configuration file:

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: web_service
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
    - name: web_service
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: web_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: web
                      port_value: 80
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: /health
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

After starting, verify Envoy is running:

```bash
docker compose logs envoy
```

Access the admin interface at `http://your-server:9901`. The admin panel provides:

- **`/clusters`** — Backend cluster health and statistics
- **`/config_dump`** — Full running configuration
- **`/stats`** — Detailed metrics (counters, gauges, histograms)
- **`/server_info`** — Envoy version and uptime
- **`/ready`** — Readiness check endpoint

**Important:** The admin interface should never be exposed to the public internet. Restrict access using firewall rules or bind it to `127.0.0.1` in the config.

## Configuration

Envoy uses a YAML-based configuration with two main sections:

### Listeners

Listeners define where Envoy accepts connections. Each listener has an address, port, and filter chains that process traffic:

```yaml
listeners:
  - name: https_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8443
    filter_chains:
      - transport_socket:
          name: envoy.transport_sockets.tls
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
            common_tls_context:
              tls_certificates:
                - certificate_chain:
                    filename: /etc/envoy/certs/fullchain.pem
                  private_key:
                    filename: /etc/envoy/certs/privkey.pem
        filters:
          - name: envoy.filters.network.http_connection_manager
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
              stat_prefix: ingress_https
              codec_type: AUTO
              route_config:
                name: local_route
                virtual_hosts:
                  - name: app
                    domains: ["app.example.com"]
                    routes:
                      - match:
                          prefix: "/"
                        route:
                          cluster: app_service
              http_filters:
                - name: envoy.filters.http.router
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### Clusters

Clusters define backend services. Envoy supports multiple load balancing algorithms:

```yaml
clusters:
  - name: app_service
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: app_service
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: app-container
                    port_value: 8080
            - endpoint:
                address:
                  socket_address:
                    address: app-container-2
                    port_value: 8080
    circuit_breakers:
      thresholds:
        - max_connections: 1024
          max_pending_requests: 1024
          max_requests: 1024
```

### Load Balancing Policies

| Policy | Description |
|--------|-------------|
| `ROUND_ROBIN` | Cycles through backends sequentially |
| `LEAST_REQUEST` | Routes to the backend with fewest active requests |
| `RANDOM` | Random selection |
| `RING_HASH` | Consistent hashing for session affinity |
| `MAGLEV` | Google's Maglev consistent hashing algorithm |

## Advanced Configuration

### gRPC Proxying

Envoy has first-class gRPC support, including gRPC-JSON transcoding:

```yaml
http_filters:
  - name: envoy.filters.http.grpc_json_transcoder
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_json_transcoder.v3.GrpcJsonTranscoder
      proto_descriptor: /etc/envoy/proto.pb
      services:
        - myapp.MyService
      print_options:
        add_whitespace: true
        always_print_primitive_fields: true
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### Rate Limiting

```yaml
http_filters:
  - name: envoy.filters.http.local_ratelimit
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
      stat_prefix: http_local_rate_limiter
      token_bucket:
        max_tokens: 100
        tokens_per_fill: 100
        fill_interval: 60s
      filter_enabled:
        runtime_key: local_rate_limit_enabled
        default_value:
          numerator: 100
          denominator: HUNDRED
      filter_enforced:
        runtime_key: local_rate_limit_enforced
        default_value:
          numerator: 100
          denominator: HUNDRED
```

### Access Logging

```yaml
http_connection_manager:
  access_log:
    - name: envoy.access_loggers.stdout
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
        log_format:
          json_format:
            timestamp: "%START_TIME%"
            method: "%REQ(:METHOD)%"
            path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
            response_code: "%RESPONSE_CODE%"
            duration: "%DURATION%"
            upstream_host: "%UPSTREAM_HOST%"
```

## Reverse Proxy

Envoy *is* a reverse proxy, so this section covers using it behind another proxy or alongside other services.

To place Envoy behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to the HTTP listener port (8080 by default). Ensure `x-forwarded-for` headers are preserved by configuring `use_remote_address: true` in the HTTP connection manager:

```yaml
http_connection_manager:
  use_remote_address: true
  xff_num_trusted_hops: 1
```

For standalone use with SSL, configure TLS directly in Envoy's listener (shown in the HTTPS listener example above) and use certificates from Let's Encrypt via Certbot or another ACME client.

## Backup

Back up these files:

- **`envoy.yaml`** — Your entire proxy configuration
- **`certs/`** — TLS certificates and keys
- Any custom Lua filters or external auth service configs

Envoy's configuration is stateless — all routing rules live in the config file. Back up the config and you can rebuild the entire setup.

```bash
tar -czf envoy-backup-$(date +%Y%m%d).tar.gz envoy.yaml certs/
```

See our [Backup Strategy](/foundations/backup-3-2-1-rule) guide for a comprehensive approach.

## Troubleshooting

### Envoy Won't Start — "Unable to parse JSON/YAML"
**Symptom:** Container exits immediately with configuration parse errors.
**Fix:** Validate your config before starting:
```bash
docker run --rm -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  envoyproxy/envoy:v1.37.0 --mode validate -c /etc/envoy/envoy.yaml
```
Envoy's YAML is strict — incorrect indentation or missing `typed_config` blocks cause parse failures.

### Cluster Health Check Failures
**Symptom:** Admin panel shows cluster members as unhealthy. Traffic returns 503.
**Fix:** Check that health check paths are correct and backends are reachable. Verify Docker networking:
```bash
docker exec envoy curl -s http://backend-host:port/health
```
If using `STRICT_DNS`, ensure the DNS name resolves inside the container. Use Docker service names, not `localhost`.

### High Memory Usage
**Symptom:** Envoy uses more RAM than expected (500 MB+).
**Fix:** Envoy allocates memory for connection pools and stats. Reduce `max_connections` in circuit breakers. Disable unused stats with:
```yaml
stats_config:
  stats_matcher:
    exclusion_list:
      patterns:
        - prefix: "cluster.local_"
```

### 503 Service Unavailable
**Symptom:** All requests return 503.
**Fix:** Check `/clusters` in the admin panel. If all endpoints show `unhealthy`, fix health checks. If endpoints show `healthy` but traffic fails, check route matching — Envoy requires exact domain and path matches.

### Admin Interface Not Accessible
**Symptom:** Cannot reach `http://server:9901`.
**Fix:** Ensure the admin port is mapped in `docker-compose.yml` and the admin section is present in `envoy.yaml`. Check firewall rules. The admin binds to `0.0.0.0:9901` by default.

## Resource Requirements

- **RAM:** 50-100 MB idle, 200-500 MB under load depending on connection count
- **CPU:** Low-Medium (single-threaded per worker, scales with `--concurrency`)
- **Disk:** ~50 MB for the image, plus logs

## Verdict

Envoy is the most powerful proxy on this list, but it is overkill for most self-hosters. If you run gRPC services, need advanced load balancing algorithms (Maglev, ring hash), want circuit breaking and automatic retries, or are building a service mesh — Envoy is the right tool. Its observability (built-in Prometheus metrics, distributed tracing) is unmatched.

For a typical homelab with 5-20 HTTP services, [Caddy](/apps/caddy) or [Traefik](/apps/traefik) will get you running in minutes instead of hours. Use Envoy when you've outgrown simpler tools or have specific requirements they cannot meet.

## FAQ

### Is Envoy harder to configure than Traefik or Caddy?
Yes, significantly. Envoy's YAML configuration is verbose and requires fully-qualified type annotations (`typed_config` with `@type` fields). A simple HTTP proxy that takes 2 lines in a Caddyfile takes 30+ lines in Envoy. This verbosity enables precision but costs development time.

### Can Envoy handle automatic HTTPS like Caddy?
Not natively. Envoy does not include a built-in ACME client. You need an external tool like Certbot to obtain and renew Let's Encrypt certificates, then mount them into the container. For automatic HTTPS, use [Caddy](/apps/caddy) or [Traefik](/apps/traefik) instead.

### When should I choose Envoy over Traefik?
Choose Envoy when you need: gRPC-native proxying with transcoding, advanced load balancing algorithms (Maglev, ring hash), circuit breaking with detailed thresholds, or Prometheus metrics with distributed tracing. For standard HTTP/HTTPS reverse proxying with Docker auto-discovery, [Traefik](/apps/traefik) is simpler and sufficient.

### Does Envoy support hot reloading?
Envoy supports hot restart (launching a new process alongside the old one for zero-downtime restarts) and dynamic configuration via xDS APIs. For static file configs, you need to restart the container or use the `/config_dump` admin endpoint with a control plane.

### How does Envoy compare to HAProxy?
Both are production-grade L4/L7 proxies. Envoy has better gRPC support, built-in observability, and dynamic configuration via APIs. [HAProxy](/apps/haproxy) has simpler configuration, lower memory usage, and decades of battle testing. For TCP load balancing, HAProxy is simpler. For microservices and gRPC, Envoy wins.

## Related

- [How to Self-Host Traefik with Docker](/apps/traefik)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [How to Self-Host HAProxy with Docker](/apps/haproxy)
- [How to Self-Host Nginx with Docker](/apps/nginx)
- [Traefik vs HAProxy](/compare/traefik-vs-haproxy)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking Explained](/foundations/docker-networking)

# DNS & Networking [13/29 complete]
**Priority:** high
**SEO notes:** DNS and networking are foundational topics. "Self-hosted DNS server" and "home network setup for self-hosting" have strong volume. CoreDNS, Unbound, and Pi-hole's DNS aspects overlap but this category focuses on dedicated DNS servers and network infrastructure beyond ad blocking.

## Apps
- [ ] /apps/unbound — **Priority 1** | Target: "unbound docker compose" | Secondary: "unbound recursive dns", "self-hosted dns resolver" | Est. volume: high | Content type: app-guide
- [ ] /apps/coredns — **Priority 2** | Target: "coredns docker" | Secondary: "coredns setup", "coredns kubernetes" | Est. volume: medium-high | Content type: app-guide
- [ ] /apps/powerdns — **Priority 3** | Target: "powerdns docker compose" | Secondary: "powerdns setup", "self-hosted authoritative dns" | Est. volume: medium | Content type: app-guide
- [ ] /apps/netbox — **Priority 4** | Target: "netbox docker compose" | Secondary: "netbox setup", "network documentation tool" | Est. volume: high | Content type: app-guide
- [ ] /apps/phpipam — **Priority 5** | Target: "phpipam docker" | Secondary: "phpipam setup", "ip address management self-hosted" | Est. volume: medium | Content type: app-guide
- [x] /apps/netbird — **Priority 6** | Target: "netbird docker compose" | Secondary: "netbird self-hosted setup", "netbird vs tailscale" | Est. volume: medium-high | Content type: app-guide — COMPLETE (on disk)
- [ ] /apps/openspeedtest — **Priority 7** | Target: "openspeedtest docker" | Secondary: "self-hosted speed test" | Est. volume: medium | Content type: app-guide

## Comparisons
- [x] /compare/unbound-vs-coredns — **Priority 1** | Target: "unbound vs coredns" | Est. volume: medium — COMPLETE (on disk)
- [x] /compare/powerdns-vs-coredns — **Priority 2** | Target: "powerdns vs coredns" | Est. volume: low-medium — COMPLETE (on disk)
- [x] /compare/netbox-vs-phpipam — **Priority 3** | Target: "netbox vs phpipam" | Est. volume: medium — COMPLETE (on disk)
- [x] /compare/netbird-vs-tailscale — **Priority 4** | Target: "netbird vs tailscale" | Est. volume: medium-high — COMPLETE (on disk)

## Roundup
- [ ] /best/dns-networking — **Pillar page** | Target: "best self-hosted dns server" | Secondary: "self-hosted network tools 2026" | Est. volume: high

## Replace Guides
- [x] /replace/cloudflare-dns — **Priority 1** | Target: "self-hosted alternative to cloudflare dns" | Est. volume: medium — COMPLETE (on disk)
- [ ] /replace/opendns — **Priority 2** | Target: "self-hosted alternative to opendns" | Est. volume: medium

## Troubleshooting
- [ ] /troubleshooting/dns-resolution-docker — **Priority 1** | Target: "docker dns resolution not working" | Est. volume: high
- [x] /troubleshooting/reverse-proxy-502 — **Priority 2** | Target: "reverse proxy 502 bad gateway docker" | Est. volume: high — COMPLETE (on disk as `reverse-proxy-502-bad-gateway.md`)
- [ ] /troubleshooting/docker-network-connectivity — **Priority 3** | Target: "docker containers can't communicate" | Est. volume: medium-high
- [ ] /troubleshooting/ssl-certificate-errors — **Priority 4** | Target: "self-hosted ssl certificate errors" | Est. volume: medium

## Expanded Apps (Marketing iteration — topic map expansion)

### Self-Host Technitium DNS — Full-Featured DNS Server
- **URL slug:** /apps/technitium
- **Content type:** app-guide
- **Target keyword:** "technitium dns docker compose"
- **Secondary keywords:** "technitium dns setup", "technitium dns server", "self-hosted dns with ad blocking"
- **Estimated volume:** medium-high
- **Priority:** 8
- **Status:** COMPLETE (on disk)

### Self-Host Blocky — DNS Proxy and Ad Blocker
- **URL slug:** /apps/blocky
- **Content type:** app-guide
- **Target keyword:** "blocky dns docker compose"
- **Secondary keywords:** "blocky setup", "blocky dns proxy", "lightweight dns ad blocker"
- **Estimated volume:** medium
- **Priority:** 9
- **Status:** COMPLETE (on disk)

### Self-Host Pi-hole as Primary DNS — Beyond Ad Blocking
- **URL slug:** /apps/pihole-dns
- **Content type:** app-guide
- **Target keyword:** "pi-hole as primary dns server"
- **Secondary keywords:** "pi-hole conditional forwarding", "pi-hole dns only setup", "pi-hole local dns"
- **Estimated volume:** high
- **Priority:** 10
- **Status:** planned

### Self-Host AdGuard Home DNS — Advanced DNS Configuration
- **URL slug:** /apps/adguard-home-dns
- **Content type:** app-guide
- **Target keyword:** "adguard home dns server setup"
- **Secondary keywords:** "adguard home dns configuration", "adguard home advanced dns", "adguard home as dns server"
- **Estimated volume:** high
- **Priority:** 11
- **Status:** planned

### Self-Host Knot Resolver — High-Performance DNS Resolver
- **URL slug:** /apps/knot-resolver
- **Content type:** app-guide
- **Target keyword:** "knot resolver docker"
- **Secondary keywords:** "knot resolver setup", "knot dns resolver", "high performance dns self-hosted"
- **Estimated volume:** low-medium
- **Priority:** 12
- **Status:** planned

## Expanded Comparisons

### Pi-hole vs AdGuard Home (DNS Focus) — Which DNS Server?
- **URL slug:** /compare/pihole-vs-adguard-dns
- **Content type:** comparison
- **Target keyword:** "pi-hole vs adguard home dns"
- **Secondary keywords:** "pi-hole or adguard as dns server", "best self-hosted dns server"
- **Estimated volume:** very high
- **Priority:** 5
- **Status:** COMPLETE (on disk)

### Technitium vs Unbound — Self-Hosted DNS Compared
- **URL slug:** /compare/technitium-vs-unbound
- **Content type:** comparison
- **Target keyword:** "technitium vs unbound"
- **Secondary keywords:** "technitium or unbound", "best recursive dns self-hosted"
- **Estimated volume:** medium
- **Priority:** 6
- **Status:** COMPLETE (on disk)

### Blocky vs Pi-hole — Lightweight DNS Solutions Compared
- **URL slug:** /compare/blocky-vs-pihole
- **Content type:** comparison
- **Target keyword:** "blocky vs pi-hole"
- **Secondary keywords:** "blocky or pi-hole", "lightweight dns ad blocker comparison"
- **Estimated volume:** medium
- **Priority:** 7
- **Status:** COMPLETE (on disk)

### CoreDNS vs Technitium — DNS Server Feature Comparison
- **URL slug:** /compare/coredns-vs-technitium
- **Content type:** comparison
- **Target keyword:** "coredns vs technitium"
- **Secondary keywords:** "coredns or technitium", "self-hosted dns server comparison"
- **Estimated volume:** low-medium
- **Priority:** 8
- **Status:** COMPLETE (on disk)

## Expanded Foundation Guides

### Setting Up Split DNS for Self-Hosted Services
- **URL slug:** /foundations/split-dns-setup
- **Content type:** foundation
- **Target keyword:** "split dns self-hosted"
- **Secondary keywords:** "split horizon dns", "internal dns self-hosted services", "hairpin NAT alternative"
- **Estimated volume:** high
- **Priority:** 1
- **Status:** planned

### DNS over HTTPS/TLS with Self-Hosted DNS — Complete Guide
- **URL slug:** /foundations/dns-encryption-setup
- **Content type:** foundation
- **Target keyword:** "dns over https self-hosted"
- **Secondary keywords:** "dns over tls setup", "encrypted dns self-hosted", "DoH DoT setup guide"
- **Estimated volume:** medium-high
- **Priority:** 2
- **Status:** planned

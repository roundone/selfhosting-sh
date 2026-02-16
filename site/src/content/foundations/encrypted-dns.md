---
title: "Encrypted DNS: DoH, DoT, and DoQ Explained"
description: "Understand DNS-over-HTTPS, DNS-over-TLS, and DNS-over-QUIC — what they are, why they matter, and how to set them up for self-hosting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps:
  - adguard-home
  - blocky
  - technitium
tags:
  - foundations
  - dns
  - privacy
  - security
  - encrypted-dns
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Encrypted DNS?

Standard DNS sends queries in plain text over UDP port 53. Your ISP, anyone on your network, and every router between you and the DNS server can see every domain you look up. Encrypted DNS protocols fix this by wrapping DNS queries in encryption.

Three protocols exist:

| Protocol | Port | Transport | Standard |
|----------|------|-----------|----------|
| DNS-over-HTTPS (DoH) | 443 | HTTPS (TCP) | RFC 8484 |
| DNS-over-TLS (DoT) | 853 | TLS (TCP) | RFC 7858 |
| DNS-over-QUIC (DoQ) | 853 | QUIC (UDP) | RFC 9250 |

All three achieve the same goal — encrypting DNS traffic — but differ in how they do it and where they work best.

## Prerequisites

- Basic DNS understanding ([DNS Explained](/foundations/dns-explained))
- A self-hosted DNS server (optional — can use public resolvers)
- A domain name with SSL certificates (for running your own encrypted DNS server)

## Why Encrypted DNS Matters for Self-Hosting

**Privacy from your ISP.** Without encrypted DNS, your ISP sees every domain you resolve — even if the actual website traffic is encrypted with HTTPS. With encrypted DNS, your ISP sees you connecting to a DNS server but can't read the queries.

**Network security.** Plain DNS is trivially spoofable. An attacker on your network can intercept DNS queries and return fake responses (DNS hijacking). Encrypted DNS prevents this.

**Circumventing DNS filtering.** Some ISPs and networks block or redirect DNS queries on port 53. DoH on port 443 is indistinguishable from regular HTTPS traffic, making it nearly impossible to block.

**For self-hosters specifically:** If you run a DNS ad blocker (Pi-hole, AdGuard Home, Blocky, Technitium), encrypted DNS ensures your upstream queries to Cloudflare, Quad9, or Google are private. It also lets you offer encrypted DNS to your clients — so devices on your network query your ad blocker over an encrypted channel.

## DNS-over-HTTPS (DoH)

DoH wraps DNS queries in standard HTTPS requests. The DNS query is sent as an HTTP POST or GET to a URL like `https://dns.example.com/dns-query`.

**Advantages:**
- Uses port 443 — indistinguishable from regular web traffic, hard to block
- Works through corporate firewalls and restrictive networks
- Supported by all major browsers (Firefox, Chrome, Edge, Safari)
- HTTP/2 multiplexing reduces connection overhead

**Disadvantages:**
- Slightly higher latency than DoT (HTTP overhead)
- Harder to filter/manage on enterprise networks (looks like normal HTTPS)
- Requires a web server or TLS termination

**Public DoH servers:**
```
https://cloudflare-dns.com/dns-query     (Cloudflare)
https://dns.google/dns-query              (Google)
https://dns.quad9.net/dns-query           (Quad9)
https://doh.mullvad.net/dns-query         (Mullvad)
```

## DNS-over-TLS (DoT)

DoT wraps DNS queries in a TLS connection on port 853. It's a simpler protocol than DoH — just DNS inside TLS, without the HTTP layer.

**Advantages:**
- Lower overhead than DoH (no HTTP layer)
- Dedicated port makes it easy to identify and manage
- Simpler implementation
- Supported by Android 9+ natively ("Private DNS" setting)

**Disadvantages:**
- Runs on port 853 — easily blocked by firewalls
- Not supported in browsers directly
- ISPs can see you're using DoT (even if they can't read queries)

**Public DoT servers:**
```
tls://1dot1dot1dot1.cloudflare-dns.com   (Cloudflare)
tls://dns.google                          (Google)
tls://dns.quad9.net                       (Quad9)
```

## DNS-over-QUIC (DoQ)

DoQ uses the QUIC protocol (UDP-based, with TLS 1.3 built in). It's the newest encrypted DNS protocol and the fastest.

**Advantages:**
- Lowest latency — QUIC's 0-RTT handshake eliminates round trips
- UDP-based — avoids TCP head-of-line blocking
- Built-in TLS 1.3 encryption
- Connection migration (survives network changes)

**Disadvantages:**
- Newest protocol — less widely supported
- Uses port 853 (UDP) — can be blocked like DoT
- Fewer public servers available

**Public DoQ servers:**
```
quic://dns.adguard-dns.com               (AdGuard)
quic://dns.nextdns.io                     (NextDNS)
```

## Which Protocol Should You Use?

| Scenario | Best Protocol | Why |
|----------|--------------|-----|
| General privacy | DoH | Hardest to block, works everywhere |
| Android devices | DoT | Native "Private DNS" support |
| Maximum performance | DoQ | Lowest latency |
| Corporate/restricted network | DoH | Blends with HTTPS traffic |
| Self-hosted DNS server | DoT or DoH | Both well-supported |
| Ad blocker upstream | DoH or DoT | Both work, DoH is more common |

**For most self-hosters:** Use DoH for upstream queries (your ad blocker querying Cloudflare/Quad9) and offer DoT or DoH to clients on your local network.

## Setting Up Encrypted DNS with Self-Hosted Ad Blockers

### AdGuard Home

AdGuard Home supports all three protocols as both a client (upstream queries) and a server (serving clients).

**As upstream (your queries to public resolvers):**

In Settings → DNS settings → Upstream DNS servers:
```
https://cloudflare-dns.com/dns-query
https://dns.quad9.net/dns-query
```

**As server (clients query you over encrypted DNS):**

In Settings → Encryption settings, provide your TLS certificate and key. AdGuard Home then serves DoH on port 443 and DoT on port 853 automatically.

[Full setup guide: How to Self-Host AdGuard Home](/apps/adguard-home)

### Blocky

Blocky supports DoH and DoT as upstream resolvers natively in its YAML config:

```yaml
upstreams:
  groups:
    default:
      - https://cloudflare-dns.com/dns-query
      - https://dns.quad9.net/dns-query
```

Blocky can also serve as a DoH/DoT server with TLS certificates configured in the `ports` section.

[Full setup guide: How to Self-Host Blocky](/apps/blocky)

### Pi-hole

Pi-hole does **not** support encrypted DNS natively. You need an add-on:

- **cloudflared** — Cloudflare's DoH proxy. Runs as a sidecar container, Pi-hole forwards to it on `127.0.0.1#5053`.
- **Unbound** — Recursive resolver with DoT support. More complex but also gives you recursive DNS.

```yaml
# cloudflared sidecar for Pi-hole DoH
services:
  cloudflared:
    image: cloudflare/cloudflared:2026.2.0
    restart: unless-stopped
    command: proxy-dns --port 5053 --upstream https://cloudflare-dns.com/dns-query
    networks:
      - pihole-net
```

Then set Pi-hole's upstream DNS to `cloudflared#5053`.

[Full setup guide: How to Self-Host Pi-hole](/apps/pi-hole)

### Technitium DNS

Technitium supports DoH, DoT, and DoQ as both upstream forwarder protocols and as server protocols.

Configure in the web UI under Settings → DNS Server → Forwarders. Select "DNS-over-HTTPS" or "DNS-over-TLS" as the forwarder protocol.

For serving encrypted DNS to clients, configure TLS certificates under Settings → DNS Server → Optional Protocols.

[Full setup guide: How to Self-Host Technitium DNS](/apps/technitium)

## Configuring Clients

### Android (DoT)

1. Settings → Network & Internet → Private DNS
2. Select "Private DNS provider hostname"
3. Enter your server hostname (e.g., `dns.example.com`)
4. Android will use DoT on port 853

### iOS/macOS (DoH or DoT)

Apple devices use DNS profiles. Create a `.mobileconfig` profile:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://dns.example.com/dns-query</string>
            </dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.example.dns</string>
            <key>PayloadUUID</key>
            <string>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadIdentifier</key>
    <string>com.example.dns.profile</string>
    <key>PayloadUUID</key>
    <string>12345678-ABCD-EF01-2345-6789ABCDEF01</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
```

Install the profile on your device via AirDrop, email, or a web server.

### Firefox (DoH)

1. Settings → Privacy & Security → DNS over HTTPS
2. Select "Max Protection" or "Custom"
3. Enter your DoH URL: `https://dns.example.com/dns-query`

### Chrome/Edge (DoH)

1. Settings → Privacy and Security → Security → Use secure DNS
2. Select "With: Custom"
3. Enter your DoH URL

### Windows (DoH)

Windows 11 supports DoH natively:

1. Settings → Network & Internet → your connection → DNS server assignment → Edit
2. Enter your DNS server IP
3. Under "DNS over HTTPS," select "On (automatic template)"

### Linux (systemd-resolved)

```bash
# /etc/systemd/resolved.conf
[Resolve]
DNS=dns.example.com
DNSOverTLS=yes
```

```bash
sudo systemctl restart systemd-resolved
```

## Verifying Encrypted DNS

### Test DoH

```bash
curl -s -H 'accept: application/dns-json' \
  'https://dns.example.com/dns-query?name=example.com&type=A'
```

### Test DoT

```bash
# Using kdig (from knot-dnsutils package)
kdig @dns.example.com +tls example.com A

# Using openssl
openssl s_client -connect dns.example.com:853
```

### Verify No DNS Leaks

Visit [dnsleaktest.com](https://dnsleaktest.com) or [browserleaks.com/dns](https://browserleaks.com/dns) to verify your DNS queries are going to the expected server.

## Common Mistakes

### Using DoH upstream but plain DNS to clients

Your ad blocker queries Cloudflare over DoH (encrypted), but your devices query the ad blocker over plain DNS on port 53. Anyone on your local network can still see DNS queries between your devices and the ad blocker. For full encryption, serve DoH/DoT from your ad blocker too.

### Forgetting to open port 853

DoT and DoQ use port 853. If you're serving encrypted DNS, make sure your firewall allows port 853 (TCP for DoT, UDP for DoQ) from your network.

### Certificate issues

Self-signed certificates won't work with most DoH/DoT clients. Use a real certificate from Let's Encrypt. Your DNS server needs a valid hostname with a matching certificate.

### Browser DoH bypassing your ad blocker

Firefox and Chrome enable DoH by default to Cloudflare or Google, which bypasses your local ad blocker entirely. Disable browser-level DoH if you run a network-wide ad blocker, or point it at your own DoH server.

## Next Steps

- Set up a DNS ad blocker: [AdGuard Home](/apps/adguard-home), [Pi-hole](/apps/pi-hole), or [Blocky](/apps/blocky)
- Configure SSL certificates: [SSL Certificates Guide](/foundations/ssl-certificates)
- Set up remote access to your DNS server: [Remote Access Guide](/foundations/port-forwarding)

## Related

- [DNS Explained for Self-Hosting](/foundations/dns-explained)
- [How to Self-Host AdGuard Home](/apps/adguard-home)
- [How to Self-Host Pi-hole](/apps/pi-hole)
- [How to Self-Host Blocky](/apps/blocky)
- [How to Self-Host Technitium DNS](/apps/technitium)
- [Best Self-Hosted Ad Blockers](/best/ad-blocking)
- [Self-Hosted Alternatives to Google DNS](/replace/google-dns)
- [Self-Hosted Alternatives to NextDNS](/replace/nextdns)
- [SSL Certificates Guide](/foundations/ssl-certificates)

---
title: "How to Self-Host Jitsi Meet with Docker"
description: "Deploy Jitsi Meet with Docker Compose for private video conferencing with no account needed and no participant limits."
date: 2026-02-19
dateUpdated: 2026-02-19
category: "video-conferencing"
apps:
  - jitsi-meet
tags:
  - self-hosted
  - jitsi
  - docker
  - video-conferencing
  - zoom-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Jitsi Meet?

[Jitsi Meet](https://jitsi.org/) is a self-hosted video conferencing platform. Start or join a meeting from a browser — no account required, no app install needed, no participant limits imposed by a third party. It replaces Zoom, Google Meet, and Microsoft Teams for organizations that want full control over their video infrastructure. Jitsi is open source (Apache 2.0) and backed by 8x8.

## Prerequisites

- A Linux server with a public IP (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free RAM (4 GB recommended for 10+ simultaneous participants)
- 10 GB of free disk space
- A domain name pointing to your server (required for HTTPS)
- UDP port 10000 open in your firewall (critical for video/audio)

## Docker Compose Configuration

Jitsi Meet uses four interconnected services. Clone the official Docker repository and configure from there:

```bash
# Get the latest stable release
git clone --depth 1 https://github.com/jitsi/docker-jitsi-meet
cd docker-jitsi-meet

# Copy environment template
cp env.example .env

# Generate strong passwords for internal services
./gen-passwords.sh

# Create config directories
mkdir -p ~/.jitsi-meet-cfg/{web,transcripts,prosody/config,prosody/prosody-plugins-custom,jicofo,jvb}
```

Edit the `.env` file — these are the critical settings:

```bash
# Pin to a stable release (default is "unstable" — always override this)
JITSI_IMAGE_VERSION=stable-10741

# Your public URL
PUBLIC_URL=https://meet.example.com

# Your server's public IP — CRITICAL for remote participants
JVB_ADVERTISE_IPS=1.2.3.4

# XMPP domain (default works for most setups)
XMPP_DOMAIN=meet.jitsi

# HTTP/HTTPS ports (change if behind a reverse proxy)
HTTP_PORT=80
HTTPS_PORT=443

# Enable Let's Encrypt (skip if using your own reverse proxy)
ENABLE_LETSENCRYPT=1
LETSENCRYPT_DOMAIN=meet.example.com
LETSENCRYPT_EMAIL=admin@example.com

# Timezone
TZ=UTC
```

The `docker-compose.yml` is provided in the repository. It defines four services:

| Service | Image | Purpose | Key Ports |
|---------|-------|---------|-----------|
| web | `jitsi/web` | Nginx frontend, serves the meeting UI | 80/TCP, 443/TCP |
| prosody | `jitsi/prosody` | XMPP server for internal messaging | Internal only |
| jicofo | `jitsi/jicofo` | Conference focus — orchestrates meetings | 8888/TCP (localhost) |
| jvb | `jitsi/jvb` | Video bridge — routes audio/video streams | 10000/UDP |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `https://meet.example.com` in your browser
2. Jitsi Meet is ready immediately — no account setup required
3. Type a room name and click "Start meeting"
4. Share the URL with participants — they join directly in their browser

By default, anyone can create meetings. To restrict this, enable authentication (see Configuration below).

## Configuration

### Authentication

By default, Jitsi Meet allows anyone to create meetings. To require authentication:

Add to `.env`:

```bash
ENABLE_AUTH=1
AUTH_TYPE=internal

# Enable guests to join meetings created by authenticated users
ENABLE_GUESTS=1
```

Restart the stack, then create users:

```bash
docker compose exec prosody prosodyctl --config /config/prosody.cfg.lua register admin meet.jitsi your_password
```

Authenticated users create meetings; guests can join existing meetings without an account.

### Meeting Settings

Common settings in `.env`:

```bash
# Require a display name before joining
ENABLE_REQUIRE_DISPLAY_NAME=1

# Start meetings with audio muted
START_AUDIO_MUTED=10    # Mute participants after 10th joins

# Start meetings with video muted
START_VIDEO_MUTED=10    # Mute video after 10th joins

# Enable lobby (waiting room)
ENABLE_LOBBY=1

# Disable or enable recording
ENABLE_RECORDING=0
```

### LDAP Authentication

For integration with Active Directory or LDAP:

```bash
ENABLE_AUTH=1
AUTH_TYPE=ldap
LDAP_URL=ldap://ldap.example.com
LDAP_BASE=dc=example,dc=com
LDAP_BINDDN=cn=admin,dc=example,dc=com
LDAP_BINDPW=ldap_password
LDAP_FILTER=(sAMAccountName=%u)
```

## Advanced Configuration (Optional)

### Recording with Jibri

Jibri enables meeting recording and live streaming to YouTube/RTMP:

```bash
docker compose -f docker-compose.yml -f docker-compose.jibri.yml up -d
```

Jibri requires Chrome and FFmpeg inside its container and is resource-intensive — allocate at least 4 GB RAM for the Jibri service alone.

### SIP Gateway with Jigasi

Jigasi allows phone dial-in to meetings:

```bash
docker compose -f docker-compose.yml -f docker-compose.jigasi.yml up -d
```

Requires a SIP provider account.

### Etherpad Integration

Enable collaborative document editing within meetings:

```bash
docker compose -f docker-compose.yml -f docker-compose.etherpad.yml up -d
```

## Reverse Proxy

If running behind an external reverse proxy instead of Jitsi's built-in Nginx:

1. Set `DISABLE_HTTPS=1` in `.env`
2. Change `HTTP_PORT` to an internal port (e.g., `8000`)
3. Remove `ENABLE_LETSENCRYPT`
4. Configure your proxy to forward to the web service

Your reverse proxy must:
- Forward WebSocket connections (critical for real-time communication)
- Pass `X-Forwarded-For` and `X-Forwarded-Proto` headers
- Handle large request bodies (for file sharing)

**UDP port 10000 cannot go through an HTTP reverse proxy.** It must be forwarded directly to the JVB container. This is the media transport port — without it, video and audio will not work for remote participants.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

## Backup

The configuration directory (`~/.jitsi-meet-cfg/`) contains all persistent state:

```bash
tar czf jitsi-backup-$(date +%Y%m%d).tar.gz ~/.jitsi-meet-cfg/
```

Jitsi Meet itself is mostly stateless — meetings are ephemeral. The config directory stores Prosody user accounts, SSL certificates, and custom configuration.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Video/Audio Not Working for Remote Participants

**Symptom:** Local participants can see each other, but remote participants have no video or audio.
**Fix:** Ensure `JVB_ADVERTISE_IPS` is set to your server's public IP in `.env`. Verify UDP port 10000 is open in your firewall: `sudo ufw allow 10000/udp`. On cloud providers, also open port 10000/UDP in the security group or network firewall.

### "Meeting Has Been Oops'd" Error

**Symptom:** Meetings fail to start or crash immediately.
**Fix:** Check Jicofo logs: `docker compose logs jicofo`. Common cause: Prosody failed to start, or the internal XMPP passwords are mismatched. Re-run `./gen-passwords.sh` and restart all services.

### Only 2 Participants Can Connect

**Symptom:** Meetings work with 2 people but break with 3+.
**Fix:** With 2 participants, Jitsi uses peer-to-peer (no server needed). With 3+, it switches to JVB routing — which requires port 10000/UDP to be open and `JVB_ADVERTISE_IPS` to be correct.

### High CPU Usage During Meetings

**Symptom:** Server CPU spikes during active meetings.
**Fix:** JVB is CPU-intensive when routing video for many participants. For 10+ simultaneous users, allocate 4+ CPU cores. Consider enabling `START_VIDEO_MUTED` to reduce initial load.

### Let's Encrypt Certificate Fails

**Symptom:** HTTPS doesn't work, certificate errors in browser.
**Fix:** Ensure ports 80 and 443 are open and not used by another service. Verify `LETSENCRYPT_DOMAIN` matches your DNS A record. Check web container logs: `docker compose logs web`.

## Resource Requirements

- **RAM:** 1 GB idle, 2-4 GB during active meetings (scales with participant count)
- **CPU:** 2 cores minimum, 4+ recommended for 10+ simultaneous participants
- **Disk:** ~500 MB for the application, plus recordings if Jibri is enabled
- **Network:** 3-5 Mbps per participant for HD video; bandwidth is the primary bottleneck for large meetings

## Verdict

Jitsi Meet is the best self-hosted video conferencing platform. It works in the browser with zero friction — no accounts, no installs, no limits. The four-service architecture is more complex to deploy than a single-container app, but the official Docker setup handles it well. For small teams (under 20 participants), a modest VPS handles it fine. For larger deployments, you'll need dedicated hardware.

The main trade-off vs Zoom/Google Meet is reliability at scale — Jitsi requires more server resources per participant since you're hosting the media infrastructure yourself. For organizations that need privacy, compliance, or just want to stop paying per-user fees, it's the clear choice.

If you need something lighter for small teams, look at peer-to-peer options. For large-scale education or webinars, [BigBlueButton](/apps/bigbluebutton) has more classroom features.

## FAQ

### Can Jitsi Meet handle 100+ participants?

Technically yes, but you'll need significant server resources (8+ cores, 16+ GB RAM) and excellent bandwidth. For very large meetings, consider Jitsi's Ocastrator for multi-JVB scaling.

### Is Jitsi Meet end-to-end encrypted?

Jitsi supports E2EE for 1-on-1 calls (peer-to-peer). For group calls routed through JVB, E2EE is available as an experimental feature but may impact performance.

### Can I use Jitsi Meet with a mobile app?

Yes. Official apps are available for iOS and Android. They connect to your self-hosted instance — just enter your server URL in the app settings.

### How does Jitsi compare to Zoom?

Jitsi is free, self-hosted, and has no participant limits. Zoom has better performance at scale, breakout rooms, and a more polished UI. See our [Jitsi vs Zoom Alternatives](/compare/jitsi-vs-zoom-alternatives) comparison.

## Related

- [Best Self-Hosted Video Conferencing](/best/video-conferencing)
- [How to Self-Host BigBlueButton](/apps/bigbluebutton)
- [Self-Hosted Alternatives to Zoom](/replace/zoom)
- [Self-Hosted Alternatives to Google Meet](/replace/google-meet)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Security Basics for Self-Hosting](/foundations/security-basics)

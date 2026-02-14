---
title: "Immich Upload Fails or Times Out"
type: "troubleshooting"
app: "immich"
category: "photo-management"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Fix Immich upload failures, timeouts, and stuck uploads from the mobile app or web UI."
symptoms:
  - "upload fails"
  - "upload timeout"
  - "stuck upload"
  - "mobile app upload not working"
---

## Symptoms

- Photos fail to upload from the mobile app
- Web UI uploads time out on large files
- Upload progress gets stuck at a percentage
- Error message: "Failed to upload" or timeout errors

## Common Causes & Fixes

### 1. Reverse Proxy Timeout

If you're behind a reverse proxy (Nginx, Traefik, Caddy), the default timeout may be too short for large uploads.

**Nginx fix:** Add to your Immich server block:

```nginx
client_max_body_size 50000M;
proxy_read_timeout 600;
proxy_connect_timeout 600;
proxy_send_timeout 600;
```

**Traefik fix:** Increase the response forwarding timeout in your Traefik config.

### 2. Disk Space

Check that your upload volume has sufficient space:

```bash
df -h /path/to/immich/library
```

### 3. Permissions

Ensure the upload directory is writable by the Immich container:

```bash
sudo chown -R 1000:1000 /path/to/immich/library
```

### 4. Mobile App Connection

If only mobile uploads fail:
- Verify the server URL in app settings
- Try switching between WiFi and mobile data
- Check that the server port is accessible from outside your LAN

## Still Stuck?

- Check the Immich server logs: `docker compose logs immich-server`
- Visit the [Immich GitHub Discussions](https://github.com/immich-app/immich/discussions)

See also: [Immich setup guide](/apps/immich/) | [Reverse proxy guide](/foundations/reverse-proxy/)

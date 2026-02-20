---
title: "How to Self-Host SFTPGo with Docker Compose"
description: "Deploy SFTPGo with Docker Compose for self-hosted SFTP, FTP, WebDAV, and HTTP file sharing with a web admin UI."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync"
apps:
  - sftpgo
tags:
  - self-hosted
  - sftpgo
  - sftp
  - ftp
  - webdav
  - docker
  - file-sharing
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SFTPGo?

SFTPGo is a full-featured SFTP, FTP/S, WebDAV, and HTTP/S file server written in Go. It provides a web admin panel for managing users and shares, supports virtual folders, S3/GCS/Azure backends, and integrates with external auth providers. It's what you deploy when you need a proper file transfer server with user management — not just a shared folder.

[Official site: github.com/drakkan/sftpgo](https://github.com/drakkan/sftpgo)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space (plus storage for user data)
- 512 MB of RAM (minimum)
- A domain name (optional, for WebDAV and web client access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  sftpgo:
    container_name: sftpgo
    image: drakkan/sftpgo:v2.7.0
    restart: unless-stopped
    ports:
      - "8080:8080"    # Web admin UI
      - "8090:8090"    # Web client
      - "2022:2022"    # SFTP
      - "2121:2121"    # FTP
      - "10000-10100:10000-10100"  # FTP passive ports
    environment:
      SFTPGO_FTPD__BINDINGS__0__PORT: "2121"
      SFTPGO_FTPD__BINDINGS__0__FORCE_PASSIVE_IP: "your-server-ip"  # CHANGE THIS
      SFTPGO_FTPD__PASSIVE_PORT_RANGE__START: "10000"
      SFTPGO_FTPD__PASSIVE_PORT_RANGE__END: "10100"
      SFTPGO_WEBDAVD__BINDINGS__0__PORT: "8090"
    volumes:
      - sftpgo-data:/srv/sftpgo
      - sftpgo-home:/var/lib/sftpgo
      - sftpgo-backups:/srv/sftpgo/backups
    networks:
      - sftpgo

networks:
  sftpgo:
    driver: bridge

volumes:
  sftpgo-data:
  sftpgo-home:
  sftpgo-backups:
```

Replace `your-server-ip` with your server's public IP address for FTP passive mode.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080/web/admin` in your browser
2. Create the first admin account (prompted on first access)
3. Set a strong password — this account manages all users and server configuration

### Creating Your First User

1. In the admin panel, go to Users → Add
2. Set username and password
3. Set home directory (e.g., `/srv/sftpgo/data/username`)
4. Configure permissions (list, download, upload, delete, etc.)
5. Set quota if desired (0 = unlimited)
6. Save

### Testing SFTP Connection

```bash
sftp -P 2022 username@your-server-ip
```

## Configuration

### Enable WebDAV

WebDAV is configured via environment variables. The web client on port 8090 also provides WebDAV access:

```yaml
    environment:
      SFTPGO_WEBDAVD__BINDINGS__0__PORT: "8090"
      SFTPGO_WEBDAVD__BINDINGS__0__PREFIX: "/dav"
```

Mount as a WebDAV drive from any OS using `http://your-server-ip:8090/dav`.

### S3 Backend Storage

SFTPGo can use S3-compatible storage (including [Garage](/apps/garage)) as a backend:

```yaml
    environment:
      SFTPGO_DATA_PROVIDER__CREATE_DEFAULT_ADMIN: "true"
```

Configure S3 backends per-user through the admin panel: Users → Edit → Filesystem → S3 Compatible.

### External Authentication

SFTPGo supports LDAP, HTTP, and OS-based authentication. For LDAP:

```yaml
    environment:
      SFTPGO_PLUGINS__0__TYPE: auth
      SFTPGO_PLUGINS__0__AUTH_OPTIONS__SCOPE: 5
      SFTPGO_PLUGINS__0__CMD: /usr/local/bin/sftpgo-plugin-auth
```

### Two-Factor Authentication

Enable TOTP for the web client and admin panel:

```yaml
    environment:
      SFTPGO_MFA__TOTP__0__NAME: "SFTPGo"
      SFTPGO_MFA__TOTP__0__ISSUER: "selfhosting.sh"
      SFTPGO_MFA__TOTP__0__ALGO: sha1
```

Users configure TOTP through the web client interface.

## Reverse Proxy

For HTTPS access to the web UI and WebDAV, proxy ports 8080 (admin) and 8090 (client/WebDAV).

With [Nginx Proxy Manager](/apps/nginx-proxy-manager), create two proxy hosts — one for admin, one for the client interface. Enable WebSocket support for the web client.

SFTP (port 2022) and FTP (port 2121) cannot be reverse-proxied through HTTP proxies. Expose these ports directly.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

## Backup

SFTPGo has a built-in backup feature accessible from the admin panel (Settings → Backup).

For filesystem-level backup:

```bash
# Backup SFTPGo configuration and user data
docker compose exec sftpgo sftpgo backup --output /srv/sftpgo/backups/backup.json

# Volume backup
docker compose stop
tar czf sftpgo-backup-$(date +%Y%m%d).tar.gz \
  $(docker volume inspect sftpgo_sftpgo-data --format '{{ .Mountpoint }}') \
  $(docker volume inspect sftpgo_sftpgo-home --format '{{ .Mountpoint }}')
docker compose start
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### FTP Passive Mode Connection Fails

**Symptom:** FTP clients connect but fail on directory listing or file transfer.
**Fix:** Ensure `SFTPGO_FTPD__BINDINGS__0__FORCE_PASSIVE_IP` is set to your server's public IP. Also verify the passive port range (10000-10100) is open in your firewall.

### Permission Denied on Upload

**Symptom:** SFTP/FTP clients get "permission denied" when uploading.
**Fix:** Check the user's permissions in the admin panel. Ensure "upload" permission is granted. Also verify the home directory exists and the SFTPGo process has write access.

### Web Client Shows "Connection Refused"

**Symptom:** Admin panel works but the web client on port 8090 won't load.
**Fix:** Verify the WebDAV binding is configured. Check that port 8090 is mapped in Docker Compose and not blocked by a firewall.

### SSH Host Key Changes After Recreating Container

**Symptom:** SFTP clients show "host key verification failed" after container recreation.
**Fix:** SFTPGo generates host keys on first start. Store them persistently by mounting `/var/lib/sftpgo` — the `sftpgo-home` volume in the Compose file handles this. If keys were lost, clients must remove the old key from `~/.ssh/known_hosts`.

## Resource Requirements

- **RAM:** 50-100 MB idle, scales with concurrent connections
- **CPU:** Low — file transfer is I/O-bound, not CPU-bound
- **Disk:** Minimal for the application. User data storage depends on usage.

## Verdict

SFTPGo is the best self-hosted SFTP/FTP server available. It provides a proper multi-user file transfer server with a modern admin interface, quota management, and flexible storage backends. If you need to give users SFTP or FTP access with per-user home directories and permissions, SFTPGo is the answer.

For general file sync and sharing with mobile apps and desktop clients, [Nextcloud](/apps/nextcloud) or [Syncthing](/apps/syncthing) are better fits. SFTPGo excels when you specifically need SFTP/FTP/WebDAV protocols with centralized user management.

## FAQ

### Can I use SFTPGo as a Dropbox replacement?

Partially. SFTPGo provides file storage and sharing, but it doesn't have desktop sync clients. For full Dropbox replacement, use [Nextcloud](/apps/nextcloud) or [Seafile](/apps/seafile). SFTPGo works well alongside sync tools as a backend.

### Does SFTPGo support public file sharing?

Yes. Users can create share links through the web client interface. Shares can be password-protected and time-limited.

### Can I mount SFTPGo as a network drive?

Yes, via WebDAV. Windows, macOS, and Linux all support mounting WebDAV shares as network drives. Performance is generally better than SMB over the internet.

### How does SFTPGo compare to ProFTPD or vsftpd?

SFTPGo is significantly more feature-rich: web UI, virtual filesystems, S3 backends, per-user quotas, TOTP, and REST API. Traditional FTP servers offer raw performance but require manual configuration files and lack user management UIs.

## Related

- [How to Self-Host Nextcloud](/apps/nextcloud)
- [How to Self-Host Seafile](/apps/seafile)
- [How to Self-Host Syncthing](/apps/syncthing)
- [How to Self-Host FileBrowser](/apps/filebrowser)
- [Self-Hosted Alternatives to Google Drive](/replace/google-drive)
- [Best Self-Hosted File Sync Solutions](/best/file-sync)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

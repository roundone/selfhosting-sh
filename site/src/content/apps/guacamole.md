---
title: "How to Self-Host Apache Guacamole with Docker"
description: "Deploy Apache Guacamole with Docker Compose for clientless remote desktop access via RDP, VNC, and SSH in your browser."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - guacamole
tags:
  - self-hosted
  - guacamole
  - remote-desktop
  - docker
  - vnc
  - rdp
  - ssh
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Apache Guacamole?

Apache Guacamole is a clientless remote desktop gateway. It supports RDP, VNC, SSH, telnet, and Kubernetes connections — all accessible through a web browser. No plugins or client software needed. You open a URL, authenticate, and get a remote desktop session rendered in HTML5. It's the self-hosted replacement for jump boxes and commercial remote access tools.

[Official site: guacamole.apache.org](https://guacamole.apache.org)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space
- 1 GB of RAM (minimum)
- A domain name (recommended for HTTPS access)
- Target machines running RDP, VNC, or SSH that Guacamole will connect to

## Docker Compose Configuration

Guacamole has three components:
- **guacd** — the connection daemon that handles RDP/VNC/SSH protocols
- **guacamole** — the web application (Tomcat-based)
- **PostgreSQL** — stores users, connections, and session history

Create a directory and initialize the database schema:

```bash
mkdir -p guacamole/init
docker run --rm guacamole/guacamole:1.6.0 /opt/guacamole/bin/initdb.sh --postgresql > guacamole/init/initdb.sql
```

Create a `docker-compose.yml` file:

```yaml
services:
  guacd:
    container_name: guacd
    image: guacamole/guacd:1.6.0
    restart: unless-stopped
    volumes:
      - guacd-drive:/drive
      - guacd-record:/record
    networks:
      - guacamole

  postgres:
    container_name: guacamole-db
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: guacamole_db
      POSTGRES_USER: guacamole_user
      POSTGRES_PASSWORD: change-this-strong-password  # CHANGE THIS
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    networks:
      - guacamole

  guacamole:
    container_name: guacamole
    image: guacamole/guacamole:1.6.0
    restart: unless-stopped
    depends_on:
      - guacd
      - postgres
    environment:
      GUACD_HOSTNAME: guacd
      GUACD_PORT: "4822"
      POSTGRESQL_HOSTNAME: postgres
      POSTGRESQL_PORT: "5432"
      POSTGRESQL_DATABASE: guacamole_db
      POSTGRESQL_USER: guacamole_user
      POSTGRESQL_PASSWORD: change-this-strong-password  # MUST match postgres service
    ports:
      - "8080:8080"
    networks:
      - guacamole

networks:
  guacamole:
    driver: bridge

volumes:
  db-data:
  guacd-drive:
  guacd-record:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080/guacamole/` in your browser
2. Log in with the default credentials: **guacadmin** / **guacadmin**
3. **Change the default password immediately:** Go to Settings → Users → guacadmin → change password
4. Create a new admin user and delete or disable the default `guacadmin` account

### Adding Your First Connection

1. Go to Settings → Connections → New Connection
2. Set a name (e.g., "Office Desktop")
3. Select the protocol (RDP, VNC, or SSH)
4. Under Parameters, fill in:
   - **Hostname:** the target machine's IP
   - **Port:** default for the protocol (3389 for RDP, 5900 for VNC, 22 for SSH)
   - **Username/Password:** credentials for the target machine
5. Save and click the connection from the home screen to test it

## Configuration

### TOTP Two-Factor Authentication

Guacamole supports TOTP natively. Add the extension:

```yaml
  guacamole:
    environment:
      TOTP_ENABLED: "true"
```

After restarting, each user must scan a QR code on their next login.

### Recording Sessions

guacd can record sessions for audit purposes. The `guacd-record` volume stores recordings. Enable per-connection in the connection settings under "Screen Recording."

### File Transfer

For RDP connections, file transfer uses a virtual drive. The `guacd-drive` volume stores transferred files. Enable under the connection's "Device Redirection" settings.

### Custom Web Path

By default, Guacamole serves at `/guacamole/`. To serve at the root path:

```yaml
  guacamole:
    environment:
      WEBAPP_CONTEXT: ROOT
```

## Advanced Configuration (Optional)

### LDAP Authentication

Connect to an existing LDAP/Active Directory:

```yaml
  guacamole:
    environment:
      LDAP_HOSTNAME: ldap.example.com
      LDAP_PORT: "636"
      LDAP_ENCRYPTION_METHOD: ssl
      LDAP_USER_BASE_DN: ou=users,dc=example,dc=com
      LDAP_SEARCH_BIND_DN: cn=admin,dc=example,dc=com
      LDAP_SEARCH_BIND_PASSWORD: ldap-password
```

### OpenID Connect (SSO)

```yaml
  guacamole:
    environment:
      OPENID_AUTHORIZATION_ENDPOINT: https://auth.example.com/authorize
      OPENID_JWKS_ENDPOINT: https://auth.example.com/.well-known/jwks.json
      OPENID_ISSUER: https://auth.example.com
      OPENID_CLIENT_ID: guacamole
      OPENID_REDIRECT_URI: https://guac.example.com/guacamole/
```

## Reverse Proxy

Guacamole uses WebSockets for remote sessions. Your reverse proxy must support WebSocket passthrough.

When behind a reverse proxy, add:

```yaml
  guacamole:
    environment:
      REMOTE_IP_VALVE_ENABLED: "true"
```

For [Nginx Proxy Manager](/apps/nginx-proxy-manager), enable the "WebSockets Support" toggle on the proxy host.

For Nginx manually, add to the location block:

```nginx
proxy_buffering off;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $http_connection;
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

## Backup

Critical data to back up:
- **PostgreSQL database** — contains all users, connections, and history
- **guacd-drive** — file transfers
- **guacd-record** — session recordings (can be large)

```bash
# Database backup
docker compose exec postgres pg_dump -U guacamole_user guacamole_db > guacamole-backup.sql

# Volume backup
docker compose stop
tar czf guacamole-data-$(date +%Y%m%d).tar.gz \
  $(docker volume inspect guacamole_db-data --format '{{ .Mountpoint }}')
docker compose start
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Blank Screen After Login

**Symptom:** You log in but see no connections or a white page.
**Fix:** The database wasn't initialized. Verify the `init/initdb.sql` file exists and was mounted correctly. Check postgres logs:

```bash
docker compose logs postgres | grep -i error
```

If the database exists but tables are missing, reinitialize:

```bash
docker compose exec -T postgres psql -U guacamole_user guacamole_db < init/initdb.sql
```

### RDP Connection Fails With "Connection Closed"

**Symptom:** RDP connections drop immediately.
**Fix:** Check that the target machine has RDP enabled and the firewall allows port 3389. Also verify NLA (Network Level Authentication) settings — if NLA is required on the target, you must provide valid credentials in the Guacamole connection settings, not at the login screen.

### WebSocket Errors Behind Reverse Proxy

**Symptom:** Connection works briefly, then drops. Browser console shows WebSocket errors.
**Fix:** Your reverse proxy isn't passing WebSocket connections. Enable WebSocket support in your proxy configuration. See the Reverse Proxy section above.

### Slow VNC Performance

**Symptom:** VNC sessions are laggy or have visible compression artifacts.
**Fix:** In the connection settings, adjust the color depth and compression settings. For LAN connections, set "Color depth" to "True color (32-bit)" and disable JPEG compression.

### Cannot Log In After Password Change

**Symptom:** New password doesn't work.
**Fix:** Clear your browser cookies for the Guacamole URL. If locked out entirely, reset the password in the database:

```bash
docker compose exec postgres psql -U guacamole_user guacamole_db
# Then run SQL to reset the guacadmin password
```

## Resource Requirements

- **RAM:** 500 MB idle, 1-2 GB under load with multiple concurrent sessions
- **CPU:** Low-Medium — guacd does protocol translation which uses some CPU per active session
- **Disk:** 500 MB for the application, plus storage for session recordings if enabled

## Verdict

Apache Guacamole is the definitive self-hosted remote access gateway. Nothing else matches its protocol support (RDP, VNC, SSH, telnet, Kubernetes) delivered entirely through a browser with zero client installation. The setup is more involved than [RustDesk](/apps/rustdesk) — you need a database and three containers — but the payoff is a centralized, auditable gateway to all your remote machines.

Use Guacamole when you need browser-based access to multiple machines. Use [RustDesk](/apps/rustdesk) when you need peer-to-peer remote desktop with a native client.

## FAQ

### Does Guacamole require any browser plugins?

No. Guacamole uses HTML5 Canvas and WebSocket for rendering. It works in any modern browser without Flash, Java, or browser extensions.

### Can I use Guacamole with Tailscale or WireGuard?

Yes. Configure Guacamole connections to point at Tailscale/WireGuard IP addresses. This is a common pattern: access Guacamole through a VPN, then use it as a gateway to internal machines.

### How many concurrent sessions can Guacamole handle?

It depends on the protocol and server resources. Each RDP session uses 50-100 MB of RAM in guacd. A server with 4 GB of RAM can comfortably handle 20+ concurrent sessions.

### Is Guacamole secure enough for internet exposure?

With HTTPS, strong passwords, and TOTP enabled, yes. For extra security, put it behind [Authelia](/apps/authelia) or restrict access via a VPN like [Tailscale](/apps/tailscale) or [WireGuard](/apps/wireguard).

## Related

- [How to Self-Host RustDesk](/apps/rustdesk)
- [Self-Hosted Alternatives to TeamViewer](/replace/teamviewer)
- [Best Self-Hosted VPN Solutions](/best/vpn)
- [Tailscale Setup Guide](/apps/tailscale)
- [WireGuard Docker Setup](/apps/wireguard)
- [Authelia SSO Setup](/apps/authelia)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

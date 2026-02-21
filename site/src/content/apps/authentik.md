---
title: "How to Self-Host Authentik with Docker"
description: "Deploy Authentik — a full identity provider with SSO, SAML, LDAP, and user management. Complete Docker Compose setup with PostgreSQL."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - authentik
tags:
  - self-hosted
  - authentication
  - sso
  - identity-provider
  - authentik
  - docker
  - saml
  - ldap
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Authentik?

[Authentik](https://goauthentik.io/) is an open-source identity provider that serves as a self-hosted alternative to Okta, Auth0, and Azure AD. It provides SSO, 2FA, OIDC, SAML, LDAP, SCIM provisioning, user management, social login, enrollment flows, and a visual flow designer — all from a comprehensive web UI. It's the most feature-complete self-hosted identity platform available.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of free RAM (minimum)
- A domain name with HTTPS configured
- An SMTP server for email notifications (optional but recommended)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/authentik && cd /opt/authentik
```

Create a `.env` file with required secrets:

```bash
# Generate required secrets
PG_PASS=$(openssl rand -base64 36 | tr -d '\n')
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n')

cat > .env << EOF
# PostgreSQL
PG_PASS=${PG_PASS}

# Authentik
AUTHENTIK_SECRET_KEY=${AUTHENTIK_SECRET_KEY}

# Optional: Error reporting (set to true to help the project)
AUTHENTIK_ERROR_REPORTING__ENABLED=false

# Optional: Custom ports (defaults shown)
# COMPOSE_PORT_HTTP=9000
# COMPOSE_PORT_HTTPS=9443

# Optional: Email (uncomment and configure for notifications)
# AUTHENTIK_EMAIL__HOST=smtp.example.com
# AUTHENTIK_EMAIL__PORT=587
# AUTHENTIK_EMAIL__USERNAME=your-smtp-user
# AUTHENTIK_EMAIL__PASSWORD=your-smtp-password
# AUTHENTIK_EMAIL__USE_TLS=true
# AUTHENTIK_EMAIL__FROM=authentik@example.com
EOF
```

Create a `docker-compose.yml` file:

```yaml
services:
  postgresql:
    image: postgres:16-alpine
    container_name: authentik-db
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${PG_DB:-authentik}
      POSTGRES_USER: ${PG_USER:-authentik}
      POSTGRES_PASSWORD: ${PG_PASS:?database password required}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
    volumes:
      - database:/var/lib/postgresql/data
    networks:
      - authentik-net

  server:
    image: ghcr.io/goauthentik/server:2025.12.4
    container_name: authentik-server
    command: server
    restart: unless-stopped
    env_file:
      - .env
    environment:
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__NAME: ${PG_DB:-authentik}
      AUTHENTIK_POSTGRESQL__USER: ${PG_USER:-authentik}
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY:?secret key required}
    ports:
      - "${COMPOSE_PORT_HTTP:-9000}:9000"
      - "${COMPOSE_PORT_HTTPS:-9443}:9443"
    depends_on:
      postgresql:
        condition: service_healthy
    volumes:
      - ./data:/data
      - ./custom-templates:/templates
    networks:
      - authentik-net

  worker:
    image: ghcr.io/goauthentik/server:2025.12.4
    container_name: authentik-worker
    command: worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__NAME: ${PG_DB:-authentik}
      AUTHENTIK_POSTGRESQL__USER: ${PG_USER:-authentik}
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY:?secret key required}
    user: root
    depends_on:
      postgresql:
        condition: service_healthy
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/data
      - ./certs:/certs
      - ./custom-templates:/templates
    networks:
      - authentik-net

volumes:
  database:

networks:
  authentik-net:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Open the setup wizard** at `http://your-server-ip:9000/if/flow/initial-setup/` (trailing slash required)

2. **Create the admin account.** The default admin username is `akadmin`. Set a strong password. This account has full administrative access.

3. **Log in to the admin panel** at `http://your-server-ip:9000/if/admin/`

4. **Configure email** (recommended) — go to System → Tenants → Default and configure email settings. Without email, password reset and enrollment notifications won't work.

## Configuration

### Adding Applications

Applications in Authentik represent services you want to protect. To add one:

1. Go to **Applications → Applications → Create**
2. Set the name, slug, and provider
3. Create a provider matching your app's auth protocol:
   - **Proxy provider** — for forward-auth protection (similar to Authelia)
   - **OAuth2/OpenID provider** — for apps with OIDC support (Gitea, Grafana, Portainer)
   - **SAML provider** — for enterprise apps
   - **LDAP provider** — for legacy apps

### Proxy Provider (Forward Auth)

The proxy provider works like Authelia — it adds authentication to apps that don't have their own login. Configure it with your reverse proxy.

**For Traefik:**
1. Create a Proxy Provider in Authentik
2. Deploy an Authentik proxy outpost
3. Add Traefik middleware labels:
   ```yaml
   labels:
     - "traefik.http.middlewares.authentik.forwardAuth.address=http://authentik-server:9000/outpost.goauthentik.io/auth/traefik"
     - "traefik.http.middlewares.authentik.forwardAuth.trustForwardHeader=true"
     - "traefik.http.middlewares.authentik.forwardAuth.authResponseHeaders=X-authentik-username,X-authentik-groups,X-authentik-email"
   ```

**For Nginx:**
```nginx
location /outpost.goauthentik.io {
    proxy_pass http://authentik-server:9000/outpost.goauthentik.io;
    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
}

auth_request /outpost.goauthentik.io/auth/nginx;
```

### Social Login

Authentik supports social login out of the box — users can log in with Google, GitHub, Apple, Discord, and many more.

1. Go to **Directory → Federation & Social login**
2. Create a new source (e.g., GitHub OAuth)
3. Enter the OAuth client ID and secret from the provider
4. Map to an enrollment flow for new users

### User Management

Unlike Authelia, Authentik has a full user management UI:

- **Directory → Users** — create, edit, disable, delete users
- **Directory → Groups** — manage group memberships and permissions
- **Flows & Stages** — customize login, enrollment, and recovery flows visually
- **Events → Logs** — view authentication events and audit trails

## Advanced Configuration (Optional)

### LDAP Provider

Authentik can act as an LDAP server, allowing legacy applications that only support LDAP to authenticate against Authentik:

1. Create an LDAP provider in Applications → Providers
2. Deploy an LDAP outpost (via the Docker socket or manually)
3. Configure your apps to use `ldap://authentik-outpost:3389` as the LDAP server

### SCIM Provisioning

Authentik supports SCIM for automatic user provisioning to downstream apps. Configure in Applications → Providers → SCIM Provider.

### Custom Branding

Customize the login page with your logo, colors, and CSS:

1. Place custom files in the `./custom-templates/` directory
2. Override flow templates, email templates, or CSS
3. Configure tenant branding in System → Tenants

## Reverse Proxy

Route your domain to Authentik's HTTP port (9000) or HTTPS port (9443).

**Nginx Proxy Manager:** Create a proxy host pointing to `authentik-server:9000`.

**Caddy:**
```
auth.example.com {
    reverse_proxy authentik-server:9000
}
```

**Traefik:** Add labels to the server container:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.authentik.rule=Host(`auth.example.com`)"
  - "traefik.http.services.authentik.loadbalancer.server.port=9000"
```

See our [reverse proxy setup guide](/foundations/reverse-proxy-explained/).

## Backup

Critical data to back up:

1. **PostgreSQL database:**
```bash
docker compose exec postgresql pg_dump -U authentik authentik > authentik-backup.sql
```

2. **Data directory:**
```bash
tar czf authentik-data-backup.tar.gz data/
```

3. **Environment file** — contains your secret key. Without it, encrypted data cannot be recovered.
```bash
cp .env .env.backup
```

See our [backup strategy guide](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Initial setup page shows 404

**Symptom:** Navigating to `/if/flow/initial-setup/` returns a 404 error.
**Fix:** Ensure the trailing slash is included in the URL. Also verify the server container is healthy: `docker compose logs server`. The server needs PostgreSQL to be ready before it can serve the setup page.

### Worker container keeps restarting

**Symptom:** The worker container enters a restart loop.
**Fix:** Check logs with `docker compose logs worker`. Common causes: incorrect `AUTHENTIK_SECRET_KEY` (must match between server and worker), PostgreSQL not ready (check the healthcheck), or Docker socket permissions (`/var/run/docker.sock` must be readable by root).

### OIDC login fails with "invalid redirect URI"

**Symptom:** After authenticating, the app shows an invalid redirect error.
**Fix:** In your OAuth2/OpenID Provider settings, ensure the redirect URI matches exactly what the application sends — including the protocol (https://), path, and any trailing slashes.

### Outpost not connecting

**Symptom:** The proxy or LDAP outpost shows as disconnected in the admin panel.
**Fix:** Ensure the Docker socket is mounted on the worker container (`/var/run/docker.sock:/var/run/docker.sock`). The worker needs Docker access to manage outpost containers. If using a remote outpost, verify the outpost token and API URL.

### Login page shows "Something went wrong"

**Symptom:** The login page shows a generic error after upgrading.
**Fix:** Clear browser cookies and try again. If upgrading from a version before 2025.12, you may need to migrate storage from `./media` to `./data/media` — check the [release notes](https://docs.goauthentik.io/releases/2025.12).

## Resource Requirements

- **RAM:** ~1 GB idle (server + worker + PostgreSQL), ~1.5 GB under load
- **CPU:** Low-moderate (Python/Django backend)
- **Disk:** ~1.5 GB for images + database storage

## Verdict

Authentik is the most capable self-hosted identity provider. If you need SAML, SCIM, social login, user self-registration, or a visual flow designer, nothing else compares in the self-hosted space. It's heavier than [Authelia](/apps/authelia/) (~1 GB vs ~300 MB RAM) and more complex to set up, but the feature set justifies it for larger deployments or enterprise-adjacent use cases.

**Use Authentik if:** you need a full identity provider — OIDC + SAML + LDAP + user management + social login. It's the self-hosted Okta/Auth0.

**Use Authelia if:** you just want SSO + 2FA for your reverse-proxied apps and don't need SAML, SCIM, or a user management UI.

**Note:** Since version 2025.10, Authentik no longer requires Redis — only PostgreSQL is needed, reducing the container count from 4 to 3.

## FAQ

### Authentik vs Authelia — which should I use?

Authelia is lighter and simpler — it adds forward-auth SSO + 2FA to your reverse proxy. Authentik is a full identity provider with user management, SAML, SCIM, social login, and enrollment flows. For most homelabs, Authelia is sufficient. Choose Authentik when you need the full identity platform. See our [Authelia vs Authentik comparison](/compare/authelia-vs-authentik/).

### Can I use Authentik with Nginx Proxy Manager?

Yes. Create a proxy host in NPM pointing to the Authentik server container on port 9000. For forward-auth protection, configure the proxy outpost and add custom Nginx configuration to your protected proxy hosts.

### Does Authentik support passkeys?

Yes. Authentik supports WebAuthn for passwordless authentication, including passkeys. Users can register WebAuthn devices from their user settings page.

### Is the Docker socket mount safe?

The worker mounts `/var/run/docker.sock` to manage outpost containers automatically. This grants root-level access to the host Docker daemon. Mitigations: use a [Docker socket proxy](https://github.com/Tecnativa/docker-socket-proxy), or remove the mount and deploy outposts manually using separate Docker Compose files.

## Related

- [How to Self-Host Authelia](/apps/authelia/)
- [Authelia vs Authentik](/compare/authelia-vs-authentik/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [How to Self-Host Keycloak](/apps/keycloak/)
- [Two-Factor Authentication Guide](/foundations/two-factor-auth/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

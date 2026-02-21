---
title: "How to Self-Host Keycloak with Docker"
description: "Deploy Keycloak — an enterprise identity provider with SSO, OIDC, SAML, and user federation. Complete Docker Compose setup with PostgreSQL."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - keycloak
tags:
  - self-hosted
  - authentication
  - sso
  - identity-provider
  - keycloak
  - docker
  - saml
  - oidc
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Keycloak?

[Keycloak](https://www.keycloak.org/) is an open-source identity and access management platform maintained by Red Hat. It provides SSO, OIDC, SAML 2.0, LDAP/AD user federation, social login, multi-factor authentication, and fine-grained authorization — all through a comprehensive admin console. It's the most battle-tested self-hosted identity provider, widely used in enterprise environments. Keycloak replaces cloud identity services like Okta, Auth0, Azure AD, and AWS Cognito.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of free RAM minimum (Keycloak is a Java application — 4 GB recommended for production)
- 1 GB of free disk space
- A domain name with HTTPS configured
- A reverse proxy with SSL ([guide](/foundations/reverse-proxy-explained/))

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/keycloak && cd /opt/keycloak
```

Create a `docker-compose.yml` file:

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.5.3
    container_name: keycloak
    restart: unless-stopped
    command: start --optimized
    environment:
      # Admin credentials — change these immediately after first login
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: changeme-use-strong-password
      # Database connection
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: changeme-db-password
      # Hostname — set to your actual domain
      KC_HOSTNAME: auth.example.com
      # Proxy settings — required when behind a reverse proxy
      KC_PROXY_HEADERS: xforwarded
      KC_HTTP_ENABLED: "true"
      # Health and metrics
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"
    ports:
      - "8080:8080"   # HTTP
      - "9000:9000"   # Health/metrics
    volumes:
      - keycloak-import:/opt/keycloak/data/import
    depends_on:
      keycloak-db:
        condition: service_healthy
    networks:
      - keycloak-net
    deploy:
      resources:
        limits:
          memory: 2G

  keycloak-db:
    image: postgres:16-alpine
    container_name: keycloak-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: changeme-db-password
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - keycloak-net

volumes:
  keycloak-db-data:
  keycloak-import:

networks:
  keycloak-net:
```

Start the stack:

```bash
docker compose up -d
```

Keycloak takes 30-60 seconds to start (Java startup time). Monitor the logs:

```bash
docker compose logs -f keycloak
```

Wait for `Listening on: http://0.0.0.0:8080` before accessing the UI.

## Initial Setup

1. Open `http://your-server-ip:8080` (or your domain if reverse proxy is configured)
2. Log in with the admin credentials from `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD`
3. You're now in the **master** realm admin console
4. Create a new realm for your applications (don't use the master realm for app users):
   - Click the realm dropdown (top-left) → **Create realm**
   - Name it something like `homelab` or `selfhosted`
5. Change the admin password immediately: **Users** → select admin → **Credentials** → **Reset password**

## Configuration

### Creating a Realm

Realms are isolated tenant environments. Create one realm for your self-hosted apps:

1. **Realm settings** → **General** → set display name
2. **Realm settings** → **Login** → enable "User registration" if you want self-registration
3. **Realm settings** → **Email** → configure SMTP for password reset and verification emails

### Registering an Application (Client)

For each self-hosted app that supports OIDC:

1. **Clients** → **Create client**
2. **Client type**: OpenID Connect
3. **Client ID**: e.g., `nextcloud`, `portainer`, `grafana`
4. **Valid redirect URIs**: `https://app.example.com/callback` (check your app's docs for the exact callback path)
5. **Client authentication**: On (for confidential clients)
6. Copy the **Client secret** from the **Credentials** tab

### Adding Users

1. **Users** → **Add user**
2. Fill in username, email, first/last name
3. **Credentials** tab → **Set password** (toggle off "Temporary" if you don't want forced reset)

### Enabling Two-Factor Authentication

1. **Authentication** → **Flows** → **browser**
2. The default flow already includes OTP as optional
3. To make it required: set "OTP Form" to **Required**
4. Users will be prompted to configure TOTP on next login

## Advanced Configuration

### LDAP/Active Directory Federation

Keycloak can federate users from existing LDAP or Active Directory:

1. **User federation** → **Add LDAP provider**
2. Configure connection URL, bind DN, and search base
3. Keycloak imports users on first login or via periodic sync

### Social Login

Add Google, GitHub, GitLab, or other social login providers:

1. **Identity providers** → **Add provider**
2. Select the provider (Google, GitHub, etc.)
3. Enter client ID and secret from the provider's developer console
4. Keycloak automatically handles the OAuth flow

### Custom Themes

Mount custom themes to override the login page appearance:

```yaml
    volumes:
      - ./themes:/opt/keycloak/themes
```

### Realm Export/Import

Export your realm configuration for backup or migration:

```bash
docker compose exec keycloak /opt/keycloak/bin/kc.sh export --dir /opt/keycloak/data/import --realm homelab
```

Import on startup by adding `--import-realm` to the command:

```yaml
    command: start --optimized --import-realm
```

## Reverse Proxy

Keycloak requires specific reverse proxy configuration. For Nginx Proxy Manager or Caddy, point to port 8080 and ensure these headers are forwarded:

- `X-Forwarded-For`
- `X-Forwarded-Proto`
- `X-Forwarded-Host`

The `KC_PROXY_HEADERS: xforwarded` setting tells Keycloak to trust these headers.

For Caddy:

```
auth.example.com {
    reverse_proxy keycloak:8080
}
```

For more reverse proxy options, see our [Reverse Proxy Setup guide](/foundations/reverse-proxy-explained/).

## Backup

Back up these components:

1. **PostgreSQL database** — contains all users, realms, clients, and configuration:
   ```bash
   docker compose exec keycloak-db pg_dump -U keycloak keycloak > keycloak-backup.sql
   ```
2. **Import volume** — if you store realm exports there
3. **Custom themes** — if mounted

Restore the database:

```bash
docker compose exec -T keycloak-db psql -U keycloak keycloak < keycloak-backup.sql
```

For a comprehensive backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Keycloak won't start — "Failed to obtain JDBC connection"

**Symptom:** Keycloak exits immediately with database connection errors.
**Fix:** Ensure the PostgreSQL container is healthy before Keycloak starts. The `depends_on` with `condition: service_healthy` in the Compose file handles this. If it persists, verify `KC_DB_URL`, `KC_DB_USERNAME`, and `KC_DB_PASSWORD` match the PostgreSQL configuration exactly.

### "Invalid redirect URI" when logging into an app

**Symptom:** After entering credentials, you see "Invalid redirect URI" instead of being redirected to the app.
**Fix:** In the client settings, ensure the **Valid redirect URIs** field exactly matches the callback URL your app sends. Include the protocol (`https://`) and path. Use `*` only for development.

### Admin console loads but shows blank page

**Symptom:** The admin URL responds but the UI doesn't render.
**Fix:** This typically happens when `KC_HOSTNAME` doesn't match the URL you're accessing. Set `KC_HOSTNAME` to the exact domain you use in the browser.

### High memory usage

**Symptom:** Keycloak consumes all available memory.
**Fix:** Keycloak uses `-XX:MaxRAMPercentage=70` by default, meaning it'll use up to 70% of the container's memory limit. Always set a `deploy.resources.limits.memory` in your Compose file. 2 GB is the minimum; 4 GB is comfortable for a homelab with <100 users.

### Slow startup time

**Symptom:** Keycloak takes 2+ minutes to become available.
**Fix:** This is normal for the first start when using `start` mode (production). Keycloak optimizes itself on first boot. Subsequent restarts are faster. If you need faster dev iteration, use `start-dev` temporarily (never in production).

## Resource Requirements

- **RAM:** 512 MB minimum, 1-2 GB typical, 4 GB recommended for production
- **CPU:** Medium — Java-based, uses noticeable CPU during startup and under load
- **Disk:** 200 MB for the application, plus PostgreSQL data (grows with user count)

## Verdict

Keycloak is the gold standard for self-hosted identity management. If you need a full-featured identity provider with SAML, LDAP federation, fine-grained authorization, and enterprise-grade reliability, Keycloak is the answer. It's heavier than [Authelia](/apps/authelia/) (which just does forward-auth SSO) and more complex than [Authentik](/apps/authentik/) (which has a friendlier UI), but no other self-hosted IdP matches its protocol support and maturity. Choose Keycloak when you need the full enterprise feature set. Choose Authelia if you just want SSO + 2FA for your reverse proxy. Choose Authentik if you want a middle ground with a better UI.

## FAQ

### How does Keycloak compare to Authelia?

Different tools for different jobs. [Authelia](/apps/authelia/) is a lightweight forward-auth proxy that adds SSO and 2FA to services behind a reverse proxy. Keycloak is a full identity provider with OIDC, SAML, LDAP federation, and user management. Use Authelia for simple homelab auth. Use Keycloak when apps need OIDC/SAML integration. See our [Authelia vs Keycloak comparison](/compare/authelia-vs-keycloak/).

### How does Keycloak compare to Authentik?

Both are full identity providers. [Authentik](/apps/authentik/) has a more modern UI and visual flow designer. Keycloak has broader protocol support (SAML is more mature), enterprise features, and a larger ecosystem. See our [Authentik vs Keycloak comparison](/compare/authentik-vs-keycloak/).

### Can I use Keycloak with Nextcloud, Grafana, and Portainer?

Yes. All three support OIDC. Create a client in Keycloak for each app, configure the redirect URIs, and enter the client ID/secret in each app's SSO settings. This gives you single sign-on across all your self-hosted services.

### Is Keycloak overkill for a homelab?

For most homelabs with <10 services, yes — [Authelia](/apps/authelia/) or [Authentik](/apps/authentik/) are simpler choices. Keycloak makes sense when you need SAML support, LDAP federation, or manage 10+ applications with complex access policies.

## Related

- [How to Self-Host Authelia](/apps/authelia/)
- [How to Self-Host Authentik](/apps/authentik/)
- [Authelia vs Authentik](/compare/authelia-vs-authentik/)
- [Authelia vs Keycloak](/compare/authelia-vs-keycloak/)
- [Authentik vs Keycloak](/compare/authentik-vs-keycloak/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)

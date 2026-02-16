---
title: "How to Self-Host Authelia with Docker"
description: "Deploy Authelia — an SSO and 2FA authentication server for your self-hosted apps. Complete Docker Compose setup with Redis and PostgreSQL."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - authelia
tags:
  - self-hosted
  - authentication
  - sso
  - 2fa
  - authelia
  - docker
  - security
  - reverse-proxy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Authelia?

[Authelia](https://www.authelia.com/) is an open-source authentication and authorization server that adds single sign-on (SSO) and two-factor authentication (2FA) to your self-hosted services. It sits behind your reverse proxy and protects any web application with a login portal — even apps that have no built-in authentication. Authelia supports TOTP, WebAuthn (hardware keys), push notifications, and OpenID Connect. It replaces cloud SSO providers and adds a unified login layer to your entire homelab.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (Authelia + Redis + PostgreSQL)
- A reverse proxy (Nginx Proxy Manager, Traefik, or Caddy) — **required**
- A domain name with HTTPS and wildcard or per-app subdomains
- A working SMTP server for notifications (password reset, 2FA registration)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/authelia && cd /opt/authelia
mkdir -p config secrets
```

Create a `docker-compose.yml` file:

```yaml
services:
  authelia:
    image: authelia/authelia:4.39.15
    container_name: authelia
    restart: unless-stopped
    ports:
      - "127.0.0.1:9091:9091"
    environment:
      PUID: "1000"
      PGID: "1000"
      AUTHELIA_IDENTITY_VALIDATION_RESET_PASSWORD_JWT_SECRET_FILE: "/secrets/JWT_SECRET"
      AUTHELIA_SESSION_SECRET_FILE: "/secrets/SESSION_SECRET"
      AUTHELIA_STORAGE_ENCRYPTION_KEY_FILE: "/secrets/STORAGE_ENCRYPTION_KEY"
      AUTHELIA_STORAGE_POSTGRES_PASSWORD_FILE: "/secrets/STORAGE_PASSWORD"
    volumes:
      - ./config:/config
      - ./secrets:/secrets
    depends_on:
      redis:
        condition: service_started
      postgres:
        condition: service_started
    networks:
      - authelia-net

  redis:
    image: redis:7.4-alpine
    container_name: authelia-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - authelia-net

  postgres:
    image: postgres:16.6-alpine
    container_name: authelia-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: authelia
      POSTGRES_USER: authelia
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - authelia-net

volumes:
  redis_data:
  postgres_data:

networks:
  authelia-net:

secrets:
  db_password:
    file: ./secrets/STORAGE_PASSWORD
```

Generate the required secrets:

```bash
# Generate 4 random secrets
for f in JWT_SECRET SESSION_SECRET STORAGE_ENCRYPTION_KEY STORAGE_PASSWORD; do
  openssl rand -base64 48 | tr -d '=/+' | head -c 64 > secrets/$f
done
```

Create `config/configuration.yml`:

```yaml
# Authelia Configuration
theme: 'dark'

server:
  address: 'tcp://:9091/'

log:
  level: 'info'

totp:
  issuer: 'authelia.com'   # Change to your domain

# File-based authentication — simplest option
authentication_backend:
  file:
    path: '/config/users_database.yml'
    password:
      algorithm: 'argon2id'
      argon2:
        iterations: 3
        memory: 65536
        parallelism: 4
        salt_length: 16

access_control:
  default_policy: 'deny'
  rules:
    # Public access — no authentication required
    - domain: 'public.example.com'
      policy: 'bypass'

    # Single-factor auth — username + password
    - domain: '*.example.com'
      policy: 'one_factor'

    # Two-factor auth — for sensitive services
    - domain: 'vault.example.com'
      policy: 'two_factor'

    - domain: 'admin.example.com'
      policy: 'two_factor'
      subject:
        - 'group:admins'

session:
  name: 'authelia_session'
  same_site: 'lax'
  inactivity: '5m'
  expiration: '1h'
  remember_me: '1M'
  cookies:
    - domain: 'example.com'           # CHANGE to your domain
      authelia_url: 'https://auth.example.com'  # CHANGE to your Authelia URL
      default_redirection_url: 'https://www.example.com'  # CHANGE
  redis:
    host: 'redis'
    port: 6379

storage:
  postgres:
    address: 'tcp://postgres:5432'
    database: 'authelia'
    schema: 'public'
    username: 'authelia'

notifier:
  smtp:
    address: 'submission://smtp.example.com:587'   # CHANGE
    username: 'your-smtp-user'                      # CHANGE
    password: 'your-smtp-password'                  # CHANGE — use secrets file in production
    sender: 'Authelia <noreply@example.com>'        # CHANGE

identity_validation:
  reset_password:
    jwt_lifespan: '5m'
```

Create `config/users_database.yml`:

```yaml
users:
  admin:
    disabled: false
    displayname: 'Admin User'
    # Password: "changeme" — generate your own with the command below
    password: '$argon2id$v=19$m=65536,t=3,p=4$REPLACE_WITH_REAL_HASH'
    email: 'admin@example.com'
    groups:
      - 'admins'
```

Generate a password hash:

```bash
docker run --rm authelia/authelia:4.39.15 \
  authelia crypto hash generate argon2 --password 'YourStrongPassword'
```

Copy the output hash into the `users_database.yml` file, replacing the placeholder.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Configure your reverse proxy** to route `auth.example.com` to `localhost:9091`

2. **Set up forward authentication** in your reverse proxy. This is the critical step — your proxy must send authentication requests to Authelia before serving protected apps.

   **For Traefik:** Add middleware labels to protected services:
   ```yaml
   labels:
     - "traefik.http.middlewares.authelia.forwardAuth.address=http://authelia:9091/api/authz/forward-auth"
     - "traefik.http.middlewares.authelia.forwardAuth.trustForwardHeader=true"
     - "traefik.http.middlewares.authelia.forwardAuth.authResponseHeaders=Remote-User,Remote-Groups,Remote-Email,Remote-Name"
   ```

   **For Nginx Proxy Manager:** Add custom Nginx configuration for protected hosts:
   ```nginx
   location /authelia {
       internal;
       proxy_pass http://authelia:9091/api/authz/auth-request;
       proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
   }

   auth_request /authelia;
   ```

   **For Caddy:** Use the `forward_auth` directive:
   ```
   app.example.com {
       forward_auth authelia:9091 {
           uri /api/authz/forward-auth
           copy_headers Remote-User Remote-Groups Remote-Email Remote-Name
       }
       reverse_proxy app-container:port
   }
   ```

3. **Test the login** — visit a protected domain. You should be redirected to the Authelia login portal at `auth.example.com`.

4. **Set up 2FA** — after logging in, follow the prompt to register a TOTP device (scan QR code with your authenticator app).

## Configuration

### Adding Users

Edit `config/users_database.yml` and add new user entries. Generate password hashes with the `authelia crypto hash generate` command shown above.

Alternatively, enable the `watch` option to auto-reload the file:

```yaml
authentication_backend:
  file:
    path: '/config/users_database.yml'
    watch: true
```

### Access Control Policies

Authelia supports four policy levels:

| Policy | Requires |
|--------|----------|
| `bypass` | No authentication |
| `one_factor` | Username + password |
| `two_factor` | Username + password + TOTP/WebAuthn |
| `deny` | Block all access |

Define rules in `access_control.rules` — they're evaluated top-to-bottom, first match wins.

### LDAP Authentication (Alternative)

For larger deployments, replace the file backend with LDAP:

```yaml
authentication_backend:
  ldap:
    address: 'ldap://openldap:389'
    base_dn: 'dc=example,dc=com'
    username_attribute: 'uid'
    additional_users_dn: 'ou=users'
    additional_groups_dn: 'ou=groups'
    user: 'cn=admin,dc=example,dc=com'
    password: 'ldap-admin-password'
```

## Advanced Configuration (Optional)

### OpenID Connect Provider

Authelia can act as an OIDC provider for apps that support it (Gitea, Portainer, Grafana):

```yaml
identity_providers:
  oidc:
    hmac_secret: 'generate-a-secret'
    jwks:
      - key_id: 'main'
        use: 'sig'
        key: |
          -----BEGIN RSA PRIVATE KEY-----
          ... (generate with openssl)
          -----END RSA PRIVATE KEY-----
    clients:
      - client_id: 'gitea'
        client_name: 'Gitea'
        client_secret: '$pbkdf2-sha512$...'
        redirect_uris:
          - 'https://git.example.com/user/oauth2/authelia/callback'
        scopes:
          - 'openid'
          - 'profile'
          - 'email'
          - 'groups'
```

### WebAuthn (Hardware Keys)

Authelia supports WebAuthn for hardware security keys (YubiKey, etc.) as a second factor. Users can register WebAuthn devices from the 2FA setup page after logging in.

## Reverse Proxy

Authelia **requires** a reverse proxy — it doesn't serve applications itself. It acts as a middleware that your proxy checks before serving protected content.

Supported proxies: Traefik, Nginx, Nginx Proxy Manager, Caddy, HAProxy, Envoy.

See the [Authelia integration docs](https://www.authelia.com/integration/proxies/) for proxy-specific configuration. Also see our [reverse proxy setup guide](/foundations/reverse-proxy-explained).

## Backup

Critical data to back up:

1. **PostgreSQL database:**
```bash
docker compose exec postgres pg_dump -U authelia authelia > authelia-backup.sql
```

2. **Configuration files:**
```bash
tar czf authelia-config-backup.tar.gz config/ secrets/
```

3. **Secrets files** — without these, Authelia can't decrypt session data or storage.

See our [backup strategy guide](/foundations/backup-3-2-1-rule).

## Troubleshooting

### "Access Denied" for all domains

**Symptom:** Every domain returns a deny response, even ones with `bypass` or `one_factor` rules.
**Fix:** Check your `access_control.rules` — rules are evaluated top-to-bottom. Ensure the `domain` values match exactly (including wildcards). Verify `default_policy` isn't overriding your rules. Check that the session cookie domain matches your apps' domain.

### 2FA registration fails

**Symptom:** Clicking "Register device" doesn't send a notification.
**Fix:** Verify SMTP configuration. Check Authelia logs: `docker compose logs authelia | grep -i smtp`. The notifier must be working for 2FA device registration.

### Redirect loop between proxy and Authelia

**Symptom:** Browser shows "too many redirects."
**Fix:** Ensure the Authelia portal URL (`auth.example.com`) is set to `bypass` in access control rules — it cannot require authentication itself. Also verify your reverse proxy forwards the correct headers (`X-Forwarded-For`, `X-Forwarded-Proto`, `X-Original-URL`).

### Session not persisting across subdomains

**Symptom:** You have to log in separately for each subdomain.
**Fix:** The session cookie domain must be set to your base domain (`.example.com`, not `auth.example.com`). Check the `session.cookies[].domain` setting.

## Resource Requirements

- **RAM:** ~300 MB idle (Authelia + Redis + PostgreSQL), ~500 MB under load
- **CPU:** Low
- **Disk:** ~500 MB for application + database

## Verdict

Authelia is the best self-hosted authentication layer for protecting web applications. It's lighter than Authentik, simpler to configure than Keycloak, and integrates cleanly with every major reverse proxy. Use it to add SSO and 2FA to apps that don't have their own authentication, or to create a unified login for your entire homelab. The main complexity is reverse proxy integration — once that's working, everything else is straightforward.

**Note:** Authelia is an authentication proxy, not a password manager. It protects access to your web apps. For storing and managing passwords, use [Vaultwarden](/apps/vaultwarden) or [Passbolt](/apps/passbolt).

## FAQ

### What's the difference between Authelia and a password manager?

Authelia protects access to web applications by requiring authentication before serving content. A password manager (Vaultwarden, Passbolt) stores your login credentials. They complement each other — use Authelia to protect your self-hosted apps, and a password manager to store the credentials you use to log in.

### Can Authelia protect apps without built-in login?

Yes. That's its primary use case. Any web application served behind a compatible reverse proxy can be protected by Authelia, even if the app has no authentication of its own.

### Authelia vs Authentik — which should I use?

Authelia is lighter and simpler — perfect for protecting web apps with forward auth. Authentik is heavier but more feature-rich — it's a full identity provider with user management UI, SCIM provisioning, and extensive OIDC/SAML support. For most homelabs, Authelia is sufficient. See our [Authelia vs Authentik comparison](/compare/authelia-vs-authentik).

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden)
- [Authelia vs Authentik](/compare/authelia-vs-authentik)
- [Best Self-Hosted Password Managers](/best/password-management)
- [How to Self-Host Traefik](/apps/traefik)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [SSL Certificates](/foundations/ssl-certificates)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Security Basics](/foundations/firewall-ufw)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

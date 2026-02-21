---
title: "SSO for Self-Hosted Services"
description: "Set up single sign-on for self-hosted services with Authelia, Authentik, or Keycloak — protocols, Docker Compose configs, and reverse proxy integration."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps:
  - authelia
  - authentik
  - keycloak
tags: ["foundations", "sso", "authentication", "oidc", "saml", "authelia", "authentik", "keycloak"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SSO?

Single sign-on (SSO) lets you authenticate once and access multiple self-hosted services without logging in again. Instead of managing separate credentials for Nextcloud, Gitea, Jellyfin, and every other app on your server, SSO for self-hosted services gives you one login that works everywhere.

SSO works by placing an identity provider (IdP) between your users and your applications. When you visit an app, it redirects you to the IdP. You authenticate there — with a password, a TOTP code, a hardware key — and the IdP issues a token that proves your identity to every connected application.

For self-hosters running five or more services, SSO eliminates password fatigue and centralizes access control. You add a user once, assign them to groups, and every connected app respects those permissions. When someone leaves, you disable one account instead of hunting through a dozen admin panels.

## Prerequisites

- A Linux server with [Docker and Docker Compose](/foundations/docker-compose-basics/) installed
- A [reverse proxy](/foundations/reverse-proxy-explained/) (Traefik, Nginx Proxy Manager, or Caddy) — SSO requires HTTP header forwarding
- A domain name with [SSL certificates](/foundations/ssl-certificates/) configured — SSO cookies require HTTPS
- Basic familiarity with [Docker networking](/foundations/docker-networking/)
- DNS records pointing your SSO subdomain (e.g., `auth.example.com`) to your server

## Authentication vs. Authorization

These terms get conflated constantly. They are different things.

**Authentication** answers "Who are you?" It verifies identity — checking a password, validating a TOTP code, or confirming a hardware key. The output is proof that you are who you claim to be.

**Authorization** answers "What can you do?" It checks permissions after identity is established — can this user access this app? Can they edit settings or just view? Are they in the admin group?

SSO handles both. The identity provider authenticates you, then passes identity claims (username, email, groups) to the application. The application uses those claims for authorization decisions. Authelia's access control rules are a good example — you define which users or groups can reach which subdomains.

## SSO Protocols

Three protocols dominate the self-hosting SSO space. You need to understand what each does to pick the right tool and configure it correctly.

### OpenID Connect (OIDC)

OIDC is the modern standard and the one you should default to. It is built on top of OAuth 2.0 and adds an identity layer. When an app supports "Login with Google" or "Login with GitHub," it is using OIDC.

How it works: your app redirects the user to the IdP's authorization endpoint. The user authenticates. The IdP redirects back to the app with an authorization code. The app exchanges that code for an ID token (a signed JWT containing user claims like email, name, and groups).

Most actively maintained self-hosted apps support OIDC. Nextcloud, Gitea, Grafana, Portainer, Outline, and many others have native OIDC support. If an app offers OIDC, use it over SAML or LDAP.

### SAML 2.0

SAML is the enterprise predecessor to OIDC. It uses XML assertions instead of JSON tokens and is significantly more complex to configure. The flow is similar — redirect to IdP, authenticate, redirect back with an assertion — but the XML-based message format makes debugging painful.

You will encounter SAML when integrating with enterprise apps or legacy systems that predate OIDC adoption. If an app supports both OIDC and SAML, choose OIDC every time.

### LDAP

LDAP is not an SSO protocol — it is a directory protocol. But it is essential for SSO because it serves as the user backend. Your IdP authenticates users against an LDAP directory, then issues OIDC or SAML tokens to applications.

LDAP provides centralized user and group management. You define users once in the directory, and every connected service (both OIDC-capable apps and legacy apps that only support LDAP directly) can query it. See [LDAP Basics](/foundations/ldap-basics/) for a detailed setup guide.

### Forward Auth (Proxy-Level SSO)

Some apps have no native SSO support at all — no OIDC, no SAML, no LDAP. For these, forward authentication at the reverse proxy level is the solution. Your reverse proxy checks with the IdP before passing the request to the app. If the user is not authenticated, they get redirected to the login portal.

This is how Authelia and Authentik protect apps that have no built-in authentication. It works at the HTTP level — the proxy either forwards the request or blocks it. The app never sees unauthenticated traffic.

## Self-Hosted SSO Providers Compared

Three providers cover the full spectrum of self-hosting needs. Pick based on your complexity requirements.

### Authelia — Best for Most Self-Hosters

[Authelia](https://www.authelia.com/) is a lightweight authentication server written in Go. It provides forward auth, OIDC, and two-factor authentication through a clean web portal. It runs in a single container, uses minimal resources (under 50 MB RAM), and integrates tightly with Traefik, Nginx Proxy Manager, and Caddy.

Authelia stores users in a flat YAML file or queries an LDAP backend. For most home server setups with one to five users, the YAML file backend is simpler and works fine. For larger deployments, pair it with [LLDAP](/foundations/ldap-basics/) as the directory backend.

**Choose Authelia if:** You run a home server or small lab, want SSO with minimal overhead, and your apps either support OIDC or need forward auth protection.

### Authentik — Best for Advanced Setups

[Authentik](https://goauthentik.io/) is a full identity provider supporting OIDC, SAML 2.0, LDAP (as both consumer and provider), RADIUS, and SCIM. It has a polished web UI for managing users, groups, applications, and authentication flows. It runs multiple containers (server, worker, PostgreSQL, Redis) and needs around 1 GB of RAM.

Authentik's flow system is its standout feature. You can build custom authentication pipelines — require MFA for external access but skip it on the local network, prompt for email verification on signup, add approval steps for new accounts. This flexibility comes with complexity.

**Choose Authentik if:** You need SAML support, want a visual flow editor, manage more than ten users, or need features like SCIM provisioning and invitation links.

### Keycloak — Best for Enterprise

[Keycloak](https://www.keycloak.org/) is Red Hat's enterprise-grade identity and access management platform. It supports everything — OIDC, SAML 2.0, LDAP/AD federation, user federation, fine-grained authorization, custom authentication flows, and more. It is Java-based and needs 512 MB to 1 GB of RAM minimum.

Keycloak is the most feature-complete option but also the most complex. Its admin console has a steep learning curve. Configuration is spread across realms, clients, mappers, and authentication flows. It is overkill for a homelab running ten services.

**Choose Keycloak if:** You are running a production environment, need Active Directory integration, require advanced authorization policies, or are already familiar with the Keycloak ecosystem.

### Quick Comparison

| Feature | Authelia | Authentik | Keycloak |
|---------|----------|-----------|----------|
| OIDC support | Yes | Yes | Yes |
| SAML support | No | Yes | Yes |
| Forward auth | Yes (primary use case) | Yes | Via plugins |
| LDAP backend | Yes (consumer) | Yes (provider + consumer) | Yes (federation) |
| 2FA (TOTP/WebAuthn) | Yes | Yes | Yes |
| RAM usage | ~30-50 MB | ~800 MB-1 GB | ~512 MB-1 GB |
| Containers required | 1 (+ optional Redis) | 4 (server, worker, PostgreSQL, Redis) | 1-2 (+ PostgreSQL) |
| User management UI | Basic | Polished | Complex |
| Custom auth flows | Access control rules | Visual flow editor | Authentication flows |
| Best for | Home servers, small labs | Medium deployments | Enterprise, AD environments |

## Setting Up Authelia with Docker Compose

Authelia is the right choice for most self-hosters. This section walks through a complete, functional deployment.

### Directory Structure

Create a directory for your Authelia stack:

```bash
mkdir -p /opt/authelia/{config,secrets}
```

The final structure:

```
/opt/authelia/
  docker-compose.yml
  .env
  config/
    configuration.yml
    users.yml
  secrets/
```

### Docker Compose Configuration

Create `/opt/authelia/docker-compose.yml`:

```yaml
services:
  authelia:
    image: authelia/authelia:4.39.15
    container_name: authelia
    volumes:
      - ./config:/config
    ports:
      - "9091:9091"
    environment:
      TZ: "America/New_York"
      AUTHELIA_JWT_SECRET: "${AUTHELIA_JWT_SECRET}"
      AUTHELIA_SESSION_SECRET: "${AUTHELIA_SESSION_SECRET}"
      AUTHELIA_STORAGE_ENCRYPTION_KEY: "${AUTHELIA_STORAGE_ENCRYPTION_KEY}"
    healthcheck:
      test: ["CMD", "authelia", "healthcheck"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  redis:
    image: redis:7.4-alpine
    container_name: authelia-redis
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  redis-data:
```

### Environment Variables

Create `/opt/authelia/.env`:

```bash
# Generate each of these with: openssl rand -base64 64
# These MUST be unique, long, random strings

# Signs password reset and identity verification JWTs
AUTHELIA_JWT_SECRET=CHANGE_ME_generate_with_openssl_rand_base64_64

# Encrypts session cookies
AUTHELIA_SESSION_SECRET=CHANGE_ME_generate_with_openssl_rand_base64_64

# Encrypts data at rest in the SQLite database
AUTHELIA_STORAGE_ENCRYPTION_KEY=CHANGE_ME_generate_with_openssl_rand_base64_64
```

Generate real secrets before starting:

```bash
# Run this three times, paste each output into .env
openssl rand -base64 64
```

### Authelia Configuration

Create `/opt/authelia/config/configuration.yml`:

```yaml
# Authelia configuration — selfhosting.sh
# Docs: https://www.authelia.com/configuration/

# -- Server --
server:
  address: "tcp://0.0.0.0:9091"

# -- Logging --
log:
  level: "info"
  # Set to "debug" when troubleshooting, revert to "info" in production

# -- TOTP 2FA --
totp:
  issuer: "auth.example.com"
  # This name appears in your authenticator app

# -- Authentication Backend --
# File-based is simplest for 1-5 users. For more, use LDAP.
authentication_backend:
  file:
    path: "/config/users.yml"
    password:
      algorithm: "argon2id"
      iterations: 3
      memory: 65536
      parallelism: 4
      salt_length: 16
      key_length: 32

# -- Access Control --
# default_policy: deny — block everything unless explicitly allowed
access_control:
  default_policy: "deny"
  rules:
    # Public endpoints (no auth required)
    - domain: "public.example.com"
      policy: "bypass"

    # Require 2FA for sensitive services
    - domain: "vaultwarden.example.com"
      policy: "two_factor"

    # Require at least a password for other services
    - domain: "*.example.com"
      policy: "one_factor"

# -- Session --
session:
  name: "authelia_session"
  # same_site: "lax" is the default and correct for most setups
  cookies:
    - domain: "example.com"
      authelia_url: "https://auth.example.com"
      # Set to your root domain — covers all subdomains

  redis:
    host: "authelia-redis"
    port: 6379

# -- Storage --
# SQLite for small deployments. Switch to PostgreSQL for 10+ users.
storage:
  local:
    path: "/config/db.sqlite3"

# -- Notifier --
# Sends password reset and 2FA registration emails.
# File notifier writes to disk (dev/testing). Use SMTP for production.
notifier:
  filesystem:
    filename: "/config/notification.txt"
  # For production, replace the filesystem block with:
  # smtp:
  #   address: "submissions://smtp.example.com:465"
  #   username: "admin@example.com"
  #   password: "your-smtp-password"
  #   sender: "Authelia <auth@example.com>"
```

Replace every instance of `example.com` with your actual domain.

### User Database

Create `/opt/authelia/config/users.yml`:

```yaml
users:
  admin:
    disabled: false
    displayname: "Admin User"
    email: "admin@example.com"
    # Generate with: docker run --rm authelia/authelia:4.39.15 authelia crypto hash generate argon2 --password 'YOUR_PASSWORD'
    password: "$argon2id$v=19$m=65536,t=3,p=4$YOUR_HASH_HERE"
    groups:
      - "admins"
      - "users"
```

Generate a password hash before starting:

```bash
docker run --rm authelia/authelia:4.39.15 \
  authelia crypto hash generate argon2 \
  --password 'your-secure-password'
```

Copy the output hash into the `password` field.

### Start the Stack

```bash
cd /opt/authelia
docker compose up -d
docker compose logs -f authelia
```

Watch the logs for errors. Authelia should start and report listening on port 9091. Access the portal at `http://your-server-ip:9091`. In production, you will access it through your reverse proxy over HTTPS.

## Integrating with a Reverse Proxy

SSO only works behind a reverse proxy that handles HTTPS and forwards authentication headers. Authelia acts as a forward authentication middleware — the proxy asks Authelia "is this user allowed?" before serving the request.

### Traefik Integration

Traefik has first-class support for forward auth middleware. Add these labels to your Authelia container in `docker-compose.yml`:

```yaml
services:
  authelia:
    image: authelia/authelia:4.39.15
    container_name: authelia
    volumes:
      - ./config:/config
    environment:
      TZ: "America/New_York"
      AUTHELIA_JWT_SECRET: "${AUTHELIA_JWT_SECRET}"
      AUTHELIA_SESSION_SECRET: "${AUTHELIA_SESSION_SECRET}"
      AUTHELIA_STORAGE_ENCRYPTION_KEY: "${AUTHELIA_STORAGE_ENCRYPTION_KEY}"
    labels:
      - "traefik.enable=true"
      # Authelia's own web UI
      - "traefik.http.routers.authelia.rule=Host(`auth.example.com`)"
      - "traefik.http.routers.authelia.entrypoints=websecure"
      - "traefik.http.routers.authelia.tls.certresolver=letsencrypt"
      # Forward auth middleware — other services reference this
      - "traefik.http.middlewares.authelia.forwardAuth.address=http://authelia:9091/api/authz/forward-auth"
      - "traefik.http.middlewares.authelia.forwardAuth.trustForwardHeader=true"
      - "traefik.http.middlewares.authelia.forwardAuth.authResponseHeaders=Remote-User,Remote-Groups,Remote-Name,Remote-Email"
    healthcheck:
      test: ["CMD", "authelia", "healthcheck"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 60s
    restart: unless-stopped
```

Then protect any service by adding this label to its container:

```yaml
labels:
  - "traefik.http.routers.myapp.middlewares=authelia@docker"
```

Every request to that service now goes through Authelia first. Unauthenticated users see the Authelia login portal. Authenticated users pass through transparently.

For a complete Traefik setup, see [Traefik Reverse Proxy Setup](/foundations/traefik-setup/).

### Nginx Proxy Manager Integration

Nginx Proxy Manager does not have native forward auth middleware like Traefik. You add it through custom Nginx configuration on each proxy host.

In the Nginx Proxy Manager UI, edit the proxy host for the service you want to protect. Go to the **Advanced** tab and add:

```nginx
location /authelia {
    internal;
    set $upstream_authelia http://authelia:9091/api/authz/auth-request;
    proxy_pass $upstream_authelia;
    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Forwarded-Method $request_method;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-URI $request_uri;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Content-Length "";
    proxy_set_header Connection "";
}

auth_request /authelia;
auth_request_set $target_url $scheme://$http_host$request_uri;
auth_request_set $user $upstream_http_remote_user;
auth_request_set $groups $upstream_http_remote_groups;
auth_request_set $name $upstream_http_remote_name;
auth_request_set $email $upstream_http_remote_email;

error_page 401 =302 https://auth.example.com/?rd=$target_url;

proxy_set_header Remote-User $user;
proxy_set_header Remote-Groups $groups;
proxy_set_header Remote-Name $name;
proxy_set_header Remote-Email $email;
```

Replace `auth.example.com` with your Authelia domain. The Authelia container must be on the same Docker network as Nginx Proxy Manager.

For a complete Nginx Proxy Manager setup, see [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/).

## Practical Examples

### Protecting a Service Without Native SSO

Many self-hosted dashboards and tools have no built-in authentication at all. Forward auth solves this. For example, to protect [Homepage](https://gethomepage.dev/) behind Authelia with Traefik:

```yaml
services:
  homepage:
    image: ghcr.io/gethomepage/homepage:v0.10.9
    container_name: homepage
    volumes:
      - ./homepage-config:/app/config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.homepage.rule=Host(`home.example.com`)"
      - "traefik.http.routers.homepage.entrypoints=websecure"
      - "traefik.http.routers.homepage.tls.certresolver=letsencrypt"
      - "traefik.http.routers.homepage.middlewares=authelia@docker"
    restart: unless-stopped
```

The single `middlewares=authelia@docker` label does all the work. No authentication code in the app. No exposed ports. Just proxy-level enforcement.

### OIDC Integration with a Native App

Apps that support OIDC natively are better off using it directly instead of forward auth. OIDC gives the app user identity information — who logged in, what groups they belong to — which forward auth cannot always provide at the application level.

Authelia supports acting as an OIDC provider. Add this to your `configuration.yml`:

```yaml
identity_providers:
  oidc:
    # Generate with: openssl rand -base64 32
    hmac_secret: "your-hmac-secret-here"
    jwks:
      - key_id: "main"
        # Generate with: docker run --rm authelia/authelia:4.39.15 authelia crypto pair rsa generate --directory /config
        key: |
          -----BEGIN RSA PRIVATE KEY-----
          ... your private key here ...
          -----END RSA PRIVATE KEY-----
    clients:
      - client_id: "gitea"
        client_name: "Gitea"
        client_secret: "$pbkdf2-sha512$310000$YOUR_HASHED_SECRET"
        # Hash with: docker run --rm authelia/authelia:4.39.15 authelia crypto hash generate pbkdf2 --password 'your-client-secret'
        redirect_uris:
          - "https://gitea.example.com/user/oauth2/authelia/callback"
        scopes:
          - "openid"
          - "profile"
          - "groups"
          - "email"
        authorization_policy: "two_factor"
```

Then in Gitea's settings, configure the OAuth2 provider with Authelia's endpoints:

- **Authorization URL:** `https://auth.example.com/api/oidc/authorization`
- **Token URL:** `https://auth.example.com/api/oidc/token`
- **User Info URL:** `https://auth.example.com/api/oidc/userinfo`
- **Client ID:** `gitea`
- **Client Secret:** the unhashed secret you used before hashing

### Group-Based Access Control

Authelia's access control rules support group-based policies. Define groups in `users.yml`, then reference them in `configuration.yml`:

```yaml
# In users.yml
users:
  alice:
    # ... user fields ...
    groups: ["admins", "users"]
  bob:
    # ... user fields ...
    groups: ["users"]

# In configuration.yml — access_control section
access_control:
  default_policy: "deny"
  rules:
    - domain: "admin.example.com"
      policy: "two_factor"
      subject:
        - "group:admins"
    - domain: "*.example.com"
      policy: "one_factor"
      subject:
        - "group:users"
```

Alice can access `admin.example.com` (with 2FA) and all other subdomains. Bob can access all subdomains except admin. Users not in either group are denied entirely.

## Common Mistakes

### Forgetting to Set Cookie Domain Correctly

The session cookie domain in Authelia's `configuration.yml` must match your root domain, not a subdomain. If your apps live at `app1.example.com` and `app2.example.com`, the cookie domain must be `example.com` — not `auth.example.com`. A wrong cookie domain means SSO tokens do not carry across subdomains and every app prompts for login separately, defeating the entire purpose.

### Running SSO Without HTTPS

SSO session cookies have the `Secure` flag set by default, meaning browsers will not send them over plain HTTP. If you skip SSL and try to run Authelia on HTTP, authentication will appear to work at the login portal but cookies will never arrive at protected apps. Always terminate TLS at your reverse proxy. See [SSL Certificates](/foundations/ssl-certificates/) for setup instructions.

### Using the Filesystem Notifier in Production

The filesystem notifier writes password reset links and 2FA registration URLs to a text file instead of emailing them. This is fine for testing. In production, you will not be watching log files for password reset links. Configure SMTP in your `configuration.yml` and test that emails send correctly before going live.

### Not Generating Unique Secrets

Every secret in Authelia's configuration (`jwt_secret`, `session_secret`, `storage_encryption_key`, OIDC `hmac_secret`) must be unique, long, and random. Using the same value for multiple secrets or using short predictable strings undermines the entire security model. Generate each one separately with `openssl rand -base64 64`.

### Skipping 2FA for Sensitive Services

Forward auth with `one_factor` policy means a stolen password gives access to everything. At minimum, set `two_factor` policy for password managers ([Vaultwarden](/apps/vaultwarden/)), admin panels, and anything with access to personal data. The overhead of tapping a TOTP code is trivial compared to the risk. See [Two-Factor Authentication](/foundations/two-factor-auth/) for setup details.

### Docker Network Misconfiguration

Authelia must be on the same Docker network as both the reverse proxy and the services it protects. If Authelia is on network A and your app is on network B, the reverse proxy cannot reach Authelia for forward auth verification and every request returns a 500 or 401 error. When running multiple Compose files, use an external Docker network that all stacks join. See [Docker Networking](/foundations/docker-networking/) for network configuration details.

## FAQ

### Can I use SSO with apps that have no authentication support?

Yes. Forward authentication at the reverse proxy level protects any HTTP service, regardless of whether the app itself has login support. The reverse proxy checks with Authelia before passing the request. The app never sees unauthenticated traffic. This is one of Authelia's primary use cases.

### Do I need LDAP to use Authelia?

No. Authelia supports a file-based user database (`users.yml`) that works well for one to five users. You define usernames, password hashes, emails, and groups directly in YAML. LDAP is only needed if you want centralized user management across many services that query the directory independently, or if you manage more than a handful of users.

### What happens if Authelia goes down?

If Authelia is unreachable, forward auth requests fail and the reverse proxy returns an error (usually 500 or 502) for all protected services. Unprotected services and services with `bypass` policy continue working. Set `restart: unless-stopped` on the Authelia container, use the built-in health check, and consider monitoring it with [Uptime Kuma](/apps/uptime-kuma/). Authelia is lightweight and stable — crashes are rare.

### Can I migrate from Authelia to Authentik later?

Yes, but it is not a one-click migration. You will need to recreate users in Authentik, reconfigure OIDC client registrations, and update your reverse proxy middleware configuration. If you use LDAP as the user backend for Authelia, migrating is simpler because Authentik can connect to the same LDAP directory. Plan the migration during a maintenance window.

### How is forward auth different from OIDC?

Forward auth operates at the reverse proxy level — the proxy asks Authelia "should I allow this request?" before forwarding it. The protected app has no idea SSO exists. OIDC operates at the application level — the app itself redirects users to the IdP, receives tokens, and makes authorization decisions using the identity claims in those tokens. OIDC is more capable (the app knows who the user is), but forward auth works with any HTTP service regardless of its built-in auth support.

## Related

- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Security Hardening](/foundations/security-hardening/)
- [Two-Factor Authentication](/foundations/two-factor-auth/)
- [LDAP Basics](/foundations/ldap-basics/)
- [Traefik Reverse Proxy Setup](/foundations/traefik-setup/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [Docker Networking](/foundations/docker-networking/)
- [Vaultwarden](/apps/vaultwarden/)

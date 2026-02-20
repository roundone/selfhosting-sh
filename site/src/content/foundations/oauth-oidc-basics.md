---
title: "OAuth 2.0 and OpenID Connect Explained"
description: "Understand OAuth 2.0 and OpenID Connect for self-hosted services — authorization grants, tokens, scopes, and setting up Authentik as your identity provider."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps:
  - authentik
  - keycloak
  - authelia
  - gitea
tags: ["foundations", "oauth", "oidc", "authentication", "authorization", "sso", "self-hosted"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are OAuth 2.0 and OpenID Connect?

OAuth 2.0 is an authorization framework that lets applications access resources on behalf of a user without ever seeing that user's password. OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0 that adds authentication — proving *who* a user is, not just *what they can access*. Together, they form the standard way to handle OAuth OIDC self-hosted single sign-on across your services.

When you click "Sign in with Google" on a website, that is OAuth 2.0 and OIDC in action. The website never sees your Google password. Google authenticates you and issues a token to the website proving your identity. For self-hosters, the same pattern applies — except you replace Google with your own identity provider like [Authentik](/foundations/sso-authentication), Keycloak, or Authelia.

OAuth 2.0 handles **authorization** (can this app access my data?). OIDC handles **authentication** (who is this user?). Most self-hosted apps that support "OAuth login" actually use OIDC, because they need to identify users, not just get permission to access an API.

## Prerequisites

- A Linux server with Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics)
- Basic understanding of HTTP, URLs, and JSON
- A reverse proxy with HTTPS configured — see [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- Familiarity with DNS and domain names — see [DNS Explained](/foundations/dns-explained)
- Optional: an existing identity provider (this guide covers setting one up)

## OAuth 2.0 Explained

OAuth 2.0 defines four roles:

- **Resource Owner** — the user who owns the data
- **Client** — the application requesting access (e.g., Gitea, Nextcloud)
- **Authorization Server** — the server that authenticates the user and issues tokens (your identity provider)
- **Resource Server** — the API that holds the protected data

### The Authorization Code Flow

The Authorization Code flow is the most common and most secure grant type. Every self-hosted app that supports OAuth should use this flow.

Here is what happens step by step:

```
1. User clicks "Sign in with SSO" in Gitea
         |
         v
2. Gitea redirects the browser to the Authorization Server:
   GET https://auth.example.com/authorize?
       response_type=code
       &client_id=gitea
       &redirect_uri=https://gitea.example.com/user/oauth2/authentik/callback
       &scope=openid profile email
       &state=random-csrf-token
         |
         v
3. User authenticates at the Authorization Server
   (username + password + optional MFA)
         |
         v
4. Authorization Server redirects back to Gitea with a code:
   GET https://gitea.example.com/user/oauth2/authentik/callback?
       code=AUTHORIZATION_CODE
       &state=random-csrf-token
         |
         v
5. Gitea exchanges the code for tokens (server-to-server, no browser):
   POST https://auth.example.com/token
       grant_type=authorization_code
       &code=AUTHORIZATION_CODE
       &client_id=gitea
       &client_secret=SECRET
       &redirect_uri=https://gitea.example.com/user/oauth2/authentik/callback
         |
         v
6. Authorization Server returns:
   {
     "access_token": "eyJhbGci...",
     "id_token": "eyJhbGci...",
     "refresh_token": "dGhpcyBp...",
     "token_type": "Bearer",
     "expires_in": 3600
   }
         |
         v
7. Gitea uses the access_token to fetch user info:
   GET https://auth.example.com/userinfo
   Authorization: Bearer eyJhbGci...
         |
         v
8. User is logged in to Gitea.
```

The critical security feature: the authorization code is exchanged server-to-server in step 5. The browser never sees the access token. This prevents token theft via browser history or referrer headers.

### Other Grant Types

| Grant Type | When to Use | Self-Hosting Relevance |
|---|---|---|
| **Authorization Code** | Web apps, server-side apps | Primary flow. Use this for everything. |
| **Authorization Code + PKCE** | Single-page apps, mobile apps, public clients | Use when the client cannot securely store a client_secret. |
| **Client Credentials** | Machine-to-machine, no user involved | Automated scripts accessing APIs. |
| **Device Code** | TVs, IoT, devices without browsers | Rare in self-hosting. Used by some media clients. |
| **Implicit** | **Deprecated. Do not use.** | Replaced by Authorization Code + PKCE. |
| **Resource Owner Password** | **Deprecated. Do not use.** | Sends passwords directly to the client. Defeats the purpose of OAuth. |

For self-hosted services, use Authorization Code for server-rendered apps and Authorization Code + PKCE for single-page or mobile apps. Ignore the rest unless you have a specific need.

### Tokens

OAuth 2.0 uses three types of tokens:

**Access Token** — a short-lived credential (typically 5-60 minutes) that the client sends with API requests. Usually a JWT (JSON Web Token) containing claims about the user and their permissions. The resource server validates this token on every request.

**Refresh Token** — a long-lived credential (days to months) used to obtain new access tokens without re-authenticating the user. Stored securely on the server side. Never sent to the browser.

**Authorization Code** — a short-lived, one-time-use code (typically 30-60 seconds) exchanged for an access and refresh token. Not a bearer credential — it requires the client_secret to be useful.

### Scopes

Scopes define what the client is allowed to access. The client requests scopes during authorization, and the authorization server may grant all, some, or none of them.

Common OIDC scopes:

| Scope | What It Grants |
|---|---|
| `openid` | Required for OIDC. Returns an ID token. |
| `profile` | User's name, picture, locale, timezone |
| `email` | User's email address and whether it is verified |
| `groups` | User's group memberships (non-standard but common) |
| `offline_access` | Issues a refresh token for long-lived sessions |

Self-hosted apps typically request `openid profile email`. If your app uses group-based access control, add `groups` (supported by Authentik, Keycloak, and others).

## OpenID Connect on Top of OAuth

OIDC extends OAuth 2.0 with three additions:

**1. The ID Token** — a JWT that contains the authenticated user's identity claims. Unlike the access token (which is for resource servers), the ID token is for the client application. It tells the app who logged in.

A decoded ID token looks like this:

```json
{
  "iss": "https://auth.example.com",
  "sub": "user-uuid-1234",
  "aud": "gitea",
  "exp": 1740100000,
  "iat": 1740096400,
  "nonce": "random-nonce-value",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "email_verified": true,
  "groups": ["admins", "developers"]
}
```

Key claims: `iss` (who issued it), `sub` (unique user identifier), `aud` (which client it is for), `exp` (expiration timestamp).

**2. The UserInfo Endpoint** — an API endpoint that returns the user's profile information. The client sends the access token and gets back the user's claims. This supplements the ID token for apps that need additional user data.

**3. Discovery** — every OIDC provider publishes a `.well-known/openid-configuration` document at a standard URL. This document lists all endpoints, supported scopes, signing algorithms, and capabilities. Clients can auto-configure themselves by reading this document instead of requiring manual endpoint entry.

Example:

```
GET https://auth.example.com/application/o/<app-slug>/.well-known/openid-configuration
```

Returns:

```json
{
  "issuer": "https://auth.example.com/application/o/<app-slug>/",
  "authorization_endpoint": "https://auth.example.com/application/o/authorize/",
  "token_endpoint": "https://auth.example.com/application/o/token/",
  "userinfo_endpoint": "https://auth.example.com/application/o/userinfo/",
  "jwks_uri": "https://auth.example.com/application/o/<app-slug>/jwks/",
  "scopes_supported": ["openid", "profile", "email", "groups"],
  "response_types_supported": ["code", "id_token", "code id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

This is why configuring OIDC is usually simpler than SAML — the client reads the discovery document and fills in all endpoints automatically.

## OAuth vs SAML vs LDAP

Three protocols serve overlapping purposes in self-hosting. Use the right one for the job:

| Aspect | OAuth 2.0 / OIDC | SAML 2.0 | LDAP |
|---|---|---|---|
| **Primary purpose** | Authorization + authentication | Authentication (SSO) | Directory queries (user lookup) |
| **Token format** | JWT (JSON) | XML assertions | N/A (query/response protocol) |
| **Transport** | HTTPS + JSON | HTTPS + XML | TCP port 389/636 |
| **Complexity** | Moderate | High (XML, certificates, metadata) | Low to moderate |
| **Mobile/SPA support** | Excellent (PKCE) | Poor (designed for browsers) | N/A |
| **Self-hosted app support** | Growing fast — most modern apps | Enterprise apps, some older self-hosted apps | Widespread — nearly universal |
| **Setup difficulty** | Easy with discovery docs | Harder — manual metadata exchange | Easy but no SSO (just shared user directory) |
| **Best for** | Modern web apps, APIs, mobile | Legacy enterprise integration | Centralized user management |

**Recommendation:** Use OIDC as your primary SSO protocol for new self-hosted deployments. It is simpler to configure than SAML, has better support in modern apps, and works with mobile and single-page applications. Fall back to SAML only when an app does not support OIDC (rare in the self-hosting ecosystem). Use [LDAP](/foundations/ldap-basics) alongside OIDC for apps that only support directory-based authentication — many identity providers like Authentik expose an LDAP interface alongside OIDC.

### When to Combine Them

A common self-hosting architecture:

- **OIDC** for Gitea, Nextcloud, Grafana, Outline, and other modern apps
- **LDAP** for Jellyfin, older apps, and services that lack OIDC support (see [LDAP Basics](/foundations/ldap-basics))
- **SAML** only if you have a specific enterprise tool that requires it

Authentik and Keycloak support all three protocols simultaneously, so you run one identity provider and connect apps using whichever protocol they support best.

## Self-Hosted Identity Providers

Three identity providers dominate the self-hosting space. Each supports OIDC.

### Authentik — Recommended

Authentik is the most capable self-hosted identity provider for most setups. It has a polished web UI, supports OIDC, SAML, LDAP (via an outpost), and proxy-based authentication. Its flow-based authentication engine lets you build custom login sequences — MFA enforcement, conditional access, enrollment forms — without writing code.

Since 2025.10, Authentik no longer requires Redis. PostgreSQL handles caching, task queues, and WebSocket connections.

**Docker Compose for Authentik:**

Create a `.env` file:

```bash
# Generate these with: openssl rand -base64 36
PG_PASS=your-strong-database-password-here
AUTHENTIK_SECRET_KEY=your-secret-key-at-least-50-characters-long

# Optional: customize exposed ports
# COMPOSE_PORT_HTTP=9000
# COMPOSE_PORT_HTTPS=9443
```

Create a `docker-compose.yml`:

```yaml
services:
  postgresql:
    image: docker.io/library/postgres:16-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}"]
      start_period: 20s
      interval: 30s
      retries: 5
      timeout: 5s
    volumes:
      - database:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${PG_PASS}
      POSTGRES_USER: ${PG_USER:-authentik}
      POSTGRES_DB: ${PG_DB:-authentik}

  server:
    image: ghcr.io/goauthentik/server:2025.12.4
    restart: unless-stopped
    command: server
    environment:
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: ${PG_USER:-authentik}
      AUTHENTIK_POSTGRESQL__NAME: ${PG_DB:-authentik}
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
    volumes:
      - ./data:/data
      - ./custom-templates:/templates
    ports:
      - "${COMPOSE_PORT_HTTP:-9000}:9000"
      - "${COMPOSE_PORT_HTTPS:-9443}:9443"
    depends_on:
      postgresql:
        condition: service_healthy

  worker:
    image: ghcr.io/goauthentik/server:2025.12.4
    restart: unless-stopped
    command: worker
    user: root
    environment:
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: ${PG_USER:-authentik}
      AUTHENTIK_POSTGRESQL__NAME: ${PG_DB:-authentik}
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/data
      - ./certs:/certs
      - ./custom-templates:/templates
    depends_on:
      postgresql:
        condition: service_healthy

volumes:
  database:
    driver: local
```

Start it:

```bash
docker compose up -d
```

Navigate to `http://your-server:9000/if/flow/initial-setup/` (the trailing slash is required) to create your admin account.

**Why Authentik over Keycloak:** Authentik is built for self-hosters. The UI is clean, the documentation targets Docker/home-lab setups, and the flow engine covers every authentication scenario without Java XML configuration files. Keycloak is more mature in enterprise features but heavier and harder to configure.

### Keycloak

Keycloak is the most battle-tested open-source identity provider, backed by Red Hat. It supports every protocol (OIDC, SAML 2.0, LDAP federation) and integrates with enterprise directories. The trade-off is complexity — Keycloak's admin console has hundreds of settings, and the Java-based stack uses more resources.

Use Keycloak if you need advanced enterprise features like identity brokering across multiple upstream providers, fine-grained authorization services, or SAML protocol compliance for enterprise applications.

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.1.4
    restart: unless-stopped
    command: start-dev  # Use 'start' with TLS in production
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: change-this-strong-password
      KC_HOSTNAME: auth.example.com
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: change-this-admin-password
    ports:
      - "8080:8080"
    depends_on:
      keycloak-db:
        condition: service_healthy

  keycloak-db:
    image: postgres:16-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 30s
      retries: 5
      timeout: 5s
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: change-this-strong-password
    volumes:
      - keycloak-data:/var/lib/postgresql/data

volumes:
  keycloak-data:
    driver: local
```

### Authelia

Authelia is a lightweight authentication server focused on reverse-proxy integration. It works differently from Authentik and Keycloak — it sits in front of your reverse proxy and intercepts requests, rather than acting as a full OIDC provider. Authelia does support OIDC since v4.37, but its OIDC implementation is more limited than Authentik's.

Use Authelia if you primarily need portal-based SSO in front of apps that do not have native OIDC support — it excels at protecting legacy applications. For apps with built-in OIDC, Authentik is the better choice. See [SSO for Self-Hosted Services](/foundations/sso-authentication) for more on Authelia's proxy-based approach.

## Configuring an App as an OAuth Client

Here is a concrete example: connecting [Gitea](/apps/gitea) to Authentik using OIDC.

### Step 1: Create an OAuth Application in Authentik

1. Log in to Authentik at `https://auth.example.com/if/admin/`
2. Go to **Applications** > **Providers** > **Create**
3. Choose **OAuth2/OpenID Provider**
4. Set these fields:
   - **Name:** `Gitea`
   - **Authorization flow:** Select your default authorization flow
   - **Client type:** Confidential
   - **Client ID:** `gitea` (or leave auto-generated)
   - **Client Secret:** Copy this — you will need it for Gitea
   - **Redirect URIs:** `https://gitea.example.com/user/oauth2/authentik/callback`
   - **Scopes:** `openid`, `profile`, `email`
   - **Signing Key:** Select your self-signed certificate
5. Save the provider
6. Go to **Applications** > **Applications** > **Create**
7. Set the **Name** to `Gitea`, select the provider you just created, and set the **Launch URL** to `https://gitea.example.com`

### Step 2: Configure Gitea

Add these environment variables to your Gitea Docker Compose or `app.ini`:

In `docker-compose.yml` environment section:

```yaml
environment:
  # ... existing Gitea env vars ...
  GITEA__oauth2_client__ENABLE_AUTO_REGISTRATION: "true"
  GITEA__oauth2_client__USERNAME: "nickname"
  GITEA__oauth2_client__ACCOUNT_LINKING: "auto"
```

Then add the OAuth source in Gitea's admin panel:

1. Go to **Site Administration** > **Authentication Sources** > **Add Authentication Source**
2. Set:
   - **Authentication Type:** OAuth2
   - **Authentication Name:** `authentik`
   - **OAuth2 Provider:** OpenID Connect
   - **Client ID:** `gitea` (from Authentik)
   - **Client Secret:** (the secret you copied from Authentik)
   - **OpenID Connect Auto Discovery URL:** `https://auth.example.com/application/o/gitea/.well-known/openid-configuration`
3. Check **Enable Auto Registration** if you want users to be created automatically
4. Save

Users can now click "Sign in with authentik" on the Gitea login page. Authentik handles authentication, MFA, and session management. Gitea receives the user's identity via the OIDC ID token.

### Common Redirect URI Patterns

Different apps expect different callback URLs. Here are the patterns for popular self-hosted apps:

| App | Redirect URI Pattern |
|---|---|
| Gitea / Forgejo | `https://gitea.example.com/user/oauth2/{source}/callback` |
| Nextcloud | `https://nextcloud.example.com/apps/oidc_login/oidc` |
| Grafana | `https://grafana.example.com/login/generic_oauth` |
| Outline | `https://outline.example.com/auth/oidc.callback` |
| Portainer | `https://portainer.example.com` |
| BookStack | `https://bookstack.example.com/oidc/callback` |

Getting the redirect URI wrong is the most common cause of OIDC failures. Always check the application's documentation for the exact callback path.

## Token Refresh and Expiry

Access tokens are deliberately short-lived (5-60 minutes). When one expires, the client uses its refresh token to get a new access token without bothering the user.

The refresh cycle:

```
1. Client sends request with expired access token
         |
         v
2. Resource server returns 401 Unauthorized
         |
         v
3. Client sends refresh token to the token endpoint:
   POST https://auth.example.com/token
       grant_type=refresh_token
       &refresh_token=dGhpcyBp...
       &client_id=gitea
       &client_secret=SECRET
         |
         v
4. Authorization server validates refresh token
   - Is it expired? (refresh tokens typically last 7-30 days)
   - Has it been revoked?
   - Is the client still authorized?
         |
         v
5. Authorization server returns new access token
   (and optionally a new refresh token — rotation)
```

**Refresh token rotation** is a security feature where the authorization server issues a new refresh token every time one is used, and invalidates the old one. If an attacker steals a refresh token and the legitimate client also uses it, one of them will present an already-used token — triggering revocation of the entire token family. Authentik supports refresh token rotation.

**Configuring token lifetimes in Authentik:**

In the OAuth2 Provider settings:
- **Access Token validity:** Default is 5 minutes. Increase to 10-15 minutes for apps with frequent API calls to reduce token refresh overhead.
- **Refresh Token validity:** Default is 30 days. Adjust based on how often you want users to re-authenticate fully.

Setting access tokens too long reduces security. Setting them too short increases load on the identity provider. For most self-hosted setups, 10-minute access tokens with 14-day refresh tokens is a reasonable balance.

## Common Mistakes

**1. Mismatched redirect URIs.** The redirect URI in your identity provider must exactly match what the application sends — protocol, domain, port, and path. `https://gitea.example.com/callback` is not the same as `https://gitea.example.com/callback/`. Check for trailing slashes.

**2. Using HTTP instead of HTTPS.** OAuth 2.0 relies on transport-layer security. Running OIDC flows over plain HTTP exposes authorization codes and tokens to interception. Always use HTTPS, even on your local network. Your [reverse proxy](/foundations/reverse-proxy-explained) handles this.

**3. Storing tokens in browser localStorage.** Client-side JavaScript can read localStorage, making it vulnerable to XSS attacks. Use HTTP-only cookies for token storage in web apps. The Authorization Code flow (not Implicit) avoids this problem because the browser never sees the access token.

**4. Ignoring the `state` parameter.** The `state` parameter in the authorization request prevents CSRF attacks. If your app does not set it, an attacker could trick a user into authenticating with the attacker's account. Every modern OAuth library handles this automatically — do not disable it.

**5. Using the Implicit grant.** The Implicit flow sends the access token directly in the URL fragment. It is deprecated in OAuth 2.1 for good reason — URL fragments leak through browser history and referrer headers. Use Authorization Code + PKCE for all public clients.

**6. Not requesting `offline_access` scope.** Without this scope, some providers do not issue a refresh token. The user's session then expires when the access token does (typically minutes), forcing frequent re-authentication.

**7. Hardcoding endpoints instead of using discovery.** OIDC providers publish a `.well-known/openid-configuration` document. If your app supports auto-discovery, use it. Hardcoded endpoints break when the provider changes its URL structure.

**8. Forgetting to configure group claims.** If your app uses group-based authorization (admin vs user), you must explicitly request the `groups` scope and map the group claim in both the identity provider and the application. Missing this step means all users get the same permissions.

## FAQ

### What is the difference between OAuth 2.0 and OIDC?

OAuth 2.0 is an authorization framework — it controls access to resources. OIDC is an authentication layer built on top of OAuth 2.0 — it proves who a user is by adding the ID token and UserInfo endpoint. When a self-hosted app says it supports "OAuth login," it almost always means OIDC. You need both: OAuth handles the token exchange, OIDC provides the user identity.

### Can I use Authentik and LDAP together?

Yes. Authentik includes an LDAP outpost that exposes your Authentik user directory over the LDAP protocol. Apps that only support LDAP (like Jellyfin) connect to the LDAP outpost, while apps that support OIDC connect directly. You manage all users in one place. See [LDAP Basics](/foundations/ldap-basics) for the protocol details.

### Do I need a public domain for OIDC?

Not strictly, but it is strongly recommended. OIDC works on internal domains and IP addresses, but some apps reject non-HTTPS issuers, and browser-based flows work best with proper TLS. A split-DNS setup with a real domain pointing to your internal IP, combined with Let's Encrypt certificates via DNS challenge, is the standard approach. See [SSL Certificates Explained](/foundations/ssl-certificates) for certificate options.

### What happens if my identity provider goes down?

If Authentik (or any IdP) is offline, users cannot log in to any connected service. Existing sessions with valid, unexpired access tokens continue working until those tokens expire. After that, users are locked out until the IdP is restored. This is why high availability matters for your identity provider — consider running PostgreSQL with regular backups and monitoring Authentik with [Uptime Kuma](/apps/uptime-kuma) or a similar tool.

### Should I use OIDC or SAML for a new app?

OIDC. It is simpler to configure, uses JSON instead of XML, supports mobile and SPA clients natively, and has better tooling. SAML exists for legacy compatibility. Unless the app only supports SAML, choose OIDC every time.

## Related

- [SSO for Self-Hosted Services](/foundations/sso-authentication) — setting up single sign-on with Authelia, Authentik, and Keycloak
- [LDAP Basics for Self-Hosted Services](/foundations/ldap-basics) — centralized user directory for apps without OIDC support
- [Docker Compose Basics](/foundations/docker-compose-basics) — prerequisite for deploying identity providers
- [Server Security Hardening Guide](/foundations/security-hardening) — securing the server that runs your identity provider
- [Reverse Proxy Setup for Self-Hosting](/foundations/reverse-proxy-explained) — HTTPS termination required for OAuth flows
- [How to Self-Host Gitea with Docker Compose](/apps/gitea) — example OIDC client configuration
- [SSL Certificates Explained](/foundations/ssl-certificates) — TLS is mandatory for secure token exchange

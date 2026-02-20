---
title: "LDAP Basics for Self-Hosted Services"
description: "Learn how LDAP works for self-hosted services — directory tree, LLDAP Docker Compose setup, connecting apps like Nextcloud and Gitea, and search filters."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "ldap", "authentication", "lldap", "directory"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is LDAP?

LDAP (Lightweight Directory Access Protocol) is a protocol for querying and managing a centralized user directory. When you self-host multiple services, LDAP gives you a single place to manage users and groups instead of creating separate accounts in every app. One set of credentials works across Nextcloud, Gitea, Jellyfin, and anything else that supports LDAP for self-hosted services.

LDAP has been around since the 1990s. It is not glamorous, but it is the most widely supported authentication backend in the self-hosting ecosystem. Nearly every serious self-hosted app supports LDAP out of the box. If you run more than three or four services, centralized user management stops being optional.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started)
- Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics)
- Basic understanding of Docker networking — see [Docker Networking](/foundations/docker-networking)
- A working reverse proxy if you want web-based LDAP management — see [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Core Concepts

### The Directory Tree (DIT)

LDAP organizes data as a tree structure called the Directory Information Tree. Think of it like a filesystem, but for identity data. The root of the tree is your base DN (Distinguished Name), which typically mirrors your domain:

```
dc=selfhosting,dc=sh          (base DN — the root)
├── ou=people                  (organizational unit for users)
│   ├── uid=alice              (a user entry)
│   └── uid=bob                (another user entry)
└── ou=groups                  (organizational unit for groups)
    ├── cn=admins              (a group entry)
    └── cn=media-users         (another group entry)
```

### Distinguished Names (DNs)

Every entry in LDAP has a unique path called its Distinguished Name. It reads from the specific entry up to the root, separated by commas:

- User Alice: `uid=alice,ou=people,dc=selfhosting,dc=sh`
- Admins group: `cn=admins,ou=groups,dc=selfhosting,dc=sh`
- Base DN: `dc=selfhosting,dc=sh`

DNs are how apps locate entries. When you configure an app to talk to LDAP, you will provide the base DN and often a bind DN (the account the app uses to search the directory).

### Entries and Attributes

Each entry in the directory is a collection of attributes. A user entry might look like this:

```ldif
dn: uid=alice,ou=people,dc=selfhosting,dc=sh
objectClass: inetOrgPerson
uid: alice
cn: Alice Smith
sn: Smith
mail: alice@selfhosting.sh
userPassword: {SSHA}hashed-password-here
memberOf: cn=admins,ou=groups,dc=selfhosting,dc=sh
```

Key attributes you will see everywhere:

| Attribute | Meaning | Example |
|-----------|---------|---------|
| `dn` | Full path to the entry | `uid=alice,ou=people,dc=selfhosting,dc=sh` |
| `uid` | Username / login ID | `alice` |
| `cn` | Common name (display name) | `Alice Smith` |
| `sn` | Surname | `Smith` |
| `mail` | Email address | `alice@selfhosting.sh` |
| `objectClass` | Schema type(s) for this entry | `inetOrgPerson` |
| `memberOf` | Groups this user belongs to | `cn=admins,ou=groups,...` |
| `ou` | Organizational unit name | `people`, `groups` |

### Schemas and Object Classes

Schemas define what attributes an entry can have. The `objectClass` attribute tells LDAP which schema applies. Common ones:

- **inetOrgPerson** — standard user with name, email, phone, etc.
- **groupOfNames** or **groupOfUniqueNames** — a group containing member references
- **posixAccount** — Unix-style user with UID/GID numbers (needed for some apps)

You rarely need to think about schemas when using a modern LDAP server like LLDAP. The server handles this for you.

## LDAP vs OIDC vs SAML

Three protocols dominate self-hosted authentication. Here is when to use each:

| | LDAP | OIDC (OpenID Connect) | SAML |
|---|------|----------------------|------|
| **What it does** | Centralized user directory and authentication | Token-based single sign-on | XML-based single sign-on |
| **How old** | 1993 | 2014 | 2005 |
| **App support** | Nearly universal | Growing fast, not universal | Enterprise-heavy |
| **User experience** | Each app has its own login form | Single login page, redirects back to apps | Single login page, redirects back to apps |
| **Complexity** | Low | Medium | High |
| **Best for** | Centralizing user accounts across many apps | SSO with a modern identity provider | Enterprise or legacy apps |

**The practical recommendation:** Use LDAP as your user directory, then add an OIDC provider like Authelia or Authentik on top if you want true single sign-on. LDAP gives you one user database. OIDC gives you one login screen. They complement each other — LDAP as the backend, OIDC as the frontend.

For a deeper guide on SSO providers, see [SSO and Authentication](/foundations/sso-authentication).

## Self-Hosted LDAP Servers

Three options dominate the self-hosting space:

### LLDAP — Best for Most Self-Hosters

[LLDAP](https://github.com/lldap/lldap) is a lightweight LDAP server built specifically for self-hosters. It exposes a clean web UI for user and group management, consumes minimal resources (under 30 MB RAM), and handles everything most people need without the complexity of a full LDAP server.

- **Pros:** Simple Docker setup, built-in web UI, tiny resource footprint, active development
- **Cons:** No advanced schema customization, limited to user/group management
- **Use when:** You want centralized auth across your services without becoming an LDAP expert

### OpenLDAP

[OpenLDAP](https://www.openldap.org/) is the full-featured, battle-tested LDAP server. It supports custom schemas, replication, advanced ACLs, and everything the protocol offers. It is also significantly harder to configure.

- **Pros:** Feature-complete, highly customizable, massive community
- **Cons:** Complex configuration, no web UI by default, steep learning curve
- **Use when:** You need custom schemas, replication between servers, or enterprise-grade features

### 389 Directory Server

[389 DS](https://www.port389.org/) is Red Hat's open-source directory server. Full-featured like OpenLDAP, with arguably better tooling and a built-in web console.

- **Pros:** Modern tooling, web console, strong replication support
- **Cons:** Heavier resource usage, Red Hat ecosystem focused
- **Use when:** You are already in the Red Hat/Fedora ecosystem or need multi-master replication

**The verdict:** LLDAP is the right choice for 90% of self-hosters. It does exactly what you need — centralized users and groups — without the operational overhead of OpenLDAP or 389 DS. Start with LLDAP. Graduate to OpenLDAP only if you hit its limits.

## Setting Up LLDAP with Docker Compose

Create a directory for your LLDAP deployment:

```bash
mkdir -p ~/lldap && cd ~/lldap
```

Create a `docker-compose.yml`:

```yaml
services:
  lldap:
    image: lldap/lldap:v0.6.1
    container_name: lldap
    restart: unless-stopped
    ports:
      # LDAP protocol port — apps connect here
      - "3890:3890"
      # Web UI for managing users and groups
      - "17170:17170"
    volumes:
      # Persistent storage for the LDAP database
      - lldap_data:/data
    environment:
      # Timezone for log timestamps
      - TZ=UTC

      # Your domain's base DN — change to match your domain
      # Example: selfhosting.sh becomes dc=selfhosting,dc=sh
      - LLDAP_LDAP_BASE_DN=dc=selfhosting,dc=sh

      # Admin password — CHANGE THIS to a strong random password
      # This is the password for the built-in "admin" account
      - LLDAP_LDAP_USER_PASS=CHANGE-ME-to-a-strong-password

      # JWT secret for web UI sessions — generate with: openssl rand -hex 32
      - LLDAP_JWT_SECRET=CHANGE-ME-generate-with-openssl-rand-hex-32

      # Key seed for password hashing — generate with: openssl rand -hex 32
      - LLDAP_KEY_SEED=CHANGE-ME-generate-with-openssl-rand-hex-32

      # Database backend — SQLite is fine for most self-hosters
      # For PostgreSQL or MySQL, see LLDAP docs
      - LLDAP_DATABASE_URL=sqlite:///data/users.db?mode=rwc

volumes:
  lldap_data:
```

Start the stack:

```bash
docker compose up -d
```

Open the web UI at `http://your-server-ip:17170`. Log in with username `admin` and the password you set in `LLDAP_LDAP_USER_PASS`.

### Creating Users and Groups

From the LLDAP web UI:

1. Click **Create a user**. Set the username, email, display name, and password.
2. Click **Create a group**. Name it something meaningful like `nextcloud-users` or `media-access`.
3. Add users to groups by clicking the group and selecting members.

Every user you create is immediately available to any app connected to this LDAP server. No syncing, no delays.

### Generating Secrets

Do not use the placeholder values from the example above. Generate proper secrets:

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate key seed
openssl rand -hex 32

# Generate a strong admin password
openssl rand -base64 24
```

## Connecting Apps to LDAP

Every LDAP-aware app needs the same core settings. Here is what they mean:

| Setting | Value for LLDAP | Purpose |
|---------|----------------|---------|
| LDAP Server / Host | `lldap` (container name) or `your-server-ip` | Where the LDAP server is |
| LDAP Port | `3890` | LLDAP's default LDAP port |
| Base DN | `dc=selfhosting,dc=sh` | Root of your directory tree |
| Bind DN | `uid=admin,ou=people,dc=selfhosting,dc=sh` | Account the app uses to search LDAP |
| Bind Password | Your admin password | Password for the bind account |
| User Filter | `(objectClass=person)` | Which entries are users |
| User Base | `ou=people,dc=selfhosting,dc=sh` | Where to search for users |
| Group Base | `ou=groups,dc=selfhosting,dc=sh` | Where to search for groups |

**Security note:** Create a dedicated read-only service account for each app instead of using the admin account. In LLDAP's web UI, create a user like `svc-nextcloud` and use that as the bind DN. The bind account only needs read access to search users and verify passwords.

### Nextcloud LDAP Configuration

In [Nextcloud](/apps/nextcloud), enable the **LDAP user and group backend** app from the Apps page, then go to **Administration Settings > LDAP/AD Integration**:

**Server tab:**
- Host: `lldap` (if on the same Docker network) or your server IP
- Port: `3890`
- Bind DN: `uid=svc-nextcloud,ou=people,dc=selfhosting,dc=sh`
- Bind Password: the service account password
- Base DN: `dc=selfhosting,dc=sh`

**User tab:**
- Object classes: `person`
- Groups: select which LLDAP groups can log into Nextcloud

**Login Attributes tab:**
- LDAP/AD Username: checked
- Other attributes: `mail` (allows login with email)

**Group tab:**
- Object classes: `groupOfUniqueNames`

Click **Test Configuration** on the Server tab to verify the connection.

### Gitea LDAP Configuration

In [Gitea](/apps/gitea), go to **Site Administration > Authentication Sources > Add Authentication Source**:

- Authentication type: **LDAP (via BindDN)**
- Host: `lldap` or your server IP
- Port: `3890`
- Bind DN: `uid=svc-gitea,ou=people,dc=selfhosting,dc=sh`
- Bind Password: the service account password
- User Search Base: `ou=people,dc=selfhosting,dc=sh`
- User Filter: `(&(objectClass=person)(uid=%s))`
- Admin Filter: `(memberOf=cn=admins,ou=groups,dc=selfhosting,dc=sh)`
- Username Attribute: `uid`
- First Name Attribute: `givenName`
- Surname Attribute: `sn`
- Email Attribute: `mail`

The `%s` in the user filter is replaced with whatever the user types in the login form. The admin filter grants Gitea admin rights to members of the `admins` group in LLDAP.

## LDAP Search Queries Explained

When apps query LDAP, they use search filters. Understanding these helps you debug authentication issues.

### Basic Filters

```
(uid=alice)                    — find entry where uid equals "alice"
(objectClass=person)           — find all person entries
(mail=alice@selfhosting.sh)    — find by email
```

### Compound Filters

```
(&(objectClass=person)(uid=alice))
```

The `&` means AND. Both conditions must match. This finds a person entry with uid `alice`.

```
(|(uid=alice)(mail=alice@selfhosting.sh))
```

The `|` means OR. Either condition can match. This lets users log in with either username or email.

### Membership Filters

```
(memberOf=cn=media-users,ou=groups,dc=selfhosting,dc=sh)
```

Finds all entries that are members of the `media-users` group. Use this to restrict which LDAP users can access a specific app.

### Negation

```
(&(objectClass=person)(!(uid=admin)))
```

The `!` means NOT. This finds all users except `admin`.

### Testing Queries

You can test LDAP queries from the command line using `ldapsearch`:

```bash
# Search for all users
docker exec lldap /app/lldap_cli \
  --url ldap://localhost:3890 \
  --admin-username admin \
  --admin-password 'your-admin-password' \
  user list

# Or use ldapsearch if installed on the host
ldapsearch -x -H ldap://localhost:3890 \
  -D "uid=admin,ou=people,dc=selfhosting,dc=sh" \
  -w 'your-admin-password' \
  -b "ou=people,dc=selfhosting,dc=sh" \
  "(objectClass=person)"
```

## Common Mistakes

### Using the Admin Account as the Bind DN Everywhere

Every app that connects to LDAP needs a bind account. Using the admin account for all of them means a compromise of any single app leaks your LDAP admin credentials. Create a dedicated read-only service account per app.

### Forgetting to Put LLDAP on the Same Docker Network

If your apps and LLDAP are in different Docker Compose files, they cannot reach each other by container name unless they share a Docker network. Create an external network and attach both stacks to it. See [Docker Networking](/foundations/docker-networking) for details.

```yaml
# In each docker-compose.yml:
networks:
  ldap-net:
    external: true

# Create the network first:
# docker network create ldap-net
```

### Getting the Base DN Wrong

The base DN must match exactly what you configured in LLDAP. If LLDAP uses `dc=selfhosting,dc=sh` and you type `dc=selfhosting,dc=com` in Nextcloud, every query returns zero results. Copy-paste the base DN — do not retype it.

### Not Escaping Special Characters in Filters

LDAP filters treat `*`, `(`, `)`, `\`, and NUL as special characters. If a username contains any of these, the search filter breaks. Stick to alphanumeric usernames to avoid this entirely.

### Ignoring TLS for LDAP Connections

By default, LLDAP uses unencrypted LDAP on port 3890. This is fine if your apps connect over a private Docker network. If LDAP traffic crosses the open network (for example, apps on a different server), configure LDAPS (LDAP over TLS) or tunnel the traffic through WireGuard. See [Security Hardening](/foundations/security-hardening) for transport encryption options.

## FAQ

### Do I need LDAP if I only run two or three self-hosted apps?

Probably not. LDAP shines when you have five or more services where managing separate accounts becomes tedious. Below that, separate accounts per app are manageable. That said, setting up LLDAP takes about ten minutes, so the barrier is low.

### Can I use LDAP and OIDC together?

Yes, and this is the recommended approach for larger setups. Run LLDAP as your user directory, then deploy an OIDC provider like Authelia or Authentik that authenticates against LLDAP. Apps that support OIDC get true single sign-on. Apps that only support LDAP connect directly to LLDAP.

### What happens to existing app accounts when I switch to LDAP?

It depends on the app. Most apps (Nextcloud, Gitea, Jellyfin) create a new internal account linked to the LDAP entry on first login. Your old local accounts remain separate. You may need to migrate data from the old local account to the new LDAP-linked account manually.

### Is LLDAP production-ready?

Yes. LLDAP has been stable since v0.5 and is widely deployed in the self-hosting community. It implements the subset of LDAP that self-hosted apps actually need. For a home server or small team, it is more than sufficient.

### How do I back up LLDAP?

Back up the Docker volume that stores the SQLite database. With the named volume from the Compose file above:

```bash
docker run --rm -v lldap_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/lldap-backup-$(date +%F).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach to backing up all your self-hosted services.

## Next Steps

- Add an OIDC layer on top of LDAP for true single sign-on — see [SSO and Authentication](/foundations/sso-authentication)
- Secure your LDAP traffic and server — see [Security Hardening](/foundations/security-hardening)
- Connect more apps: most apps in our [app guides](/apps) section document their LDAP settings
- Set up automated backups of your LLDAP data — see [Backup Strategy](/foundations/backup-3-2-1-rule)

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics) — prerequisite for running LLDAP
- [Docker Networking](/foundations/docker-networking) — connecting LLDAP to your app containers
- [Security Hardening](/foundations/security-hardening) — securing LDAP traffic and your server
- [SSO and Authentication](/foundations/sso-authentication) — adding OIDC on top of LDAP
- [Nextcloud Setup Guide](/apps/nextcloud) — full Nextcloud deployment with LDAP
- [Gitea Setup Guide](/apps/gitea) — full Gitea deployment with LDAP
- [Backup Strategy](/foundations/backup-3-2-1-rule) — backing up your LDAP database

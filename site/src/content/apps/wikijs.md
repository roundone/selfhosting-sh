---
title: "How to Self-Host Wiki.js with Docker Compose"
description: "Step-by-step guide to self-hosting Wiki.js with Docker Compose and PostgreSQL for a modern, feature-rich team wiki."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "wiki"
apps:
  - wikijs
tags:
  - docker
  - wiki
  - documentation
  - knowledge-base
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Wiki.js?

Wiki.js is a modern, open-source wiki platform built on Node.js. It has a polished WYSIWYG and Markdown editor, built-in search, Git-based storage sync, and supports multiple authentication providers out of the box. It replaces Confluence, Notion (for team wikis), and GitBook for teams that want full control over their documentation. [Official site](https://js.wiki/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum), 1 GB recommended
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wikijs:
    image: requarks/wiki:2.5
    container_name: wikijs
    environment:
      DB_TYPE: postgres
      DB_HOST: wikijs-db
      DB_PORT: "5432"
      DB_USER: wikijs
      DB_PASS: change-me-to-a-strong-password  # CHANGE THIS
      DB_NAME: wikijs
    ports:
      - "3000:3000"    # Web UI
    depends_on:
      wikijs-db:
        condition: service_healthy
    restart: unless-stopped

  wikijs-db:
    image: postgres:16-alpine
    container_name: wikijs-db
    environment:
      POSTGRES_USER: wikijs
      POSTGRES_PASSWORD: change-me-to-a-strong-password  # Must match DB_PASS above
      POSTGRES_DB: wikijs
    volumes:
      - wikijs-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wikijs"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  wikijs-db-data:
```

Start the stack:

```bash
docker compose up -d
```

Wiki.js is available at `http://your-server-ip:3000`.

## Initial Setup

1. Open `http://your-server-ip:3000` in your browser
2. Create your admin account — email and password
3. Set the site URL (important for links and authentication callbacks)
4. You're dropped into the admin dashboard where you can configure authentication, storage, and rendering

### Create Your First Page

Click the **New Page** button in the top-right. Wiki.js supports multiple editors:

- **Markdown** — the best option for technical documentation
- **Visual Editor** — WYSIWYG for non-technical users
- **Raw HTML** — for custom layouts

Set the page path (e.g., `/home`) and start writing. Pages are organized by path hierarchy — `/servers/proxmox` nests under `/servers`.

## Configuration

### Authentication

Wiki.js supports local accounts by default. For team use, configure an external provider under **Administration > Authentication**:

- **LDAP/Active Directory** — for corporate environments
- **OAuth2/OpenID Connect** — GitHub, Google, Azure AD, Keycloak
- **SAML 2.0** — enterprise SSO
- **Authelia/Authentik** — pair with your self-hosted auth provider

Each provider can be configured to auto-register users and assign them to specific groups.

### Storage Sync

Wiki.js can sync content to a Git repository, providing version history and backup in one step. Under **Administration > Storage**:

1. Select **Git** as the storage target
2. Configure the remote repository URL, branch, and SSH key
3. Set sync interval (default: 5 minutes)
4. Choose sync direction — bidirectional, push only, or pull only

This means your wiki content lives in Git and can be edited externally via pull requests.

### Search

Wiki.js includes a built-in database search engine that works without additional setup. For larger wikis, you can switch to [Elasticsearch](/apps/elasticsearch) or Algolia under **Administration > Search**.

### Rendering

Under **Administration > Rendering**, configure how Markdown is processed:

- Enable/disable specific Markdown extensions (footnotes, task lists, diagrams)
- Configure Mermaid diagram support
- Set PlantUML server for UML diagrams
- Enable MathJax/KaTeX for mathematical notation

## Advanced Configuration (Optional)

### Custom Branding

Under **Administration > Theme**, customize:

- Site title and company name
- Dark mode toggle
- Custom CSS injection
- Custom header/footer HTML

### Permissions and Groups

Wiki.js has granular permissions. Create groups under **Administration > Groups** and assign page rules:

- **Read/Write/Delete** per path pattern (e.g., `/engineering/*`)
- **Comment** permissions
- **Asset upload** permissions

The default `Administrators` and `Guests` groups are pre-configured.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | | Database type: `postgres`, `mysql`, `mariadb`, `mssql`, or `sqlite` |
| `DB_HOST` | | Database hostname |
| `DB_PORT` | `5432` | Database port |
| `DB_USER` | | Database username |
| `DB_PASS` | | Database password |
| `DB_NAME` | `wiki` | Database name |
| `HA_ACTIVE` | `false` | Enable high-availability mode (multi-instance) |

## Reverse Proxy

Configure your reverse proxy to forward to port 3000. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full details.

**Caddy** example:

```
wiki.yourdomain.com {
    reverse_proxy localhost:3000
}
```

**Nginx Proxy Manager:** Create a proxy host pointing to `http://wikijs:3000` (same Docker network) or `http://your-server-ip:3000`.

**Traefik** labels (add to the wikijs service):

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wikijs.rule=Host(`wiki.yourdomain.com`)"
      - "traefik.http.routers.wikijs.entrypoints=websecure"
      - "traefik.http.routers.wikijs.tls.certresolver=letsencrypt"
      - "traefik.http.services.wikijs.loadbalancer.server.port=3000"
```

After configuring the reverse proxy, update the **Site URL** in Administration > General to match your domain.

## Backup

Back up the PostgreSQL database:

```bash
docker exec wikijs-db pg_dump -U wikijs wikijs > wikijs-backup-$(date +%Y%m%d).sql
```

If you've configured Git storage sync, your content is already backed up in the Git repository. The database stores user accounts, permissions, and page metadata.

To restore:

```bash
docker exec -i wikijs-db psql -U wikijs wikijs < wikijs-backup-20260220.sql
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete approach.

## Troubleshooting

### Wiki.js Won't Start — Database Connection Refused

**Symptom:** Container logs show `ECONNREFUSED` or `connect ECONNREFUSED 172.x.x.x:5432`.

**Fix:** Ensure the `depends_on` with `condition: service_healthy` is set. Verify `DB_HOST` matches the database service name in docker-compose.yml (`wikijs-db`, not `localhost`). Check that `DB_PASS` matches `POSTGRES_PASSWORD` exactly.

### Pages Not Rendering Markdown Correctly

**Symptom:** Mermaid diagrams, math equations, or other extensions don't render.

**Fix:** Go to **Administration > Rendering > Markdown** and enable the specific extensions you need. Mermaid, PlantUML, and KaTeX are disabled by default.

### Search Returns No Results

**Symptom:** The search bar returns nothing even for pages you know exist.

**Fix:** Go to **Administration > Search** and click **Rebuild Index**. The database search engine needs to re-index after bulk imports or if the index becomes corrupted.

### Git Sync Fails with SSH Error

**Symptom:** Storage sync shows authentication errors.

**Fix:** Ensure the SSH key is in the correct format (OpenSSH, not PuTTY). The key must be added as a deploy key on the Git repository. Verify the repository URL uses the SSH format (`git@github.com:org/repo.git`), not HTTPS.

### High Memory Usage

**Symptom:** Wiki.js container uses significantly more RAM than expected.

**Fix:** Wiki.js caches rendered pages in memory. For large wikis (1,000+ pages), this is expected. If memory is constrained, set `NODE_OPTIONS=--max-old-space-size=512` in the environment variables to limit the V8 heap.

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB under normal use. Large wikis with many concurrent editors may need 1 GB+.
- **CPU:** Low. Node.js single-threaded — handles typical wiki workloads easily.
- **Disk:** ~200 MB for the application, plus database storage (varies with content volume).

## Verdict

Wiki.js is the best self-hosted wiki for most teams. The editor experience is excellent — the Markdown editor with live preview rivals dedicated tools, and the WYSIWYG editor works well for non-technical contributors. Git sync is a standout feature that no other wiki offers as cleanly. The permission system is granular enough for multi-team use without being overcomplicated.

The main drawback is that Wiki.js v3 has been in development for years with no stable release. v2 is stable and maintained but isn't getting major new features. If you need a wiki today, v2 is solid. If you want the most actively developed option, [BookStack](/apps/bookstack) is updated more frequently.

**Choose Wiki.js if:** you want a polished, modern wiki with Git sync and strong authentication options.

**Choose [BookStack](/apps/bookstack) if:** you prefer a book-chapter-page organizational model with more active development.

**Choose [DokuWiki](/apps/dokuwiki) if:** you want a flat-file wiki with zero database dependencies.

## Related

- [Wiki.js vs BookStack](/compare/wikijs-vs-bookstack)
- [Wiki.js vs DokuWiki](/compare/wikijs-vs-dokuwiki)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host DokuWiki](/apps/dokuwiki)
- [How to Self-Host Outline](/apps/outline)
- [Best Self-Hosted Wiki](/best/wiki)
- [Self-Hosted Alternatives to Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

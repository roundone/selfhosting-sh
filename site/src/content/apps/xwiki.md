---
title: "How to Self-Host XWiki with Docker Compose"
description: "Deploy XWiki with Docker Compose and PostgreSQL. A full-featured enterprise wiki with structured data and application platform."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "wiki"
apps:
  - xwiki
tags:
  - docker
  - wiki
  - documentation
  - enterprise
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is XWiki?

XWiki is an open-source enterprise wiki and application development platform built on Java. Beyond standard wiki features, XWiki lets you build structured applications (databases, forms, workflows) directly within the wiki — no coding required. It supports real-time collaborative editing, granular permissions, and extensions through a built-in marketplace. XWiki targets teams that need both documentation and lightweight internal tools. [Official site](https://www.xwiki.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 4 GB of RAM minimum (JVM + database + Solr indexing)
- 5 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  xwiki:
    image: xwiki:16.10.17-postgres-tomcat
    container_name: xwiki
    environment:
      DB_HOST: xwiki-db
      DB_USER: xwiki
      DB_PASSWORD: change-me-to-a-strong-password    # CHANGE THIS
      DB_DATABASE: xwiki
      JAVA_OPTS: >-
        -Xms512m
        -Xmx1536m
        -XX:MaxRAMPercentage=70.0
    ports:
      - "8080:8080"    # Web UI (Tomcat)
    volumes:
      - xwiki-data:/usr/local/xwiki     # XWiki permanent directory — config, extensions, Solr index
    depends_on:
      xwiki-db:
        condition: service_healthy
    restart: unless-stopped

  xwiki-db:
    image: postgres:16-alpine
    container_name: xwiki-db
    environment:
      POSTGRES_USER: xwiki
      POSTGRES_PASSWORD: change-me-to-a-strong-password    # Must match DB_PASSWORD above
      POSTGRES_DB: xwiki
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C.UTF-8 --lc-ctype=C.UTF-8"
    volumes:
      - xwiki-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U xwiki"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  xwiki-data:
  xwiki-db-data:
```

Start the stack:

```bash
docker compose up -d
```

XWiki takes 1-3 minutes to start on first run (JVM startup + initial database schema creation). Monitor with:

```bash
docker compose logs -f xwiki
```

When you see `Server startup in [XXXXX] milliseconds`, XWiki is ready at `http://your-server-ip:8080`.

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. You'll see the XWiki setup wizard
3. **Create admin account** — username, password, email
4. **Flavor selection** — choose "XWiki Standard Flavor" for the full feature set. This installs default extensions, templates, and the WYSIWYG editor
5. Wait for the flavor to install (this downloads and configures default extensions — takes a few minutes)
6. Once complete, you're on the XWiki home page

### Create Your First Page

Click the **+** button or navigate to a space and click **Create**. XWiki organizes content into spaces (similar to namespaces):

- `Main` — default space
- `XWiki` — system pages (users, groups, admin)
- You can create custom spaces for teams or projects

XWiki supports both a WYSIWYG editor and a wiki syntax editor (similar to MediaWiki syntax).

## Configuration

### Administration Panel

Go to **Administer Wiki** (gear icon) to access all configuration. Key sections:

- **Users & Groups** — manage accounts and permissions
- **Rights** — set page/space-level read/write/admin permissions
- **Presentation** — theme, skin, color scheme
- **Mail** — SMTP settings for notifications
- **Extensions** — install/update from the XWiki Marketplace

### Authentication

XWiki supports multiple authentication backends:

- **Local accounts** — default, manage through admin panel
- **LDAP/Active Directory** — configure under Administration > Authentication
- **OpenID Connect** — via the OIDC extension
- **SAML** — via extension

### Structured Applications (AWM)

XWiki's Application Within Minutes (AWM) feature lets you build database applications without code:

1. Go to **Administer Wiki > Applications**
2. Click **Create Application**
3. Define fields (text, date, number, select, user reference)
4. XWiki generates create/edit forms, list views, and search automatically

Use cases: bug trackers, asset inventories, employee directories, project trackers.

### Extensions

Browse the XWiki Marketplace at **Administer Wiki > Extensions**. Popular extensions:

- **Diagram** — draw.io/diagrams.net integration
- **Notifications** — email/in-app notifications for page changes
- **PDF Export** — generate PDFs from wiki pages
- **Blog** — turn a space into a blog
- **Forum** — discussion forums within the wiki

## Advanced Configuration (Optional)

### JVM Tuning

Adjust the JVM heap based on your wiki size:

| Wiki Size | Recommended Heap | JAVA_OPTS |
|-----------|-----------------|-----------|
| Small (<1,000 pages) | 512m–1g | `-Xms512m -Xmx1g` |
| Medium (1,000–10,000) | 1g–2g | `-Xms1g -Xmx2g` |
| Large (10,000+) | 2g–4g | `-Xms2g -Xmx4g` |

XWiki also runs Solr internally for search indexing. Large wikis should externalize Solr to manage memory:

```yaml
    environment:
      INDEX_HOST: xwiki-solr
      INDEX_PORT: "8983"
```

### Docker Secrets

For production, use Docker secrets instead of environment variables for passwords:

```yaml
    environment:
      DB_USER_FILE: /run/secrets/xwiki_db_user
      DB_PASSWORD_FILE: /run/secrets/xwiki_db_password
    secrets:
      - xwiki_db_user
      - xwiki_db_password

secrets:
  xwiki_db_user:
    file: ./secrets/db_user.txt
  xwiki_db_password:
    file: ./secrets/db_password.txt
```

## Reverse Proxy

Configure your reverse proxy to forward to port 8080. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

**Caddy** example:

```
wiki.yourdomain.com {
    reverse_proxy localhost:8080
}
```

**Nginx Proxy Manager:** Create a proxy host pointing to `http://xwiki:8080` (same Docker network) or `http://your-server-ip:8080`. Enable WebSocket support for the real-time editor.

## Backup

### Database

```bash
docker exec xwiki-db pg_dump -U xwiki xwiki > xwiki-db-$(date +%Y%m%d).sql
```

### XWiki Data Directory

```bash
docker run --rm -v xwiki-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/xwiki-data-$(date +%Y%m%d).tar.gz -C /data .
```

The data directory contains extensions, Solr indexes, and configuration. The database contains all wiki content.

XWiki also supports export/import via XAR files (wiki archive format) from the admin panel.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete approach.

## Troubleshooting

### XWiki Takes Minutes to Start

**Symptom:** Container takes 2-5 minutes before the web UI is accessible.

**Fix:** This is normal for JVM-based applications. The first start is slowest because it creates the database schema and installs the default flavor. Subsequent starts are faster (30-60 seconds). Monitor startup with `docker compose logs -f xwiki`.

### Out of Memory Errors

**Symptom:** Container crashes or becomes unresponsive. Logs show `OutOfMemoryError`.

**Fix:** Increase the JVM heap in `JAVA_OPTS`. XWiki with Solr embedded needs at least 1.5 GB of heap for moderate workloads. Ensure the Docker host has at least 2x the JVM heap in available RAM.

### Flavor Installation Fails

**Symptom:** The setup wizard fails during flavor installation with download errors.

**Fix:** Verify internet access from the container. The flavor is downloaded from the XWiki Maven repository. If behind a proxy, configure JVM proxy settings:

```
-Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080
```

### Database Encoding Issues

**Symptom:** Pages with special characters (accents, CJK, emoji) display incorrectly.

**Fix:** Ensure PostgreSQL was initialized with UTF-8 encoding. Check the `POSTGRES_INITDB_ARGS` in the Compose file includes `--encoding=UTF-8 --lc-collate=C.UTF-8`. If the database was already created with wrong encoding, you must recreate it.

## Resource Requirements

- **RAM:** 2 GB minimum (1.5 GB JVM heap + OS + database). 4 GB recommended for production.
- **CPU:** Medium. JVM compilation and Solr indexing are CPU-intensive during startup and bulk operations.
- **Disk:** ~1 GB for the application, plus database and uploaded files.

XWiki is the heaviest wiki option due to the JVM. Plan resources accordingly.

## Verdict

XWiki is the most capable self-hosted wiki if you need structured applications alongside documentation. The Application Within Minutes feature is unique — no other wiki lets you build custom database apps without leaving the platform. Real-time collaborative editing, granular permissions, and the extension marketplace make it suitable for enterprise teams.

The cost is resource consumption. XWiki needs 2-4 GB of RAM at minimum — more than [Wiki.js](/apps/wikijs/) (256 MB), [DokuWiki](/apps/dokuwiki/) (128 MB), or [BookStack](/apps/bookstack/) (256 MB). The JVM startup time is slow, and administration is more complex. If you just need a wiki, XWiki is overkill.

**Choose XWiki if:** you need structured applications within your wiki, or you're replacing Confluence for an enterprise team.

**Choose [Wiki.js](/apps/wikijs/) if:** you want a modern wiki with good editors and lower resource usage.

**Choose [BookStack](/apps/bookstack/) if:** you want organized documentation with a book-chapter-page model.

## Related

- [Wiki.js vs BookStack](/compare/wikijs-vs-bookstack/)
- [DokuWiki vs MediaWiki](/compare/dokuwiki-vs-mediawiki/)
- [How to Self-Host Wiki.js](/apps/wikijs/)
- [How to Self-Host BookStack](/apps/bookstack/)
- [How to Self-Host DokuWiki](/apps/dokuwiki/)
- [How to Self-Host MediaWiki](/apps/mediawiki/)
- [Best Self-Hosted Wiki](/best/wiki/)
- [Self-Hosted Alternatives to Confluence](/replace/confluence/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)

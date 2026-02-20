---
title: "How to Self-Host DokuWiki with Docker"
description: "Step-by-step guide to self-hosting DokuWiki with Docker. A flat-file wiki with zero database dependencies and simple setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "wiki-documentation"
apps:
  - dokuwiki
tags:
  - docker
  - wiki
  - documentation
  - flat-file
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is DokuWiki?

DokuWiki is a flat-file wiki that stores all content as plain text files — no database required. It's been around since 2004 and has a massive plugin ecosystem (2,000+ plugins). DokuWiki is used by organizations from small teams to large enterprises including CERN. It's the right choice when you want a wiki that's dead simple to back up (copy a folder), easy to version control, and has zero external dependencies. [Official site](https://www.dokuwiki.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 200 MB of free disk space
- 128 MB of RAM (minimum)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  dokuwiki:
    image: lscr.io/linuxserver/dokuwiki:2025-05-14b-ls294
    container_name: dokuwiki
    environment:
      - PUID=1000            # Your user ID (run `id -u` to find it)
      - PGID=1000            # Your group ID (run `id -g` to find it)
      - TZ=America/New_York  # Your timezone
    volumes:
      - dokuwiki_config:/config    # All DokuWiki data — pages, media, config, plugins
    ports:
      - "8080:80"            # Web UI (HTTP)
    restart: unless-stopped

volumes:
  dokuwiki_config:
```

Start the stack:

```bash
docker compose up -d
```

DokuWiki is available at `http://your-server-ip:8080`.

## Initial Setup

### 1. Run the Installer

Navigate to `http://your-server-ip:8080/install.php` in your browser. Fill in:

- **Wiki Name** — your wiki's title
- **Superuser** — admin username
- **Real Name** — display name for the admin
- **Email** — admin email address
- **Password** — set a strong admin password
- **ACL Policy** — choose "Open Wiki" (anyone can read/edit), "Public Wiki" (anyone can read, registered users edit), or "Closed Wiki" (registered users only)

Click **Save**. DokuWiki creates the initial configuration.

### 2. Restart the Container

After running the installer, restart the container to finalize the setup:

```bash
docker compose restart dokuwiki
```

### 3. Enable Nice URLs

Log in as admin, then go to **Admin > Configuration Settings**:

1. Find **Use nice URLs** — set to `.htaccess`
2. Check **Use slash as namespace separator in URLs**
3. Click **Save**

This changes URLs from `doku.php?id=page:name` to `/page/name`.

## Configuration

### Access Control Lists (ACLs)

DokuWiki uses ACLs for permissions. Go to **Admin > Access Control List Management**:

- Set namespace-level permissions (e.g., `engineering:*` readable by the `engineers` group)
- Permissions: None, Read, Edit, Create, Upload, Delete
- Permissions cascade — a rule on a namespace applies to all pages below it

### User Management

Go to **Admin > User Manager** to create accounts. For larger deployments, configure LDAP or Active Directory authentication through the `authldap` plugin.

### Plugins

DokuWiki's plugin system is its greatest strength. Go to **Admin > Extension Manager** to browse and install plugins directly from the admin panel.

Essential plugins:

- **Wrap** — advanced text/box formatting
- **Tag** — tag-based page organization
- **Move** — rename and move pages with automatic link updates
- **Discussion** — add comment threads to pages
- **LDAP Auth** — integrate with Active Directory/LDAP
- **Markdown** — write in Markdown instead of DokuWiki syntax

### DokuWiki Syntax

DokuWiki uses its own markup syntax (not Markdown by default):

```
====== Heading 1 ======
===== Heading 2 =====
==== Heading 3 ====

**bold**  //italic//  __underline__  ''monospaced''

  * Unordered list item
  - Ordered list item

[[pagename|Link text]]
[[https://example.com|External link]]

{{:image.png|Alt text}}
```

If you prefer Markdown, install the Markdown plugin.

## Advanced Configuration (Optional)

### Template Customization

DokuWiki templates control the site appearance. The default template works well, but popular alternatives include:

- **Mikio** — modern, responsive design
- **Bootstrap3** — Bootstrap-based theme
- **Argon** — clean, minimal

Install templates through the Extension Manager like plugins.

### Caching

DokuWiki caches rendered pages aggressively by default. To adjust, edit `conf/local.php`:

```php
$conf['cachetime'] = 86400; // Cache duration in seconds (default: 1 day)
```

### Namespaces

DokuWiki organizes pages into namespaces (similar to folders). Create a page at `engineering:setup-guide` to put it in the `engineering` namespace. Create `engineering:start` to set the namespace landing page.

## Reverse Proxy

Configure your reverse proxy to forward to port 8080. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full details.

**Caddy** example:

```
wiki.yourdomain.com {
    reverse_proxy localhost:8080
}
```

**Nginx Proxy Manager:** Create a proxy host pointing to `http://dokuwiki:80` (same Docker network) or `http://your-server-ip:8080`.

## Backup

DokuWiki's flat-file architecture makes backups trivial. Everything lives in the `/config` volume:

```bash
# Back up the entire DokuWiki instance
docker run --rm -v dokuwiki_config:/data -v $(pwd):/backup alpine \
  tar czf /backup/dokuwiki-backup-$(date +%Y%m%d).tar.gz -C /data .
```

Key directories inside `/config`:

- `dokuwiki/data/pages/` — all wiki page content (plain text)
- `dokuwiki/data/media/` — uploaded files and images
- `dokuwiki/data/meta/` — page metadata (edit history, creation dates)
- `dokuwiki/conf/` — configuration files, ACLs, user database

To restore: extract the tarball into the named volume before starting the container.

Since everything is flat files, you can also back up DokuWiki by simply rsyncing the volume directory. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete approach.

## Troubleshooting

### install.php Returns 404 After Setup

**Symptom:** Trying to access `install.php` after the initial setup returns a 404 or forbidden error.

**Fix:** This is expected. DokuWiki removes `install.php` after the first successful setup for security. If you need to re-run the installer, create an empty `install.php` in the DokuWiki directory and restart the container.

### Permission Denied Errors

**Symptom:** DokuWiki can't save pages or upload media. Errors about "Permission denied" in the admin panel.

**Fix:** Check that `PUID` and `PGID` environment variables match the owner of the data files. The LinuxServer.io image sets ownership based on these values. Fix with:

```bash
docker compose exec dokuwiki chown -R abc:abc /config/dokuwiki
```

### Plugins Won't Install

**Symptom:** Extension Manager fails to download or install plugins.

**Fix:** Verify the container has internet access. Check DNS resolution inside the container:

```bash
docker compose exec dokuwiki nslookup download.dokuwiki.org
```

If DNS fails, add DNS settings to your Compose file:

```yaml
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

### Slow Performance with Many Pages

**Symptom:** Wiki becomes slow with thousands of pages.

**Fix:** DokuWiki's flat-file approach scales to tens of thousands of pages but can slow down with heavy indexing. Enable the built-in caching (it's on by default). For very large wikis (50,000+ pages), consider [Wiki.js](/apps/wikijs) or [BookStack](/apps/bookstack) with a database backend.

## Resource Requirements

- **RAM:** ~80 MB idle, scales with concurrent users. 256 MB handles dozens of concurrent editors.
- **CPU:** Minimal. PHP processes page requests on demand.
- **Disk:** ~100 MB for the application, plus your content and media files.

DokuWiki is one of the lightest wiki options available.

## Verdict

DokuWiki is the right choice when simplicity matters most. No database, no complex setup, no migration headaches. Back up your wiki by copying a folder. Restore it by pasting it back. The plugin ecosystem is massive and covers nearly every use case.

The trade-offs are real: the default syntax isn't Markdown (though a plugin adds it), the UI looks dated compared to [Wiki.js](/apps/wikijs) or [BookStack](/apps/bookstack), and the WYSIWYG editor is basic. If your team values modern UI and native Markdown, look at Wiki.js instead.

**Choose DokuWiki if:** you want zero database dependencies, easy backups, and a massive plugin ecosystem.

**Choose [Wiki.js](/apps/wikijs) if:** you want a modern UI, Git sync, and native Markdown.

**Choose [MediaWiki](/apps/mediawiki) if:** you want Wikipedia-style features like structured data, extensions, and massive scalability.

## Related

- [DokuWiki vs MediaWiki](/compare/dokuwiki-vs-mediawiki)
- [Wiki.js vs DokuWiki](/compare/wikijs-vs-dokuwiki)
- [How to Self-Host Wiki.js](/apps/wikijs)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host MediaWiki](/apps/mediawiki)
- [Best Self-Hosted Wiki](/best/wiki)
- [Self-Hosted Alternatives to Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

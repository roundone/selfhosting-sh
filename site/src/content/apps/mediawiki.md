---
title: "How to Self-Host MediaWiki with Docker Compose"
description: "Deploy MediaWiki with Docker Compose and MariaDB. The wiki engine behind Wikipedia, self-hosted for your team or project."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "wiki"
apps:
  - mediawiki
tags:
  - docker
  - wiki
  - documentation
  - mediawiki
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is MediaWiki?

MediaWiki is the wiki engine behind Wikipedia. It powers one of the most visited websites on the planet and is designed for massive scale, structured content, and collaborative editing. For self-hosting, MediaWiki is the right choice when you need Wikipedia-style features: structured data (via Wikibase), templates, categories, interwiki linking, and an extension ecosystem built over two decades. [Official site](https://www.mediawiki.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space
- 512 MB of RAM minimum, 1 GB recommended
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  mediawiki:
    image: mediawiki:1.43.6
    container_name: mediawiki
    ports:
      - "8080:80"            # Web UI
    volumes:
      - mediawiki-images:/var/www/html/images    # Uploaded files
      - mediawiki-extensions:/var/www/html/extensions  # Custom extensions
      - mediawiki-skins:/var/www/html/skins      # Custom skins
    depends_on:
      mediawiki-db:
        condition: service_healthy
    restart: unless-stopped

  mediawiki-db:
    image: mariadb:11-jammy
    container_name: mediawiki-db
    environment:
      MYSQL_ROOT_PASSWORD: change-me-root-password       # CHANGE THIS
      MYSQL_DATABASE: mediawiki
      MYSQL_USER: mediawiki
      MYSQL_PASSWORD: change-me-to-a-strong-password     # CHANGE THIS
    volumes:
      - mediawiki-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mediawiki-images:
  mediawiki-extensions:
  mediawiki-skins:
  mediawiki-db-data:
```

Start the stack:

```bash
docker compose up -d
```

MediaWiki is available at `http://your-server-ip:8080`.

## Initial Setup

### 1. Run the Web Installer

Navigate to `http://your-server-ip:8080` in your browser. You'll see the MediaWiki installation wizard.

1. **Language** — select your wiki language and installer language
2. **Welcome** — environment checks (should all pass in the Docker container)
3. **Database settings:**
   - Database type: **MariaDB, MySQL, or compatible**
   - Database host: `mediawiki-db`
   - Database name: `mediawiki`
   - Database username: `mediawiki`
   - Database password: the password from your Compose file
4. **Name** — set the wiki name and create the admin account
5. **Options** — configure user rights, extensions, and email settings

### 2. Download LocalSettings.php

After completing the wizard, MediaWiki generates a `LocalSettings.php` file. **Download it** — this is your wiki's configuration file.

### 3. Mount LocalSettings.php

Copy the downloaded `LocalSettings.php` to your project directory, then add it to your Compose file:

```yaml
  mediawiki:
    image: mediawiki:1.43.6
    container_name: mediawiki
    ports:
      - "8080:80"
    volumes:
      - mediawiki-images:/var/www/html/images
      - mediawiki-extensions:/var/www/html/extensions
      - mediawiki-skins:/var/www/html/skins
      - ./LocalSettings.php:/var/www/html/LocalSettings.php    # Add this line
    depends_on:
      mediawiki-db:
        condition: service_healthy
    restart: unless-stopped
```

Restart:

```bash
docker compose up -d
```

Your wiki is now fully configured and ready to use.

## Configuration

### LocalSettings.php

All MediaWiki configuration lives in `LocalSettings.php`. Key settings to adjust:

```php
# Site name and URL
$wgSitename = "My Wiki";
$wgServer = "https://wiki.yourdomain.com";  # Update for reverse proxy

# File uploads
$wgEnableUploads = true;
$wgMaxUploadSize = 1024 * 1024 * 50;  # 50 MB max upload

# Email (for notifications and password resets)
$wgEnableEmail = true;
$wgSMTP = [
    'host' => 'smtp.example.com',
    'port' => 587,
    'auth' => true,
    'username' => 'your-email',
    'password' => 'your-password',
];

# Performance
$wgMainCacheType = CACHE_ACCEL;
$wgCacheDirectory = "$IP/cache";

# Short URLs (recommended)
$wgArticlePath = "/wiki/$1";
$wgUsePathInfo = true;
```

### Extensions

MediaWiki's extension system is where its real power lies. Popular extensions for self-hosted wikis:

- **VisualEditor** — WYSIWYG editing (bundled but needs Parsoid)
- **Cite** — footnotes and references
- **CategoryTree** — hierarchical category browsing
- **ParserFunctions** — template logic
- **Scribunto** — Lua scripting for templates
- **MultimediaViewer** — lightbox for images

Install extensions by downloading them to the `extensions` volume and adding `wfLoadExtension('ExtensionName');` to `LocalSettings.php`.

### Short URLs

By default, MediaWiki URLs look like `/index.php?title=Page_name`. To get clean URLs like `/wiki/Page_name`, add to `LocalSettings.php`:

```php
$wgArticlePath = "/wiki/$1";
$wgUsePathInfo = true;
```

And create an `.htaccess` or configure your reverse proxy to handle the rewrite.

## Advanced Configuration (Optional)

### VisualEditor with Parsoid

MediaWiki's VisualEditor requires Parsoid. In MediaWiki 1.43+, Parsoid is bundled. Enable it:

```php
wfLoadExtension('VisualEditor');
$wgVisualEditorAvailableNamespaces = [
    NS_MAIN => true,
    NS_USER => true,
];
$wgDefaultUserOptions['visualeditor-enable'] = 1;
```

### Caching with Redis

For larger wikis, add Redis for object caching:

```yaml
  redis:
    image: redis:7-alpine
    container_name: mediawiki-redis
    restart: unless-stopped
```

Then in `LocalSettings.php`:

```php
$wgObjectCaches['redis'] = [
    'class' => 'RedisBagOStuff',
    'servers' => ['mediawiki-redis:6379'],
];
$wgMainCacheType = 'redis';
$wgSessionCacheType = 'redis';
```

### LDAP Authentication

For team wikis, integrate with Active Directory or LDAP using the `LDAPProvider` and `PluggableAuth` extensions.

## Reverse Proxy

Configure your reverse proxy to forward to port 8080. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

When running behind a reverse proxy, update `LocalSettings.php`:

```php
$wgServer = "https://wiki.yourdomain.com";

// If behind a reverse proxy, trust the proxy headers
$wgSquidServersNoPurge = ['172.0.0.0/8'];  // Docker network range
```

**Caddy** example:

```
wiki.yourdomain.com {
    reverse_proxy localhost:8080
}
```

## Backup

### Database

```bash
docker exec mediawiki-db mariadb-dump -u mediawiki -p'your-password' mediawiki > mediawiki-db-$(date +%Y%m%d).sql
```

### Uploaded Files

```bash
docker cp mediawiki:/var/www/html/images ./mediawiki-images-backup
```

### Configuration

```bash
cp LocalSettings.php LocalSettings.php.backup
```

MediaWiki also includes a built-in maintenance script for XML dumps:

```bash
docker exec mediawiki php maintenance/dumpBackup.php --full > mediawiki-content-$(date +%Y%m%d).xml
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete approach.

## Troubleshooting

### "Error creating thumbnail" for Uploaded Images

**Symptom:** Image thumbnails don't generate. Errors in Special:Log about ImageMagick or GD.

**Fix:** The official Docker image includes GD. For ImageMagick support, you need to install it. Create a custom Dockerfile extending the official image:

```dockerfile
FROM mediawiki:1.43.6
RUN apt-get update && apt-get install -y imagemagick && rm -rf /var/lib/apt/lists/*
```

Add to `LocalSettings.php`:

```php
$wgUseImageMagick = true;
$wgImageMagickConvertCommand = "/usr/bin/convert";
```

### "Wiki not found" After Moving LocalSettings.php

**Symptom:** Wiki shows the installation wizard again after restarting.

**Fix:** Verify the `LocalSettings.php` volume mount is correct. The file must be mounted at `/var/www/html/LocalSettings.php` inside the container. Check with:

```bash
docker exec mediawiki ls -la /var/www/html/LocalSettings.php
```

### Database Connection Errors

**Symptom:** "Cannot access the database" errors on page load.

**Fix:** Verify `$wgDBserver` in `LocalSettings.php` is set to the Docker service name (`mediawiki-db`), not `localhost`. Ensure the database container is running and healthy.

### Slow Page Loads

**Symptom:** Pages take several seconds to render.

**Fix:** Enable caching. Add PHP opcache (enabled by default in the Docker image) and configure object caching with Redis (see Advanced Configuration). For large wikis, consider adding a CDN layer.

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB–1 GB recommended for active use with VisualEditor
- **CPU:** Low to medium. Template-heavy pages can be CPU-intensive during parsing.
- **Disk:** ~500 MB for the application, plus database and uploaded files.

## Verdict

MediaWiki is the most powerful self-hosted wiki available. The template system, structured data support, extension ecosystem, and proven scalability are unmatched. It literally runs Wikipedia.

The trade-off is complexity. MediaWiki's setup is more involved than [Wiki.js](/apps/wikijs) or [BookStack](/apps/bookstack), the default editing experience is wiki-syntax-based (VisualEditor adds WYSIWYG but requires extra setup), and theming is less intuitive. For a small team wiki, MediaWiki is overkill. For a large knowledge base with complex organizational needs, nothing else comes close.

**Choose MediaWiki if:** you need Wikipedia-level features — templates, structured data, categories, and scalability to millions of pages.

**Choose [Wiki.js](/apps/wikijs) if:** you want a modern, easy-to-set-up wiki with a great editor experience.

**Choose [DokuWiki](/apps/dokuwiki) if:** you want zero database overhead and flat-file simplicity.

## Related

- [DokuWiki vs MediaWiki](/compare/dokuwiki-vs-mediawiki)
- [Wiki.js vs BookStack](/compare/wikijs-vs-bookstack)
- [How to Self-Host Wiki.js](/apps/wikijs)
- [How to Self-Host DokuWiki](/apps/dokuwiki)
- [How to Self-Host BookStack](/apps/bookstack)
- [Best Self-Hosted Wiki](/best/wiki)
- [Self-Hosted Alternatives to Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

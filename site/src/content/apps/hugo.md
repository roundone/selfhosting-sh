---
title: "How to Self-Host Hugo with Docker"
description: "Step-by-step guide to self-hosting Hugo static sites with Docker Compose, including multi-stage builds, Nginx serving, theme setup, and automated deploys."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "cms-websites"
apps:
  - hugo
tags:
  - docker
  - hugo
  - static-site
  - cms
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Hugo?

Hugo is an open-source static site generator written in Go. It takes Markdown content and templates, and compiles them into plain HTML files in milliseconds. A site with thousands of pages builds in under a second. Unlike Ghost or WordPress, Hugo has no database, no server-side runtime, and no admin panel — you write Markdown files, run `hugo`, and deploy the output to any web server. The result is a site that loads instantly, costs almost nothing to host, and has virtually no attack surface. [Official site](https://gohugo.io/)

Hugo is not a typical Docker app. There is no persistent service to run. Instead, you use Docker in two ways: a development server with live reload for writing content, and a multi-stage build pipeline that compiles your site and serves it through Nginx in production.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (for builds; the production Nginx container uses ~20 MB)
- A Hugo site initialized locally or in a git repository
- Basic familiarity with Markdown
- A domain name (optional, for production deployment)

## Docker Compose for Development

The development setup runs Hugo's built-in server with live reload. Every time you save a file, the browser updates automatically.

Create a project directory:

```bash
mkdir -p ~/hugo-site && cd ~/hugo-site
```

Create a `docker-compose.dev.yml` file:

```yaml
services:
  hugo:
    image: ghcr.io/gohugoio/hugo:v0.145.0
    container_name: hugo-dev
    command: server --bind 0.0.0.0 --baseURL http://localhost:1313 --appendPort=false --disableFastRender
    volumes:
      - ./:/project                  # Mount your Hugo project root
    ports:
      - "1313:1313"                  # Dev server with live reload
    working_dir: /project
    restart: unless-stopped
```

Start the development server:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Open `http://your-server-ip:1313` in your browser. Edit any Markdown file in `content/` and the page reloads automatically.

**Key flags explained:**

- `--bind 0.0.0.0` — Listen on all interfaces, not just localhost (required inside Docker)
- `--disableFastRender` — Rebuild the full page on changes, not just the changed section. Slower but avoids stale content bugs
- `--appendPort=false` — Keeps URLs clean when accessed through a reverse proxy

If you do not have an existing Hugo site, create one first:

```bash
docker run --rm -v $(pwd):/project -w /project ghcr.io/gohugoio/hugo:v0.145.0 new site . --force
```

## Production Deployment with Docker

Production uses a multi-stage approach: Hugo builds the static HTML, then Nginx serves it. This produces a tiny, secure container with no build tools or Go runtime — just Nginx and your HTML files.

### Dockerfile

Create a `Dockerfile` in your Hugo project root:

```dockerfile
# Stage 1: Build the site with Hugo
FROM ghcr.io/gohugoio/hugo:v0.145.0 AS builder

WORKDIR /site
COPY . .

# Download theme submodules if using git submodules
RUN if [ -f .gitmodules ]; then apk add --no-cache git && git submodule update --init --recursive; fi

# Build the site — output goes to /site/public/
RUN hugo --minify --gc

# Stage 2: Serve with Nginx
FROM nginx:1.28-alpine

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built site from Hugo stage
COPY --from=builder /site/public/ /usr/share/nginx/html/

# Copy custom Nginx config for clean URLs and caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://localhost/ || exit 1
```

### Nginx Configuration

Create an `nginx.conf` file in your project root:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Clean URLs — serve /about/ from /about/index.html
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # Cache static assets aggressively
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Custom 404 page (Hugo generates this if you create layouts/404.html)
    error_page 404 /404.html;
}
```

### Docker Compose for Production

Create a `docker-compose.yml` file:

```yaml
services:
  hugo-site:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hugo-site
    ports:
      - "8080:80"                    # Web UI — map to any available host port
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO", "/dev/null", "http://localhost/"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

networks:
  default:
    name: hugo-network
```

Build and start:

```bash
docker compose up -d --build
```

Your site is now live at `http://your-server-ip:8080`. The entire container is roughly 15-25 MB depending on your content.

### Rebuilding After Content Changes

Hugo is a build tool, not a live service. When you update content, rebuild the container:

```bash
docker compose up -d --build
```

Docker layer caching makes subsequent builds fast — typically under 10 seconds for content-only changes.

## Configuration

Hugo uses a `hugo.toml` file (previously `config.toml`) in the project root. Here is a production-ready starting configuration:

```toml
baseURL = "https://example.com/"        # Your production domain — MUST include trailing slash
languageCode = "en-us"
title = "My Self-Hosted Site"
theme = "your-theme-name"               # Must match directory name in themes/

# Build settings
[build]
  writeStats = true                     # Enables PurgeCSS integration

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true                     # Allow raw HTML in Markdown (disable if untrusted authors)
  [markup.highlight]
    style = "monokai"                   # Syntax highlighting theme
    lineNos = false
    noClasses = false

[params]
  description = "Site description for SEO"
  author = "Your Name"

# Sitemap and RSS
[sitemap]
  changefreq = "weekly"
  filename = "sitemap.xml"
  priority = 0.5

[outputs]
  home = ["HTML", "RSS", "JSON"]        # JSON enables search integration

# Minification (also enabled via --minify flag)
[minify]
  disableCSS = false
  disableHTML = false
  disableJS = false
  disableSVG = false
  minifyOutput = true

# Permalink structure
[permalinks]
  posts = "/:year/:month/:slug/"
  pages = "/:slug/"
```

**Key settings to change:**

- `baseURL` — Must match your production domain exactly, including the protocol and trailing slash. Wrong values break all internal links and RSS feeds.
- `theme` — Must match a directory name in `themes/`. Without this, Hugo builds an empty site.
- `markup.goldmark.renderer.unsafe` — Set to `false` if you accept content from untrusted contributors.

## Themes

Hugo themes are installed as git submodules in the `themes/` directory. This keeps theme code separate from your content and makes updates clean.

### Installing a Theme

```bash
# From your Hugo project root
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
```

Set the theme in `hugo.toml`:

```toml
theme = "ananke"
```

### Popular Themes for Self-Hosted Sites

| Theme | Best For | Notes |
|-------|----------|-------|
| PaperMod | Blogs, documentation | Clean, fast, well-maintained |
| Blowfish | Personal sites, portfolios | Tailwind CSS, dark mode |
| Congo | Documentation, content sites | Feature-rich, good SEO defaults |
| Ananke | Getting started | Official starter theme |
| Docsy | Technical documentation | Google-maintained, complex setup |

### Theme Customization

Override any theme template by creating the same file path in your project's `layouts/` directory. Hugo checks your project's `layouts/` before the theme's.

```bash
# Override the theme's single post template
mkdir -p layouts/_default
cp themes/papermod/layouts/_default/single.html layouts/_default/single.html
# Edit layouts/_default/single.html with your changes
```

### Hugo Extended for SCSS/SASS Themes

Some themes require Hugo Extended for SCSS/SASS processing. The official Docker image (`ghcr.io/gohugoio/hugo`) ships the Extended edition by default, so no changes are needed. If you use a community image, verify it includes the Extended build.

## Content Management

Hugo content lives in the `content/` directory as Markdown files. Each file has YAML front matter at the top.

### Creating Content

```bash
# Using the Hugo CLI inside Docker
docker run --rm -v $(pwd):/project -w /project \
  ghcr.io/gohugoio/hugo:v0.145.0 new posts/my-first-post.md
```

This generates a file at `content/posts/my-first-post.md`:

```markdown
---
title: "My First Post"
date: 2026-02-16T12:00:00Z
draft: true
---

Your content here. Standard Markdown with Hugo shortcodes.
```

Set `draft: false` when ready to publish. Hugo excludes drafts from production builds by default.

### Content Organization

```
content/
├── _index.md              # Homepage content
├── about.md               # /about/ page
├── posts/
│   ├── _index.md          # Blog listing page
│   ├── first-post.md      # /posts/first-post/
│   └── second-post.md     # /posts/second-post/
└── docs/
    ├── _index.md          # Docs section listing
    └── getting-started.md # /docs/getting-started/
```

Directories under `content/` become URL sections. Each `_index.md` controls the listing page for that section.

### Page Bundles

For posts with images, use page bundles — a directory instead of a single file:

```
content/posts/my-post/
├── index.md               # The post content
├── hero.jpg               # Images co-located with the post
└── diagram.png
```

Reference images with relative paths in Markdown: `![Alt text](hero.jpg)`.

## Automated Builds

Since Hugo requires a rebuild after every content change, automating that process is essential for a smooth workflow.

### Webhook-Triggered Rebuilds

Use a lightweight webhook listener to trigger rebuilds when you push content changes to git.

Create a `webhook/rebuild.sh` script:

```bash
#!/bin/bash
set -euo pipefail

SITE_DIR="/opt/hugo-site"
LOG_FILE="/var/log/hugo-rebuild.log"

echo "$(date -u +'%Y-%m-%d %H:%M UTC') — Rebuild triggered" >> "$LOG_FILE"

cd "$SITE_DIR"
git pull origin main >> "$LOG_FILE" 2>&1
docker compose up -d --build >> "$LOG_FILE" 2>&1

echo "$(date -u +'%Y-%m-%d %H:%M UTC') — Rebuild complete" >> "$LOG_FILE"
```

Add a webhook service to your Docker Compose:

```yaml
services:
  hugo-site:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hugo-site
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO", "/dev/null", "http://localhost/"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

  webhook:
    image: almir/webhook:2.8.1
    container_name: hugo-webhook
    command: -hooks /etc/webhook/hooks.json -verbose
    volumes:
      - ./webhook:/etc/webhook           # Webhook configuration
      - /var/run/docker.sock:/var/run/docker.sock  # Access to rebuild containers
      - ./:/opt/hugo-site                # Hugo project directory
    ports:
      - "9000:9000"                      # Webhook listener port
    restart: unless-stopped

networks:
  default:
    name: hugo-network
```

Create `webhook/hooks.json`:

```json
[
  {
    "id": "rebuild",
    "execute-command": "/etc/webhook/rebuild.sh",
    "command-working-directory": "/opt/hugo-site",
    "pass-arguments-to-command": [],
    "trigger-rule": {
      "match": {
        "type": "value",
        "value": "your-webhook-secret",
        "parameter": {
          "source": "header",
          "name": "X-Webhook-Secret"
        }
      }
    }
  }
]
```

Configure your git hosting provider (GitHub, Gitea, Forgejo) to send a POST request to `http://your-server:9000/hooks/rebuild` with the `X-Webhook-Secret` header on every push.

### Cron-Based Rebuilds

If webhooks are not an option, use a simple cron job on the host:

```bash
# Rebuild every 15 minutes if the git repo has new commits
*/15 * * * * cd /opt/hugo-site && git fetch origin && [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ] && git pull origin main && docker compose up -d --build >> /var/log/hugo-rebuild.log 2>&1
```

## Reverse Proxy

In production, put Hugo behind a reverse proxy for HTTPS. Since Hugo's production container is just Nginx serving static files, the proxy configuration is straightforward.

### Nginx Proxy Manager

Create a new Proxy Host:
- **Domain:** `yourdomain.com`
- **Forward Hostname:** `hugo-site` (container name)
- **Forward Port:** `80`
- **Enable SSL** with Let's Encrypt
- **Force SSL:** Yes
- **HTTP/2:** Yes

Make sure both containers share the same Docker network. Add the network to your Hugo `docker-compose.yml`:

```yaml
networks:
  default:
    name: proxy-network
    external: true
```

For a full reverse proxy setup, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained).

### Caddy

If you use [Caddy](/apps/caddy) as your reverse proxy, add to your Caddyfile:

```caddyfile
yourdomain.com {
    reverse_proxy hugo-site:80
    encode gzip
}
```

Caddy handles HTTPS certificates automatically.

## Backup

Hugo sites are inherently easy to back up because everything is files — no database dumps required.

### What to Back Up

| Path | Contents | Priority |
|------|----------|----------|
| `content/` | All Markdown posts and pages | Critical — this is your content |
| `hugo.toml` | Site configuration | Critical |
| `static/` | Images, favicons, custom CSS/JS | Critical |
| `layouts/` | Template overrides | Important |
| `themes/` | Theme (tracked as git submodule) | Low — can re-clone |
| `public/` | Built HTML output | Skip — regenerated on build |

### Backup Strategy

If your Hugo site is in a git repository (it should be), your content is already versioned and backed up on your remote. For belt-and-suspenders protection:

```bash
# Back up the entire project directory (excluding build output)
tar --exclude='public' --exclude='.git' -czf hugo-backup-$(date +%Y%m%d).tar.gz /opt/hugo-site/
```

For a comprehensive approach, see [Backup Strategy — The 3-2-1 Rule](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Hugo Build Fails with "TOCSS: failed to transform"

**Symptom:** Build error mentioning SCSS/SASS transformation failure.

**Fix:** Your theme requires Hugo Extended. The official Docker image (`ghcr.io/gohugoio/hugo`) includes Extended by default. If you are using a community image, switch to the official one or verify the image includes the Extended edition:

```bash
docker run --rm ghcr.io/gohugoio/hugo:v0.145.0 version
# Should show "extended" in the output
```

### Site Builds But Pages Are Blank

**Symptom:** Hugo builds without errors, but the site shows empty pages or a blank homepage.

**Fix:** This almost always means the theme is not loaded correctly. Check:

1. The `theme` value in `hugo.toml` matches the directory name in `themes/`
2. The theme submodule was initialized: `git submodule update --init --recursive`
3. In Docker, the `.gitmodules` file and `themes/` directory are properly mounted or copied

### Live Reload Not Working in Docker

**Symptom:** The dev server runs, but changes to content do not trigger a browser reload.

**Fix:** Hugo's file watcher can miss changes when files are mounted from the host via Docker volumes on certain filesystems. Add the `--poll` flag:

```yaml
command: server --bind 0.0.0.0 --baseURL http://localhost:1313 --appendPort=false --disableFastRender --poll 500ms
```

The `--poll 500ms` flag forces Hugo to poll for changes every 500 milliseconds instead of relying on filesystem events.

### baseURL Mismatch Causes Broken Links

**Symptom:** Links, CSS, and JavaScript paths point to `localhost` or the wrong domain in production.

**Fix:** The `baseURL` in `hugo.toml` must exactly match your production URL, including the protocol and trailing slash. If you use different URLs for development and production, override it at build time:

```bash
hugo --minify --gc --baseURL https://yourdomain.com/
```

### Docker Build Fails on Git Submodules

**Symptom:** The Dockerfile fails at the `git submodule update` step.

**Fix:** The official Hugo image is Alpine-based and does not include `git` by default. The Dockerfile provided above installs it conditionally. If you see errors about git not found, ensure this line exists in your Dockerfile's build stage:

```dockerfile
RUN if [ -f .gitmodules ]; then apk add --no-cache git && git submodule update --init --recursive; fi
```

Also make sure your `.gitmodules` file and `.git` directory are not excluded by `.dockerignore`.

## Resource Requirements

Hugo is remarkably lightweight:

- **Build (Hugo container):** 256-512 MB RAM during builds, negligible CPU time (builds thousands of pages in <1 second). The build container exits after generating HTML.
- **Production (Nginx container):** ~20 MB RAM idle. Handles thousands of concurrent requests with minimal CPU.
- **Disk:** The Hugo Docker image is ~80 MB. The Nginx Alpine image is ~40 MB. Your built site is typically 5-50 MB depending on images.
- **CPU:** Trivial. Hugo builds are CPU-bound but finish in milliseconds to seconds. Nginx serving static files barely registers on a CPU monitor.

Hugo is one of the least resource-intensive options for running a website. A single VPS can host dozens of Hugo sites behind one Nginx instance.

## Verdict

Hugo is the best option for developers and technical users who want a fast, secure, low-maintenance website. If you are comfortable writing Markdown and can run `docker compose up`, Hugo gives you a site that loads in under 100ms, costs next to nothing to serve, and has zero security vulnerabilities from server-side code.

Choose Hugo over [Ghost](/apps/ghost) if you do not need a web-based editor, memberships, or newsletters. Ghost is a full CMS with a database — powerful but heavier. Hugo is a build tool that produces plain HTML — simpler and faster.

Choose Hugo over [WordPress](/apps/wordpress) if you want speed, security, and simplicity above all else. WordPress has a massive plugin ecosystem and visual editing, but it requires PHP, MySQL, and constant security patching. Hugo has none of that overhead.

Choose Ghost or WordPress over Hugo if non-technical people need to edit content through a web browser, or if you need built-in membership and payment features.

For most personal blogs, documentation sites, and project pages maintained by a developer, Hugo is the right call.

## Related

- [How to Self-Host Ghost with Docker Compose](/apps/ghost)
- [How to Self-Host WordPress with Docker Compose](/apps/wordpress)
- [How to Self-Host Nginx with Docker](/apps/nginx)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [Ghost vs WordPress: Which Should You Self-Host?](/compare/ghost-vs-wordpress)
- [Best Self-Hosted CMS Platforms](/best/cms-websites)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Backup Strategy — The 3-2-1 Rule](/foundations/backup-3-2-1-rule)

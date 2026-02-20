---
title: "How to Self-Host Mealie with Docker Compose"
description: "Deploy Mealie with Docker Compose — a self-hosted recipe manager with meal planning, grocery lists, and web scraping."
date: 2026-02-16
dateUpdated: 2026-02-19
category: "recipes"
apps:
  - mealie
tags:
  - self-hosted
  - mealie
  - docker
  - recipes
  - meal-planning
  - grocery-list
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Mealie?

[Mealie](https://mealie.io/) is a self-hosted recipe manager and meal planner. Paste a URL from any recipe site, and Mealie scrapes the recipe — title, ingredients, steps, image, and nutrition info. Organize recipes into categories and tags, plan meals on a weekly calendar, generate grocery lists, and share recipes with family. It replaces Paprika, Anylist, and the dozens of recipe sites cluttered with ads and life stories.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- 1 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  mealie:
    image: ghcr.io/mealie-recipes/mealie:v3.10.2
    container_name: mealie
    restart: unless-stopped
    ports:
      - "9925:9000"
    environment:
      ALLOW_SIGNUP: "true"                    # Set to "false" after creating your account
      PUID: "1000"
      PGID: "1000"
      TZ: "America/New_York"
      BASE_URL: "http://localhost:9925"       # Set to your public URL
      MAX_WORKERS: "1"                        # Increase on multi-core systems
      WEB_CONCURRENCY: "1"
      DB_ENGINE: "postgres"
      POSTGRES_USER: "mealie"
      POSTGRES_PASSWORD: "change_this_strong_password"   # Must match PostgreSQL
      POSTGRES_SERVER: "mealie_db"
      POSTGRES_PORT: "5432"
      POSTGRES_DB: "mealie"
    volumes:
      - mealie_data:/app/data
    depends_on:
      mealie_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/api/app/about"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  mealie_db:
    image: postgres:16-alpine
    container_name: mealie_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: mealie
      POSTGRES_PASSWORD: change_this_strong_password
      POSTGRES_DB: mealie
    volumes:
      - mealie_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mealie"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mealie_data:
  mealie_pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:9925` in your browser
2. Default credentials: `changeme@example.com` / `MyPassword`
3. Change your email and password immediately under **Settings → Profile**
4. Set `ALLOW_SIGNUP: "false"` and restart to disable public registration
5. Start importing recipes by pasting URLs

## Configuration

### Importing Recipes

Three ways to add recipes:

1. **URL Import:** Paste any recipe URL — Mealie scrapes the content automatically. Works with most recipe sites.
2. **Manual Entry:** Create recipes from scratch with the editor
3. **Bulk Import:** Import from Paprika, Tandoor, Nextcloud Cookbook, or plain JSON

### Meal Planning

1. Go to **Meal Planner**
2. Click a day to add a recipe
3. Generate grocery lists from planned meals
4. Share the plan with household members

### Categories and Tags

Organize recipes with:
- **Categories:** Broad groupings (Dinner, Breakfast, Dessert)
- **Tags:** Cross-cutting labels (Quick, Vegetarian, Freezer-Friendly)
- **Tools:** Required equipment (Instant Pot, Air Fryer, Grill)

### Multi-User / Household

Mealie supports multiple users in a household. Each user can have their own favorites while sharing the recipe collection. Create users under **Settings → Users**.

### SMTP for Invitations

```yaml
environment:
  SMTP_HOST: "smtp.example.com"
  SMTP_PORT: "587"
  SMTP_FROM_NAME: "Mealie"
  SMTP_FROM_EMAIL: "mealie@example.com"
  SMTP_AUTH_STRATEGY: "TLS"
  SMTP_USER: "your-email@example.com"
  SMTP_PASSWORD: "your-email-password"
```

## Reverse Proxy

Set `BASE_URL` to your public domain:

```yaml
BASE_URL: "https://recipes.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** mealie
- **Forward Port:** 9000

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

```bash
# Database
docker compose exec mealie_db pg_dump -U mealie mealie > mealie-backup-$(date +%Y%m%d).sql

# Recipe data (images, attachments)
docker run --rm -v mealie_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/mealie-data-$(date +%Y%m%d).tar.gz /data
```

Mealie also has a built-in backup feature under **Settings → Backups**.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### Recipe Import Fails

**Symptom:** Pasting a URL doesn't scrape the recipe, or shows partial data.
**Fix:** Some recipe sites use JavaScript rendering that Mealie can't scrape. Try the URL again — intermittent failures happen with slow sites. For consistently failing sites, manually enter the recipe or use a browser extension to extract the data.

### Images Not Loading

**Symptom:** Recipe images show broken image icons.
**Fix:** Check that `BASE_URL` matches the URL you're accessing Mealie from. Mismatched URLs cause image paths to point to the wrong host.

### Slow Performance

**Symptom:** Page loads are slow, especially with many recipes.
**Fix:** Increase `MAX_WORKERS` and `WEB_CONCURRENCY` based on your CPU cores. With PostgreSQL (recommended over SQLite), performance improves significantly for large collections.

## Resource Requirements

- **RAM:** ~200 MB idle, ~400 MB during recipe scraping
- **CPU:** Low — scraping is occasional and short-lived
- **Disk:** ~150 MB for the application, plus storage for recipe images

## Verdict

Mealie is the best self-hosted recipe manager. The URL scraping works well on most recipe sites, the meal planning calendar is genuinely useful, and the grocery list feature saves real time. The UI is clean and mobile-friendly. If you need a more restaurant-focused solution with scaling and nutrition tracking, look at [Tandoor](/apps/tandoor). But for home cooks who want to organize recipes and plan meals, Mealie is the clear winner.

## Related

- [Best Self-Hosted Recipe Managers](/best/recipes)
- [Mealie vs Tandoor](/compare/mealie-vs-tandoor)
- [How to Self-Host Tandoor](/apps/tandoor)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Docker Volumes Explained](/foundations/docker-volumes)

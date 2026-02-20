---
title: "How to Self-Host Strapi with Docker Compose"
description: "Deploy Strapi v5.36 headless CMS with Docker Compose and PostgreSQL for a flexible, API-first content management system."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "cms-websites"
apps:
  - strapi
tags:
  - self-hosted
  - strapi
  - docker
  - cms
  - headless-cms
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Strapi?

Strapi is an open-source headless CMS built on Node.js. It provides a visual admin panel for defining content types and managing content, while exposing that content through auto-generated REST and GraphQL APIs. It's the most popular open-source headless CMS, used to power websites, mobile apps, and IoT devices. Strapi replaces WordPress for developers who want API-first content delivery. [Official site](https://strapi.io/).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- Node.js 22 (for building the Docker image)
- 2 GB of RAM minimum
- 10 GB of free disk space
- A domain name (optional, for production access)

## Project Setup

Strapi does not publish an official Docker image. You build your own from a Strapi project. First, create a Strapi project:

```bash
npx create-strapi@5.36.1 my-strapi --quickstart --no-run
cd my-strapi
```

### Create a Production Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:22-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install --production
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN yarn build

# Production stage
FROM node:22-alpine
RUN apk add --no-cache vips-dev
ENV NODE_ENV=production

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules

WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node

EXPOSE 1337
CMD ["yarn", "start"]
```

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  strapi:
    container_name: strapi
    build: .
    image: my-strapi:5.36.1
    ports:
      - "1337:1337"
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: strapi-db
      DATABASE_PORT: "5432"
      DATABASE_NAME: strapi
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: change-me-to-a-strong-password  # CHANGE THIS
      JWT_SECRET: change-me-jwt-secret-32-chars-min      # CHANGE THIS — generate with: openssl rand -base64 32
      ADMIN_JWT_SECRET: change-me-admin-jwt-secret       # CHANGE THIS — generate with: openssl rand -base64 32
      APP_KEYS: key1-change-me,key2-change-me            # CHANGE THIS — comma-separated random strings
      API_TOKEN_SALT: change-me-api-salt                 # CHANGE THIS — generate with: openssl rand -base64 32
      TRANSFER_TOKEN_SALT: change-me-transfer-salt       # CHANGE THIS — generate with: openssl rand -base64 32
      NODE_ENV: production
      STRAPI_TELEMETRY_DISABLED: "true"
    volumes:
      - strapi-uploads:/opt/app/public/uploads
    depends_on:
      strapi-db:
        condition: service_healthy
    restart: unless-stopped

  strapi-db:
    image: postgres:16-alpine
    container_name: strapi-db
    environment:
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: change-me-to-a-strong-password  # Must match DATABASE_PASSWORD above
      POSTGRES_DB: strapi
    volumes:
      - strapi-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strapi"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  strapi-uploads:
  strapi-db-data:
```

Generate secure secrets before starting:

```bash
# Generate all required secrets
echo "JWT_SECRET: $(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET: $(openssl rand -base64 32)"
echo "APP_KEYS: $(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT: $(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT: $(openssl rand -base64 32)"
```

Build and start:

```bash
docker compose up -d --build
```

The first build takes several minutes as it compiles the admin panel.

## Initial Setup

1. Open `http://your-server:1337/admin` in your browser
2. Create your admin account on the first visit
3. Start defining content types through the Content-Type Builder
4. Add content entries through the Content Manager
5. Configure API permissions under Settings > Roles to make content publicly accessible

### API Access

Once content types are created and permissions are set:

- **REST API:** `http://your-server:1337/api/[content-type]`
- **GraphQL API:** `http://your-server:1337/graphql` (requires the GraphQL plugin)

## Configuration

### Database Configuration

Strapi supports PostgreSQL (recommended), MySQL, MariaDB, and SQLite. For MySQL:

```yaml
environment:
  DATABASE_CLIENT: mysql
  DATABASE_HOST: strapi-db
  DATABASE_PORT: "3306"
  DATABASE_NAME: strapi
  DATABASE_USERNAME: strapi
  DATABASE_PASSWORD: your-password
```

### File Upload Storage

By default, Strapi stores uploads on the local filesystem. For production, consider S3-compatible storage:

Install the S3 upload provider in your Strapi project before building the Docker image:

```bash
yarn add @strapi/provider-upload-aws-s3
```

Then configure via environment variables:

```yaml
environment:
  STRAPI_UPLOAD_PROVIDER: aws-s3
  STRAPI_UPLOAD_AWS_ACCESS_KEY_ID: your-key
  STRAPI_UPLOAD_AWS_ACCESS_SECRET: your-secret
  STRAPI_UPLOAD_AWS_REGION: us-east-1
  STRAPI_UPLOAD_AWS_BUCKET: your-bucket
```

### Email Configuration

Install an email provider for transactional emails (password resets, notifications):

```bash
yarn add @strapi/provider-email-sendgrid
```

## Advanced Configuration (Optional)

### GraphQL Plugin

Enable the GraphQL API:

```bash
# In your Strapi project, before building
yarn add @strapi/plugin-graphql
```

Rebuild the Docker image after adding plugins.

### Webhooks

Configure webhooks in the admin panel under Settings > Webhooks to trigger external services when content changes.

## Reverse Proxy

Configure your reverse proxy to forward to port 1337. Example Nginx configuration:

```nginx
location / {
  proxy_pass http://localhost:1337;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full guides with [Nginx Proxy Manager](/apps/nginx-proxy-manager), [Traefik](/apps/traefik), or [Caddy](/apps/caddy).

## Backup

Back up these volumes:

1. **PostgreSQL database:**
```bash
docker exec strapi-db pg_dump -U strapi strapi > strapi-backup.sql
```

2. **Uploaded files:**
```bash
docker cp strapi:/opt/app/public/uploads ./strapi-uploads-backup
```

See [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Build Fails with Sharp/vips Error

**Symptom:** Docker build fails with errors related to `sharp` or `vips`.
**Fix:** Ensure the `vips-dev` package is installed in both the build and production stages of the Dockerfile. On ARM hosts (Raspberry Pi, Apple Silicon), add `platform: linux/amd64` to the strapi service.

### Admin Panel Shows Blank Page

**Symptom:** The admin URL loads but shows a white screen.
**Fix:** The admin panel is compiled at build time. Rebuild the Docker image:

```bash
docker compose up -d --build --force-recreate
```

If you changed `PUBLIC_URL` or `STRAPI_ADMIN_BACKEND_URL`, you must rebuild — these are baked in at compile time.

### Database Connection Refused

**Symptom:** Strapi can't connect to PostgreSQL on startup.
**Fix:** Ensure the `depends_on` with `condition: service_healthy` is set. Check that `DATABASE_HOST` matches the service name in docker-compose.yml (e.g., `strapi-db`, not `localhost`).

### Content-Type Builder Disabled in Production

**Symptom:** Can't create or modify content types in the admin panel.
**Fix:** This is expected behavior. In production mode (`NODE_ENV=production`), the Content-Type Builder is disabled because schema changes require a rebuild. To modify content types, run a development instance locally, make changes, then redeploy.

### Slow Startup After First Build

**Symptom:** Container takes 30-60 seconds to start.
**Fix:** Normal for Strapi. It runs database migrations and bootstraps on startup. The healthcheck should account for this delay.

## Resource Requirements

- **RAM:** 1 GB minimum, 2 GB recommended
- **CPU:** Medium — Node.js single-threaded, build process is CPU-intensive
- **Disk:** 2 GB for the application, plus upload storage

## Verdict

Strapi is the best open-source headless CMS for developers who want a visual admin panel backed by auto-generated APIs. The Content-Type Builder makes defining schemas painless, and the REST/GraphQL APIs work out of the box. It's the right choice if you're building a JAMstack site with [Hugo](/apps/hugo), Astro, or Next.js and need a content backend.

The main drawback is the build-from-source Docker workflow — there's no pre-built image, so every deployment requires compiling the admin panel. This adds minutes to your CI/CD pipeline. If you want a simpler deployment, [Directus](/apps/directus) offers a pre-built Docker image with similar capabilities. If you just want a blog, [Ghost](/apps/ghost) or [WordPress](/apps/wordpress) are simpler choices.

## Related

- [How to Self-Host Directus](/apps/directus)
- [How to Self-Host Ghost](/apps/ghost)
- [How to Self-Host WordPress](/apps/wordpress)
- [How to Self-Host Hugo](/apps/hugo)
- [Ghost vs WordPress](/compare/ghost-vs-wordpress)
- [Best Self-Hosted CMS](/best/cms-websites)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)

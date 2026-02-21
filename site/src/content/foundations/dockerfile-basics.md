---
title: "Dockerfile Basics for Self-Hosting"
description: "Learn Dockerfile fundamentals — build custom images, extend existing containers, and create reproducible self-hosted service deployments."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "dockerfile", "containers", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is a Dockerfile?

A Dockerfile is a text file with instructions for building a Docker image. While most self-hosted apps provide pre-built images (and you should use those), Dockerfiles are useful when you need to customize an image — adding packages, changing configs, or building apps from source.

You'll need Dockerfile knowledge when an app doesn't have a Docker image, when you need to add a cron job inside a container, or when you need to bundle configuration into a reproducible image.

## Prerequisites

- Docker installed on your server ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Basic command line knowledge ([Linux Basics](/foundations/linux-basics-self-hosting/))
- Understanding of Docker images and containers

## Basic Dockerfile Structure

```dockerfile
# Use an existing image as the base
FROM ubuntu:24.04

# Set environment variables
ENV APP_HOME=/opt/myapp \
    APP_USER=appuser

# Install packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -r -s /bin/false -m -d $APP_HOME $APP_USER

# Copy files from your machine into the image
COPY config.yml $APP_HOME/config.yml

# Set working directory
WORKDIR $APP_HOME

# Switch to non-root user
USER $APP_USER

# Expose a port
EXPOSE 8080

# Default command to run
CMD ["./start.sh"]
```

Build and run:

```bash
docker build -t myapp:v1.0 .
docker run -d -p 8080:8080 myapp:v1.0
```

## Key Dockerfile Instructions

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image to build on | `FROM node:22-alpine` |
| `RUN` | Execute a command during build | `RUN apt-get install -y curl` |
| `COPY` | Copy files from host to image | `COPY ./app /opt/app` |
| `ADD` | Like COPY, but can extract archives and fetch URLs | `ADD archive.tar.gz /opt/` |
| `ENV` | Set environment variables | `ENV NODE_ENV=production` |
| `ARG` | Build-time variable (not in final image) | `ARG VERSION=1.0` |
| `WORKDIR` | Set working directory for subsequent instructions | `WORKDIR /opt/app` |
| `USER` | Switch to a non-root user | `USER appuser` |
| `EXPOSE` | Document which ports the container listens on | `EXPOSE 3000` |
| `CMD` | Default command when container starts | `CMD ["node", "server.js"]` |
| `ENTRYPOINT` | Command that always runs (CMD becomes arguments) | `ENTRYPOINT ["python"]` |
| `VOLUME` | Declare a mount point for external data | `VOLUME /data` |
| `HEALTHCHECK` | Define how Docker checks if the container is healthy | See below |

## Practical Self-Hosting Dockerfiles

### Extending an Existing Image

The most common Dockerfile use in self-hosting — adding something to an existing image:

```dockerfile
# Add custom fonts to Nextcloud
FROM nextcloud:29.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    fonts-liberation \
    fonts-noto && \
    rm -rf /var/lib/apt/lists/*
```

### Adding a Health Check

```dockerfile
FROM nginx:1.27

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

COPY nginx.conf /etc/nginx/nginx.conf
COPY html/ /usr/share/nginx/html/
```

### Building a Python App

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached if requirements.txt hasn't changed)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user
RUN useradd -r -s /bin/false appuser
USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### Building a Node.js App

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy source
COPY . .

USER node
EXPOSE 3000

CMD ["node", "server.js"]
```

## Using Dockerfiles with Docker Compose

Instead of referencing a pre-built image, build from a Dockerfile:

```yaml
# docker-compose.yml
services:
  myapp:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - app-data:/data
    restart: unless-stopped

volumes:
  app-data:
```

```bash
# Build and start
docker compose up -d --build

# Rebuild after Dockerfile changes
docker compose build
docker compose up -d
```

### Build Arguments

Pass values at build time:

```dockerfile
FROM python:3.12-slim

ARG APP_VERSION=1.0.0
ENV APP_VERSION=$APP_VERSION

RUN echo "Building version $APP_VERSION"
```

```yaml
services:
  myapp:
    build:
      context: .
      args:
        APP_VERSION: "2.1.0"
```

## Multi-Stage Builds

Multi-stage builds produce smaller images by separating the build environment from the runtime:

```dockerfile
# Stage 1: Build
FROM golang:1.22 AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /app/server .

# Stage 2: Runtime (much smaller image)
FROM alpine:3.20

RUN apk add --no-cache ca-certificates
COPY --from=builder /app/server /usr/local/bin/server

USER nobody
EXPOSE 8080

CMD ["server"]
```

The final image only contains the compiled binary and Alpine (~5 MB), not the full Go toolchain (~800 MB).

## Layer Caching

Docker caches each instruction as a layer. If a layer hasn't changed, Docker reuses the cache. Order your Dockerfile to maximize cache hits:

```dockerfile
# Good — dependencies change less often than source code
FROM node:22-alpine
WORKDIR /app

# Layer 1: package files (rarely change)
COPY package.json package-lock.json ./
RUN npm ci

# Layer 2: source code (changes frequently)
COPY . .

CMD ["node", "server.js"]
```

```dockerfile
# Bad — every source code change invalidates the npm install cache
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]
```

**Rule:** Put things that change infrequently near the top, and things that change often near the bottom.

## Best Practices

### 1. Use Specific Base Image Tags

```dockerfile
# Bad — unpredictable
FROM python:latest

# Good — reproducible
FROM python:3.12-slim
```

### 2. Minimize Layers and Image Size

Combine RUN commands and clean up in the same layer:

```dockerfile
# Good — one layer, cleanup included
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Bad — three layers, apt cache remains in first layer
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore

Prevent unnecessary files from being sent to the Docker daemon:

```
# .dockerignore
.git
.env
node_modules
*.md
docker-compose.yml
```

### 4. Run as Non-Root

```dockerfile
RUN useradd -r -s /bin/false appuser
USER appuser
```

### 5. Use COPY, Not ADD

`COPY` is explicit — it copies files. `ADD` has hidden behavior (auto-extracts archives, fetches URLs). Use `COPY` unless you specifically need `ADD`'s features.

### 6. Set HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

Docker uses this to report container health in `docker ps` and to trigger restarts in swarm mode.

## Common Mistakes

### 1. Running as Root

Containers run as root by default. A vulnerability in the app gives an attacker root inside the container:

```dockerfile
# Add a non-root user
RUN useradd -r -s /bin/false appuser
USER appuser
```

### 2. Using :latest Tag

`FROM python:latest` today might be Python 3.12. Tomorrow it might be 3.13 with breaking changes. Pin your base image version.

### 3. Not Using --no-install-recommends

`apt-get install` pulls recommended packages by default, bloating your image:

```dockerfile
# Installs only what you asked for
RUN apt-get install -y --no-install-recommends curl
```

### 4. Storing Secrets in the Image

Never put passwords or API keys in a Dockerfile — they're baked into every layer:

```dockerfile
# Wrong — secret is in the image forever
ENV API_KEY=sk-1234567890

# Right — pass at runtime
# Use docker-compose.yml environment variables or .env files
```

### 5. Not Cleaning Up Package Manager Cache

```dockerfile
# Always clean up in the same RUN layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
```

## FAQ

### When should I use a Dockerfile vs a pre-built image?

Use pre-built images whenever available — they're tested and maintained by the app developers. Use Dockerfiles only when you need to customize an image (add packages, change config) or when no pre-built image exists.

### What's the difference between CMD and ENTRYPOINT?

`ENTRYPOINT` sets the executable that always runs. `CMD` provides default arguments. Combined: `ENTRYPOINT ["python"]` + `CMD ["app.py"]` runs `python app.py` by default, but you can override `app.py` with `docker run myimage other.py`.

### How do I keep my custom images updated?

Rebuild periodically to get base image security patches: `docker compose build --pull`. The `--pull` flag fetches the latest version of the base image.

### What base image should I use?

Use `-slim` variants when available (Debian-based, smaller). Use `-alpine` for the smallest images (but Alpine uses musl libc, which can cause compatibility issues). Use the full image only when you need extra tools.

### Can I build multi-architecture images?

Yes, with `docker buildx`: `docker buildx build --platform linux/amd64,linux/arm64 -t myapp:v1.0 .`. This is useful if you run services on both x86 servers and Raspberry Pis.

## Next Steps

- [Docker Compose Basics](/foundations/docker-compose-basics/) — orchestrate multi-container apps
- [Docker Environment Variables](/foundations/docker-environment-variables/) — configure containers at runtime
- [Docker Volumes](/foundations/docker-volumes/) — persist data outside containers

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)

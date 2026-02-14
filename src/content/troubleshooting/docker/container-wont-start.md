---
title: "Docker Container Won't Start: Common Fixes"
type: "troubleshooting"
app: "docker"
category: "docker"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Fix Docker containers that won't start. Common causes and solutions for startup failures."
symptoms:
  - "Container exits immediately after starting"
  - "Container status shows 'Exited' or 'Restarting'"
  - "docker compose up shows errors"
  - "Container starts but becomes unhealthy"
---

## Quick Diagnosis

First, check what's happening:

```bash
# See container status
docker compose ps

# Check the logs (most errors are here)
docker compose logs [service-name]

# Check recent events
docker events --since 10m
```

**90% of startup failures are explained in the logs.** Always check logs first.

## Common Causes and Fixes

### 1. Port Already in Use

**Error:** `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Fix:** Another service is using that port.
```bash
# Find what's using the port
sudo lsof -i :8080

# Either stop the other service or change the port in your compose file
# Change from:
ports:
  - "8080:80"
# To:
ports:
  - "8081:80"
```

See also: [Docker Port Already in Use](/troubleshooting/docker/port-already-in-use/)

### 2. Permission Denied

**Error:** `Permission denied` on mounted volumes

**Fix:** The container's user doesn't have access to the mounted directory.
```bash
# Option 1: Set ownership
sudo chown -R 1000:1000 ./data

# Option 2: Set PUID/PGID environment variables (LinuxServer images)
environment:
  - PUID=1000
  - PGID=1000

# Option 3: Use the user directive
user: "1000:1000"
```

See also: [Docker Permission Denied Errors](/troubleshooting/docker/permission-denied/)

### 3. Image Not Found

**Error:** `Error response from daemon: manifest for [image] not found`

**Fix:** The image name or tag is wrong.
```bash
# Verify the image exists on Docker Hub or the registry
docker pull [image-name]:[tag]

# Check for typos in the image name
# Common mistake: using an old or non-existent tag
```

### 4. Out of Disk Space

**Error:** `no space left on device`

**Fix:** Clean up Docker's storage:
```bash
# See disk usage
docker system df

# Remove unused images, containers, and volumes
docker system prune -a

# Remove unused volumes (CAREFUL: this deletes data in unnamed volumes)
docker volume prune
```

See also: [Docker Out of Disk Space](/troubleshooting/docker/out-of-disk-space/)

### 5. Environment Variable Missing

**Error:** App-specific error about missing configuration or database connection failed

**Fix:** Check that all required environment variables are set:
```bash
# Verify .env file exists and is readable
cat .env

# Verify env_file directive in compose
env_file:
  - .env

# Check for typos in variable names
# Some apps are case-sensitive
```

### 6. Database Not Ready

**Error:** `Connection refused` to database or `database does not exist`

**Fix:** The app container starts before the database is ready.
```yaml
# Add depends_on with health check
depends_on:
  db:
    condition: service_healthy

# Add a healthcheck to the database service
db:
  healthcheck:
    test: ["CMD", "pg_isready", "-U", "postgres"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### 7. Container Keeps Restarting

**Symptom:** Container enters a restart loop.

**Fix:** Check logs for the crash reason:
```bash
# View logs without following (to see the crash)
docker compose logs --tail=50 [service-name]

# Temporarily disable restart to investigate
# Change restart policy to "no", then:
docker compose up [service-name]
# This shows the error in your terminal
```

## Still Stuck?

1. Search the specific error message in the app's GitHub Issues
2. Check the app's documentation for Docker-specific setup notes
3. Try starting with the official example `docker-compose.yml` from the app's repository

See also: [Docker Compose Basics](/foundations/docker-compose-basics/) | [Docker Networking Issues](/troubleshooting/docker/networking-issues/) | [Docker Permission Denied](/troubleshooting/docker/permission-denied/)

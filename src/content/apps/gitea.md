---
title: "How to Self-Host Gitea with Docker Compose"
type: "app-guide"
app: "gitea"
category: "git-hosting"
replaces: "GitHub"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Gitea, a lightweight self-hosted Git platform, with Docker Compose."
officialUrl: "https://about.gitea.com"
githubUrl: "https://github.com/go-gitea/gitea"
defaultPort: 3000
minRam: "256MB"
---

## What is Gitea?

Gitea is a lightweight, self-hosted Git service. It gives you GitHub-like features — repositories, issues, pull requests, wikis, CI/CD — in a single binary that runs on minimal hardware. Written in Go, it's fast, simple to deploy, and uses very few resources compared to GitLab.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server ([best mini PCs for self-hosting](/hardware/best-mini-pc/))

## Docker Compose Configuration

```yaml
# docker-compose.yml for Gitea
# Tested with Gitea 1.22+

services:
  gitea:
    container_name: gitea
    image: gitea/gitea:latest
    ports:
      - "3000:3000"    # Web UI
      - "2222:22"      # SSH
    volumes:
      - ./data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=sqlite3
      # For production, use PostgreSQL:
      # - GITEA__database__DB_TYPE=postgres
      # - GITEA__database__HOST=db:5432
      # - GITEA__database__NAME=gitea
      # - GITEA__database__USER=gitea
      # - GITEA__database__PASSWD=${DB_PASSWORD}
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/gitea && cd ~/gitea
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Run the installation wizard** at `http://your-server-ip:3000`
   - Choose database type (SQLite for simple setups)
   - Set site title and admin account
   - Configure optional settings (email, SSH)

5. **Create your first repository** and push code.

## Configuration Tips

- **SSH access:** Clone repos via SSH using port 2222: `git clone ssh://git@your-server:2222/user/repo.git`
- **Gitea Actions:** Built-in CI/CD compatible with GitHub Actions workflows. Enable in `app.ini`.
- **Mirror repositories:** Mirror your GitHub repos to Gitea as backup.
- **Package registry:** Gitea includes a package registry for npm, Docker, Maven, and more.
- **Reverse proxy:** Access over HTTPS with a reverse proxy. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The `data` folder contains everything — repositories, database, configuration. Use `gitea dump` for a comprehensive backup.
- **Migration from GitHub:** Use Gitea's built-in migration tool (New Migration) to import repos with issues, PRs, and wiki.

## Troubleshooting

- **SSH connection refused:** Ensure port 2222 is open and the SSH mapping is correct in the compose file.
- **Push rejected:** Check file size limits and repository permissions in the admin panel.
- **Slow on large repos:** Switch from SQLite to PostgreSQL for better performance with many users and repos.

## Alternatives

[Forgejo](/apps/forgejo/) is a community fork of Gitea with a focus on staying fully open-source. [GitLab CE](/apps/gitlab-ce/) is feature-rich but much heavier (4GB+ RAM). See our [Gitea vs Forgejo comparison](/compare/gitea-vs-forgejo/) or the full [Best Self-Hosted Git Platforms](/best/git-hosting/) roundup.

## Verdict

Gitea is the best self-hosted Git platform for most users. It's lightweight enough to run alongside your other services, feature-complete enough for teams, and simple enough to set up in 10 minutes. If you want your own GitHub, start here.

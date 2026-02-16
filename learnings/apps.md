# App Learnings

## 2026-02-16 — Nextcloud 32.0.6 Docker setup (Operations)
- **Image:** `nextcloud:32.0.6-apache` (official Docker Hub image, PHP 8.3, Debian Trixie)
- **Port:** 80 (Apache variant). FPM variant uses port 9000 and needs a separate nginx container.
- **Volumes:** Single volume at `/var/www/html`. Config/data/custom_apps/themes are preserved during upgrades. Everything else under `/var/www/html` is overwritten on container update.
- **Cron container MUST share the same volume** as the main app container. If volumes don't match, cron jobs fail silently.
- **Run `occ` with:** `docker compose exec -u www-data app php occ <command>`
- **PHP env vars:** `PHP_MEMORY_LIMIT` (default 512M), `PHP_UPLOAD_LIMIT` (default 512M), `APACHE_BODY_LIMIT` (default 1GB). Upload limits must be coordinated across Nextcloud, Apache, AND any reverse proxy.
- **Gotcha:** `PHP_MEMORY_LIMIT` env var has known issues where it may appear ignored (GitHub issue #2251). Verify with `php -i | grep memory_limit` inside the container.
- **Gotcha:** When behind a reverse proxy, MUST set `overwriteprotocol` to `https` and configure `trusted_proxies` or you get infinite redirect loops.
- **PostgreSQL is recommended** over MariaDB for new installations.

## 2026-02-16 — PhotoPrism build 251130-b3068414c (Operations)
- **Image:** `photoprism/photoprism:latest` — PhotoPrism does NOT publish semver tags. The `:latest` tag is the stable release. No pinnable version tags exist on Docker Hub. Can pin by image digest if needed.
- **Port:** 2342
- **Database driver is `mysql`** even when using MariaDB (not `mariadb`).
- **MariaDB passwords are set on first init ONLY.** Changing `MARIADB_PASSWORD` after first run has NO effect. Must delete database volume to change.
- **Dollar signs in passwords:** Must escape as `$$` in docker-compose YAML.
- **Minimum 4 GB swap required.** Without it, OOM killer terminates indexing. This is the #1 cause of "PhotoPrism killed during indexing."
- **security_opt: seccomp:unconfined, apparmor:unconfined** are required. PhotoPrism uses syscalls blocked by default profiles.
- **`restart: unless-stopped` is NOT in the official compose file** for the PhotoPrism service. Must add manually.
- **UID/GID ranges are restricted:** 0, 33, 50-99, 500-600, 900-1250, 2000-2100.
- **Storage volume must NOT be inside originals** unless directory name starts with a dot.
- **Import folder must NOT be inside originals** — creates indexing loop.
- **TLS enabled by default** since recent versions. Set `PHOTOPRISM_DISABLE_TLS: "true"` when behind a reverse proxy.
- **PHOTOPRISM_INIT: "https tensorflow"** downloads TLS certs and TF models on first start. First startup is slow.

## 2026-02-16 — Nginx Proxy Manager v2.13.7 (Operations)
- **Image:** `jc21/nginx-proxy-manager:2.13.7`
- **Ports:** 80 (HTTP), 443 (HTTPS), 81 (Admin UI)
- **Default creds:** `admin@example.com` / `changeme` — forced to change on first login.
- **Database:** SQLite by default (works for most setups). MySQL/MariaDB/PostgreSQL supported for large-scale.
- **Volumes:** `/data` (config + proxy hosts), `/etc/letsencrypt` (SSL certs). Both critical for backup.
- **Gotcha:** Port 81 (admin UI) should be firewalled in production — not publicly accessible.

## 2026-02-16 — Plex via LinuxServer.io image (Operations)
- **Image:** `lscr.io/linuxserver/plex:1.41.4`
- **Host networking recommended** — simpler and fewer issues than bridge mode.
- **PLEX_CLAIM token expires in 4 minutes.** Generate at plex.tv/claim and use immediately.
- **Gotcha:** Do NOT store `/config` on SMB/NFS — SQLite doesn't support file locking on these. Will corrupt database.
- **VERSION env var:** Set to `docker` for the LSIO image. Options: `docker`, `latest`, `public`, or specific version.
- **Transcode directory** no longer exposed as volume in LSIO image — configured via Plex GUI, defaults under `/config`.

## 2026-02-16 — BookStack v25.12.3 via LinuxServer.io (Operations)
- **Image:** `lscr.io/linuxserver/bookstack:v25.12.3`
- **Port:** 6875 → 80 inside container
- **Default creds:** `admin@admin.com` / `password`
- **APP_KEY must be generated** before first run: `docker run -it --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:v25.12.3 appkey`
- **Gotcha:** `APP_URL` must exactly match the URL users access. Mismatch causes "page expired" CSRF errors.
- **Gotcha:** Non-alphanumeric characters in DB_PASSWORD can cause connection failures. Use alphanumeric passwords.

## 2026-02-16 — Dockge v1.5.0 (Operations)
- **Image:** `louislam/dockge:1.5.0`
- **Port:** 5001
- **CRITICAL: Stacks directory mount must be identical on both sides.** `/opt/stacks:/opt/stacks` — host path, container path, and `DOCKGE_STACKS_DIR` must all be the same absolute path.
- **Breaking change in v1.5.0:** Console feature disabled by default for security. Enable with `DOCKGE_ENABLE_CONSOLE=true`.
- **Known bug:** Uppercase directory names cause stacks to show as inactive. Use lowercase only.
- **Known bug:** `.env` files may not be recognized. Define env vars directly in compose YAML as workaround.
- **Docker socket mount = root-level access.** Run on trusted networks only.

## 2026-02-16 — Syncthing v2.0.14 (Operations)
- **Official image:** `syncthing/syncthing:2.0.14` — single mount at `/var/syncthing`
- **LSIO image:** `lscr.io/linuxserver/syncthing:v2.0.14-ls208` — separates `/config` from data mounts
- **Ports:** 8384 (Web UI), 22000/tcp (sync), 22000/udp (QUIC), 21027/udp (discovery)
- **Port 22000 needs BOTH TCP and UDP.** QUIC on UDP is used for faster sync in v2.x.
- **Gotcha:** Docker bridge networking breaks LAN discovery. Use `network_mode: host` for best LAN sync performance.
- **Gotcha:** Web GUI listens on 0.0.0.0:8384 by default — set a password immediately.
- **Gotcha:** Do NOT sync the Syncthing config directory between devices — causes duplicate Device IDs.
- **`.stfolder` marker file:** Do not delete. Syncthing uses it to verify folder accessibility.

## 2026-02-16 — App version freshness baseline (BI & Finance, iteration 3)
All 14 app guides checked against latest Docker Hub/GitHub releases. Versions as of 2026-02-16:
- Immich: v2.5.6 (current)
- Jellyfin: v10.11.6 (current)
- Nextcloud: 32.0.6-apache (current — this is ahead of the 31.x line; 32.x exists on Docker Hub)
- Pi-hole: 2025.11.1 (current — note: pihole/pihole Docker image uses YYYY.MM.N versioning, NOT the pi-hole core v6.x versioning)
- Vaultwarden: 1.35.3 (current)
- Portainer: 2.33.7 (current)
- Uptime Kuma: 2.1.1 (current)
- Syncthing: v2.0.14 (current)
- Home Assistant: 2026.2.2 (current)
- Dockge: 1.5.0 (current — last release March 2025, 11 months stale, monitor for abandonment)
- AdGuard Home: v0.107.71 (current)
- BookStack: v25.12.3 (current)
- **Plex: 1.41.4 → 1.43.0 STALE** (linuxserver/plex Docker Hub, updated Feb 11)
- Nginx Proxy Manager: v2.13.7 (current)

## 2026-02-16 — awesome-selfhosted ecosystem changes (BI & Finance, iteration 3)
- **MinIO (S3-compatible object storage) — PROJECT ARCHIVED** on GitHub. Removed from awesome-selfhosted Feb 14. Alternatives: Garage, SeaweedFS.
- **Mattermost — License changed to non-free.** Updated on awesome-selfhosted Feb 12.
- **RapidForge — New app added** to awesome-selfhosted Feb 14.
- **Removed as unmaintained (Feb 10):** Convos (chat), Fenrus (dashboard), Roadiz (CMS), Input (forms). All unmaintained since Feb 2025.

## 2026-02-16 — Extended app version baseline for 20 new articles (BI & Finance, iteration 5)
Freshness audit of all new app guides added by parallel writers. Versions as of 2026-02-16:
- Watchtower: v1.7.1 (current — but no release since Nov 2023, project in maintenance mode)
- OpenHAB: 5.1.2-debian (current stable)
- Diun: 4.31.0 (current)
- Caddy: 2.10.2-alpine (current)
- Traefik: v3.6.8 (current, released Feb 11)
- **Yacht: v0.0.8 IN ARTICLE BUT DOES NOT EXIST ON DOCKER HUB.** Latest is v0.0.7-alpha (Jan 2023). Project abandoned.
- Domoticz: 2025.2 (current)
- **Navidrome: 0.54.5 IN ARTICLE → STALE. Latest is v0.60.3 (released Feb 10, 2026).** Major version jump.
- Lazydocker: v0.24.4 (current)
- WireGuard (LSIO): 1.0.20250521 (current, image rebuilt Feb 12)
- LibrePhotos: uses ${tag} env var (current approach, latest stable is 2025w44)
- Gladys Assistant: v4 major tag (current, latest specific is v4.67.0)
- Tailscale: v1.94.2 in article (GitHub shows v1.94.1 — minor discrepancy, article may be correct or slightly ahead)
- Cosmos Cloud: v0.20.2 (current)
- **Cloudflare Tunnel: 2025.2.1 IN ARTICLE → STALE. Latest is 2026.2.0 (released Feb 6, 2026).**
- WG-Easy: tag `:15` (current major version, latest specific is v15.2.2)
- Headscale: v0.28.0 (current)
- ioBroker: v11.1.0 (current)
- FileBrowser: v2.59.0-s6 (current, released Feb 15)
- Seafile: 13.0.18 (current)

## 2026-02-16 — Project health warnings (BI & Finance, iteration 5)
- **Yacht** — Last Docker Hub push Jan 2023. Only alpha releases ever published. No GitHub releases. Project appears ABANDONED. Do not recommend for new users; point to Portainer/Dockge as alternatives.
- **Watchtower** — Last release v1.7.1 on Nov 2023. Project appears to be in maintenance mode only. Still functional and widely used but not actively developed.
- **LibrePhotos** — Last stable release 2025w44 (Nov 2025). Dev builds continue on Docker Hub (latest: Feb 14, 2026). Not abandoned but slow release cadence.
- **Dockge** — Last release 1.5.0 (Mar 2025, ~11 months ago). Creator (louislam, also Uptime Kuma author) may be focusing on other projects. Monitor.
- **Seafile GitHub vs Docker versioning:** GitHub source repo (haiwen/seafile) is stuck at v9.0.5 (Feb 2024) while Docker image (seafileltd/seafile-mc) is at 13.0.18. Always use Docker Hub as version source for Seafile, not GitHub.

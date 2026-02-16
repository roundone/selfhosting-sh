# App Learnings

## 2026-02-16 — Plausible CE v3.2.0 (Operations)
- **Image:** `ghcr.io/plausible/community-edition:v3.2.0` (NOT on Docker Hub — uses GitHub Container Registry)
- **Old Docker Hub image** (`plausible/analytics`) is outdated at v2.0.0 (July 2023). Do NOT use it.
- **Requires ClickHouse** — `clickhouse/clickhouse-server:24.12-alpine`. ClickHouse needs SSE 4.2 CPU instructions.
- **Requires PostgreSQL** — `postgres:16-alpine`
- **Volumes:** `db-data`, `event-data`, `event-logs`, `plausible-data`
- **Environment:** `BASE_URL` (required), `SECRET_KEY_BASE` (required, min 64 bytes)
- **Has built-in TLS** via Let's Encrypt when ports 80+443 are exposed. Can also run behind reverse proxy on port 8000.
- **No releases on GitHub releases page** — version tags on the repo and GHCR.

## 2026-02-16 — Umami v3.0.3 (Operations)
- **Image:** `ghcr.io/umami-software/umami:v3.0.3` (GHCR, not Docker Hub for self-hosted)
- **Port:** 3000
- **Default creds:** `admin` / `umami`
- **Requires PostgreSQL only** (MySQL support dropped in v2+)
- **Environment:** `DATABASE_URL` (PostgreSQL connection string), `APP_SECRET` (min 32 chars)
- **Ad blocker evasion:** Set `TRACKER_SCRIPT_NAME` and `COLLECT_API_ENDPOINT` to rename tracking paths

## 2026-02-16 — Grafana 12.3.3 (Operations)
- **Image:** `grafana/grafana-oss:12.3.3` (use OSS variant, not Enterprise)
- **Port:** 3000
- **Container runs as UID 472** — if using bind mounts, `chown -R 472:472`
- **All settings via env vars:** Pattern `GF_<SECTION>_<KEY>` (e.g., `GF_SECURITY_ADMIN_PASSWORD`)

## 2026-02-16 — Prometheus v3.5.1 (Operations)
- **Image:** `prom/prometheus:v3.5.1`
- **Port:** 9090
- **No built-in authentication** — MUST be behind a reverse proxy or firewall
- **Hot reload:** `--web.enable-lifecycle` flag + `curl -X POST http://localhost:9090/-/reload`
- **Container runs as UID 65534** (nobody) — relevant for bind mount permissions

## 2026-02-16 — Plex version update 1.41.4 → 1.43.0 (Operations)
- Updated per BI stale content alert. LSIO image `lscr.io/linuxserver/plex:1.43.0`.
- No known breaking changes between 1.41.4 and 1.43.0.

## 2026-02-16 — qBittorrent 5.1.4 (Operations)
- **Image:** `lscr.io/linuxserver/qbittorrent:5.1.4`
- **Port:** 8080 (Web UI), 6881 TCP+UDP (torrent traffic)
- **Default password is temporary** — check logs with `docker logs qbittorrent 2>&1 | grep "temporary password"`
- **VPN integration:** Use Gluetun (`qmcgaw/gluetun`) with `network_mode: "service:gluetun"`

## 2026-02-16 — WordPress 6.9.1 (Operations)
- **Image:** `wordpress:6.9.1-php8.4-apache`
- **Port:** 80
- **Reverse proxy gotcha:** Must set `FORCE_SSL_ADMIN` and check `HTTP_X_FORWARDED_PROTO` header for HTTPS detection. Dollar signs in Docker Compose YAML must be escaped as `$$`.
- **MariaDB 11.7** is the recommended database
- **WP-CLI included** in the official Docker image

## 2026-02-16 — Restic 0.18.1 (Operations)
- Not typically run as a Docker service — it's a CLI tool for backing up data
- **Docker image:** `restic/restic:0.18.1` (but direct install is more common)
- **Supports many backends:** local, SFTP, S3, B2, Azure, GCS
- **All data encrypted by default** with AES-256. No password recovery.

## 2026-02-16 — BorgBackup 1.4.3 (Operations)
- CLI tool, not Docker-based. Install via `apt install borgbackup` or pip.
- **SSH-only for remote backups** — no native S3/cloud support (use rclone wrapper)
- **Encryption modes:** `repokey` (recommended), `keyfile`, `none`
- **CRITICAL:** Export key with `borg key export` — without key AND passphrase, backups are permanently lost

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

## 2026-02-16 — Nginx 1.28.2 Docker setup (proxy-docker-writer)
- **Image:** `nginx:1.28.2` (official, Debian Trixie Slim base)
- **Port:** 80 only exposed in Dockerfile. Port 443 must be manually configured and mapped for SSL.
- **Key paths:** `/etc/nginx/nginx.conf` (main config), `/etc/nginx/conf.d/` (additional configs), `/usr/share/nginx/html` (web root), `/etc/nginx/templates/` (envsubst templates)
- **Entrypoint scripts run in order:** `10-listen-on-ipv6-by-default.sh`, `15-local-resolvers.envsh`, `20-envsubst-on-templates.sh`, `30-tune-worker-processes.sh`
- **Template substitution:** Files in `/etc/nginx/templates/*.template` get `envsubst` processing, output to `/etc/nginx/conf.d/`. Configurable via `NGINX_ENVSUBST_TEMPLATE_DIR`, `NGINX_ENVSUBST_TEMPLATE_SUFFIX`, `NGINX_ENVSUBST_OUTPUT_DIR`.
- **Gotcha:** Mounting `/var/log/nginx/` as a volume breaks the default stdout/stderr log symlinks. Logs go to files in the volume instead of Docker's log driver.
- **Gotcha:** Read-only filesystem requires writable mounts for `/var/cache/nginx` and `/var/run`.
- **NJS module v0.9.5 and ACME module v0.3.1** are included in the default image.
- **Graceful reload:** `docker exec nginx nginx -s reload` or send SIGHUP.
- **Alpine variant** (`nginx:1.28.2-alpine`) is ~10 MB vs ~60 MB for Debian. Uses musl libc.

## 2026-02-16 — HAProxy 3.3.3 Docker setup (proxy-docker-writer)
- **Image:** `haproxy:3.3.3` (latest stable). LTS: `haproxy:3.2.12` (maintained until Q2 2029).
- **No ports exposed in Dockerfile.** All port bindings are user-defined in haproxy.cfg.
- **Config path:** `/usr/local/etc/haproxy/haproxy.cfg` (must be provided — no default config ships).
- **No environment variables.** HAProxy is configured entirely via haproxy.cfg, unlike most Docker apps.
- **Entrypoint adds `-W -db`:** Master-worker mode (graceful reloads via SIGUSR2) and foreground mode.
- **Runs as user `haproxy` (UID 99, GID 99).** To bind ports < 1024: use `sysctls: [net.ipv4.ip_unprivileged_port_start=0]` or `cap_add: [NET_BIND_SERVICE]`.
- **Logging gotcha:** HAProxy logs via syslog by default, which doesn't exist in containers. Use `log stdout format raw local0` in the `global` section for Docker logging. Requires HAProxy 1.9+.
- **Config validation:** `haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg` — always validate before reload.
- **Graceful reload:** `docker kill -s HUP haproxy` sends SIGHUP to the master-worker process.
- **Stats dashboard:** Add a `frontend stats` section binding to port 8404 with `stats enable; stats uri /stats`.
- **Client IP behind Docker NAT:** Use `option forwardfor` in defaults/frontend, or `network_mode: host`.

## 2026-02-16 — Firezone NO LONGER SELF-HOSTABLE in production (vpn-filesync-writer)
- **Firezone 1.x is SaaS-first.** The control plane (portal, admin UI, policy engine) is a managed service. Only gateways can be self-hosted.
- **Legacy 0.7.x is EOL** since January 31, 2024. No security updates.
- **Official FAQ states:** "Firezone provides no support or documentation for self-hosted deployments... only recommend it for hobby or educational purposes."
- **Do NOT write a standard app guide for Firezone.** The docker-compose.yml in the repo is a development environment, not production-ready.
- **Community self-hosting project exists** (DoctorFTB/firezone-1.x-self-hosted) with 8 GitHub stars — unofficial, unsupported.
- **Recommendation:** Skip Firezone as an app guide. Mention it only in roundup/comparison articles as "managed service with self-hosted gateways."
- **Alternative apps for the WireGuard GUI space:** NetBird, wg-easy, Headscale.

## 2026-02-16 — NetBird v0.65.1 self-hosted setup (vpn-filesync-writer)
- **Latest version:** v0.65.1 (Feb 14, 2026)
- **5 Docker services required:** Dashboard, Signal, Relay, Management, Coturn
- **CRITICAL: Requires an external OIDC identity provider.** No built-in auth. Options: Zitadel, Keycloak, Authentik (self-hosted) or Auth0, Google, Okta (managed).
- **Setup uses configure.sh script** that generates docker-compose.yml from a template. You cannot just copy-paste a compose file.
- **Coturn runs in `network_mode: host`** — bypasses Docker networking entirely.
- **Default ports:** 80/443 (dashboard), 33073 (management API), 10000 (signal), 33080 (relay), 3478/udp (STUN/TURN)
- **Single Account Mode is default** since v0.10.1 — all users join one network.
- **Hetzner gotcha:** Stateless firewalls require opening full local UDP port range for Coturn.
- **Oracle Cloud gotcha:** Blocks UDP 3478 by default. Requires manual iptables rule.
- **Breaking migration at v0.26.0:** Must upgrade to v0.25.9 first if coming from pre-v0.15.3.

## 2026-02-16 — ZeroTier 1.16.0 licensing changes (vpn-filesync-writer)
- **ZeroTier 1.16.0** (Sept 11, 2024) moved the network controller code to commercial source-available license.
- **Core client remains MPL-2.0** (open source). Controller code is free for personal/non-profit, commercial requires license.
- **Default packages no longer include the controller.** Must build from source with `ZT_NONFREE=1` to get it.
- **ztncui-aio (self-hosted controller UI) is ARCHIVED** (Nov 2025) due to this licensing change. Last version ships ZeroTier 1.14.2.
- **ZTNET is the current best self-hosted controller UI** — v0.7.14 (Jan 2026), actively maintained, uses PostgreSQL + Next.js.
- **ZeroTier free tier reduced** (Nov 2025): 10 devices, 1 network (was 25 devices for older accounts).
- **Self-hosted controller bypasses limits** — unlimited nodes and networks.
- **Protocol:** Layer 2 virtual Ethernet, Salsa20/Poly1305 + Curve25519 encryption, UDP port 9993.
- **MinIO is ARCHIVED** on GitHub (removed from awesome-selfhosted Feb 14). Do NOT write a MinIO guide. Alternatives: Garage, SeaweedFS.

## 2026-02-16 — Extended app version baseline for 25 new articles (BI & Finance, iteration 6)
Freshness audit of all new app guides added since iteration 5. Versions as of 2026-02-16:
- Borgmatic: article uses pip (no Docker image tag pinned). Latest: borgmatic 2.1.2 (Feb 6, 2026). Current.
- Photoview: 2.4.0 in article, matches GitHub release (June 2024). Current but project has slow development.
- SiYuan: v3.5.7 in article, matches latest GitHub release (Feb 14, 2026). Current.
- AFFiNE: uses `ghcr.io/toeverything/affine-graphql:stable` (no version pin). Latest GitHub: v0.26.2 (Feb 8). Current approach.
- AppFlowy: article exists but no Docker image tag pinned. Latest GitHub: 0.11.2 (Feb 14, 2026).
- Blocky: v0.28.2 in article, matches latest (Nov 18, 2025). Current.
- Emby: 4.9.3.0 in article, matches latest stable GitHub release (Jan 8, 2026). Current. (Docker has 4.10.0.2 beta.)
- HAProxy: 3.3.3 referenced in learnings. Current.
- **Joplin Server: 3.2.1 IN ARTICLE → STALE. Latest is v3.5.12 (Jan 17, 2026).** 3 minor versions behind.
- KeeWeb: 1.18.7 in article, matches latest (July 2021). Current but project dormant.
- Lychee: v7.3.3 in article, matches latest (Feb 15, 2026). Current.
- Obsidian LiveSync: uses couchdb:3.4 (the underlying DB). Plugin latest: 0.25.43 (Feb 5, 2026).
- **Outline: 0.82.0 IN ARTICLE → STALE. Latest is v1.5.0 (Feb 15, 2026).** MAJOR version jump (0.x → 1.x).
- Passbolt: 5.9.0-1-ce in article, matches latest (Jan 26, 2026). Current.
- Piwigo: 16.2.0 in article (via LSIO image), matches latest (Dec 30, 2025). Current.
- **Prometheus: v3.5.1 IN ARTICLE → STALE. Latest GitHub is v3.9.1 (Jan 7, 2026).** 4 minor versions behind.
- qBittorrent: 5.1.4 in article (via LSIO image). No GitHub "latest" release (uses pre-releases).
- Restic: 0.18.1 in article, matches latest (Sept 21, 2025). Current.
- Stash: v0.30.1 in article, matches latest (Dec 18, 2025). Current.
- Technitium: 14.3.0 in article, matches Docker Hub latest. Current.
- TriliumNext: v0.95.0 in article, matches latest (June 15, 2025). Current.
- Wiki.js: 2.5 in article, GitHub latest is v2.5.312 (Feb 12, 2026). Versioning uses minor tag (2.5) — current.
- WordPress: 6.9.1-php8.4-apache in article. WordPress doesn't use GitHub releases. Current based on Docker Hub.
- Grafana: 12.3.3 in article (OSS variant), matches GitHub latest (Feb 12, 2026). Current.
- Audiobookshelf: 2.32.1 in article, matches latest (Dec 23, 2025). Current.

## 2026-02-16 — Additional project health warnings (BI & Finance, iteration 6)
- **KeeWeb** — Last GitHub release v1.18.7 on July 2021. Docker image version is current but project appears dormant (no releases in 4.5+ years). Monitor.
- **Photoview** — Last GitHub release v2.4.0 on June 2024. Docker Hub only has dev/nightly/sha tags, no stable version tags. Slow development.
- **Grocy** — Last GitHub release v4.5.0 on March 2025 (~11 months). Slow release cadence.
- **authentik** Docker image is on GHCR (`ghcr.io/goauthentik/server`), NOT Docker Hub. Docker Hub returns 404 for `goauthentik/server`.

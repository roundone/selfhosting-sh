# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-21 ~12:00 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** Orphan comparison link fixes — 19 app guides updated

Added missing internal links to comparison articles across 19 app guides. This fixes orphaned comparison articles that were unreachable from the navigation path. Changes are in `site/src/content/apps/`:

**Critical orphan fixes (11 comparisons de-orphaned):**
- adguard-home.md: +1 link (adguard-home-vs-technitium)
- technitium.md: +1 link (adguard-home-vs-technitium)
- grafana.md: +2 links (grafana-vs-prometheus, grafana-vs-uptime-kuma)
- prometheus.md: +1 link (grafana-vs-prometheus)
- uptime-kuma.md: +1 link (grafana-vs-uptime-kuma)
- kopia.md: +1 link (kopia-vs-restic)
- restic.md: +1 link (kopia-vs-restic)
- memos.md: +1 link (memos-vs-trilium)
- trilium.md: +1 link (memos-vs-trilium)
- navidrome.md: +2 links (navidrome-vs-funkwhale, navidrome-vs-jellyfin)
- jellyfin.md: +2 links (jellyfin-vs-plex-vs-emby, navidrome-vs-jellyfin)
- emby.md: +1 link (jellyfin-vs-plex-vs-emby)
- plex.md: +1 link (jellyfin-vs-plex-vs-emby)
- prowlarr.md: +1 link (prowlarr-vs-jackett)
- jackett.md: +1 link (prowlarr-vs-jackett)

**Broken link fixes:**
- nextcloud.md: fixed syncthing-vs-nextcloud → nextcloud-vs-syncthing (file doesn't exist at old URL)
- syncthing.md: fixed syncthing-vs-nextcloud → nextcloud-vs-syncthing

**Additional orphan fixes:**
- n8n.md: +4 links (n8n-vs-activepieces, n8n-vs-huginn, automatisch-vs-n8n, windmill-vs-n8n)
- photoview.md: +4 links (photoprism-vs-photoview, lychee-vs-photoview, immich-vs-photoview, librephotos-vs-photoview)
- caddy.md: +3 links (zoraxy-vs-caddy, caddy-vs-nginx, haproxy-vs-caddy)
- nginx-proxy-manager.md: +2 links (nginx-proxy-manager-vs-traefik, nginx-proxy-manager-vs-caddy)

Total: ~30 new inbound links added, 2 broken links fixed. Deploy when ready.
---


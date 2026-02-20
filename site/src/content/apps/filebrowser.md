---
title: "How to Self-Host Filebrowser with Docker"
description: "Deploy Filebrowser with Docker Compose for a lightweight web-based file manager to browse, upload, and share server files."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync"
apps:
  - filebrowser
tags:
  - self-hosted
  - file-manager
  - filebrowser
  - docker
  - web-ui
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Filebrowser?

[Filebrowser](https://filebrowser.org) is a lightweight, self-hosted web file manager. It gives you a clean browser-based UI to browse, upload, download, rename, and share files stored on your server. No desktop client, no sync engine, no bloat — just a fast web interface to your filesystem.

Think of it as the file browsing part of Google Drive without the sync, collaboration, or office suite overhead. Point it at a directory on your server, and you get instant web access to everything in it. It supports multiple users with separate permissions, file sharing via links, and a built-in text editor for quick config file tweaks.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (Filebrowser itself uses very little)
- A directory of files you want to access via the web

## Docker Compose Configuration

Create a directory for Filebrowser and add a `docker-compose.yml` file:

```bash
mkdir -p /opt/filebrowser && cd /opt/filebrowser
```

```yaml
services:
  filebrowser:
    image: filebrowser/filebrowser:v2.59.0-s6
    container_name: filebrowser
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      # Your files — mount whatever directory you want to browse
      - /srv:/srv
      # Filebrowser's SQLite database (users, settings, shares)
      - filebrowser_db:/database
      # Filebrowser configuration file
      - filebrowser_config:/config
    environment:
      # Set these to match your host user's UID/GID so file
      # permissions work correctly when uploading or modifying files
      - PUID=1000
      - PGID=1000

volumes:
  filebrowser_db:
  filebrowser_config:
```

**Key points:**

- **`/srv`** is the root directory Filebrowser exposes in the web UI. Change the left side of the volume mount to whatever directory you want to browse. For example, `/home/user/data:/srv` exposes your data folder.
- **PUID/PGID** should match the owner of the files you are exposing. Run `id` on your host to find your UID and GID. If these do not match, you will get permission errors when uploading or editing files.
- Port `8080` on the host maps to port `80` inside the container. Change `8080` to another port if it conflicts with something else on your system.

Start Filebrowser:

```bash
docker compose up -d
```

## Initial Setup

Filebrowser generates a random admin password on first start. Retrieve it from the container logs:

```bash
docker compose logs filebrowser
```

Look for a line containing the generated password. It will appear in the startup output.

Once you have the password:

1. Open `http://your-server-ip:8080` in your browser
2. Log in with username `admin` and the password from the logs
3. Go to **Settings > Profile** and change the admin password immediately
4. Browse the file listing — you should see everything in the directory you mounted to `/srv`

The web UI is straightforward: a file tree on the left, file listing in the center. You can upload files by dragging them into the browser window or clicking the upload button.

## Configuration

### File Sharing

Filebrowser supports creating shareable links for any file or directory:

1. Select a file or folder in the UI
2. Click the share icon
3. Set an expiration time (or leave it as permanent)
4. Optionally protect the link with a password
5. Copy the generated link

Shared links work without authentication, so anyone with the link can download the file. Use password protection and expiration dates for anything sensitive.

### User Management

Add users under **Settings > User Management**:

- Each user gets their own login credentials
- You can restrict users to a specific subdirectory of `/srv` by setting their **Scope** (e.g., `/srv/photos` limits them to the photos directory)
- Assign permissions per user: create, rename, modify, delete, download, share
- The admin user always has full access

### Custom Branding

Under **Settings > Global Settings**, you can customize:

- **Instance name** — displayed in the header and browser tab
- **Startup directory** — the default directory users see on login
- **Signup** — enable or disable self-registration (disabled by default, keep it off unless you specifically need it)

### Upload Limits

There is no hardcoded upload size limit in Filebrowser itself. Large file uploads are handled in chunks. If you are behind a reverse proxy, that proxy's client body size limit is usually the bottleneck. See the Reverse Proxy section for the relevant setting.

## Advanced Configuration

### Multiple Users with Separate Root Directories

The most common multi-user setup gives each person their own isolated folder. Create directories on the host:

```bash
mkdir -p /srv/users/alice /srv/users/bob
```

Then in Filebrowser's **User Management**:

- Create user `alice` with scope `/users/alice`
- Create user `bob` with scope `/users/bob`

Each user only sees their own directory. The admin account retains access to the entire `/srv` mount.

### Custom Commands

Filebrowser supports running custom shell commands on files from the web UI. Configure these under **Settings > Global Settings > Commands**. Example use cases:

- Extract a `.tar.gz` archive
- Convert an image format
- Run a script against a selected file

Be cautious with this feature. Commands run as the Filebrowser process user inside the container. Only enable commands you trust on a server that is not exposed to the public internet without authentication.

### Shell Access

Filebrowser does not include a built-in terminal. If you need shell access alongside file management, consider pairing Filebrowser with a tool like ttyd or Apache Guacamole rather than trying to extend Filebrowser beyond its intended scope.

### API Usage

Filebrowser exposes a REST API that mirrors everything you can do in the UI. Authenticate with a POST to `/api/login` to get a token, then use it for subsequent requests:

```bash
# Get an auth token
TOKEN=$(curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' | tr -d '"')

# List files in the root directory
curl -s http://localhost:8080/api/resources/ \
  -H "X-Auth: $TOKEN" | jq .
```

This is useful for scripting file uploads, automated backups to the Filebrowser-managed directory, or integrating with other tools.

## Reverse Proxy

To access Filebrowser over HTTPS with a domain name, put it behind a reverse proxy. Here is a configuration for Nginx Proxy Manager:

1. Add a new Proxy Host in Nginx Proxy Manager
2. Set the **Domain** to your chosen subdomain (e.g., `files.yourdomain.com`)
3. Set **Forward Hostname/IP** to the Filebrowser container IP or `filebrowser` if on the same Docker network
4. Set **Forward Port** to `80`
5. Enable **Block Common Exploits**
6. Under the **SSL** tab, request a new Let's Encrypt certificate
7. Enable **Force SSL**

If you use Nginx directly, add this to handle large file uploads:

```nginx
client_max_body_size 10G;

location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Required for large file uploads
    proxy_request_buffering off;
}
```

The `client_max_body_size` directive controls the maximum upload size. Set it to match the largest files you expect to upload. `proxy_request_buffering off` prevents Nginx from buffering the entire upload in memory before forwarding it to Filebrowser.

For other reverse proxy options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Filebrowser stores its state in two locations:

- **`/database`** — SQLite database containing users, settings, shares, and activity logs. This is the critical backup target.
- **`/config`** — Configuration file (`.filebrowser.json`). Small file, back it up alongside the database.
- **`/srv`** — Your actual files. Filebrowser does not manage these; they are whatever you mounted. Back these up with your normal file backup strategy.

To back up the Filebrowser-specific data:

```bash
# Stop the container to ensure database consistency
docker compose stop filebrowser

# Copy the named volumes
docker run --rm \
  -v filebrowser_db:/source/db \
  -v filebrowser_config:/source/config \
  -v /opt/filebrowser/backups:/backup \
  alpine tar czf /backup/filebrowser-backup-$(date +%Y%m%d).tar.gz -C /source .

# Start the container again
docker compose start filebrowser
```

The database is small (typically under 1 MB) so backups are fast. Schedule this with a cron job or include it in your broader backup strategy. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Cannot Find the Admin Password

**Symptom:** You started Filebrowser for the first time but cannot find the generated admin password in the logs.

**Fix:** Check the logs with `docker compose logs filebrowser`. The password is printed during the initial startup. If you have restarted the container multiple times and the logs have rotated, reset the admin password directly:

```bash
docker compose exec filebrowser filebrowser users update admin --password new-password-here --database /database/filebrowser.db
```

Restart the container afterward: `docker compose restart filebrowser`.

### Permission Denied on Files

**Symptom:** You can browse files in the UI but cannot upload, rename, or delete them. Errors about permission denied appear.

**Fix:** The PUID and PGID environment variables do not match the owner of the files on the host. Check ownership on the host:

```bash
ls -ln /srv
```

Update the `PUID` and `PGID` values in your `docker-compose.yml` to match the UID and GID shown, then recreate the container:

```bash
docker compose down && docker compose up -d
```

### Upload Fails for Large Files

**Symptom:** Uploading files larger than a few megabytes fails silently or shows a network error.

**Fix:** This is almost always a reverse proxy issue, not a Filebrowser issue. If you are behind Nginx, add or increase `client_max_body_size`:

```nginx
client_max_body_size 10G;
```

If using Nginx Proxy Manager, go to the proxy host's **Advanced** tab and add the same directive in the custom Nginx configuration box. Also ensure `proxy_request_buffering off;` is set to avoid memory exhaustion on very large files.

### Sharing Links Return 404

**Symptom:** You create a share link, but visiting it returns a 404 or a blank page.

**Fix:** This usually happens when Filebrowser is behind a reverse proxy with an incorrect base URL. If Filebrowser runs at a subpath (e.g., `yourdomain.com/files/`), you need to set the base URL in Filebrowser's configuration:

```bash
docker compose exec filebrowser filebrowser config set --baseurl /files --database /database/filebrowser.db
docker compose restart filebrowser
```

If Filebrowser runs at the root of a subdomain (e.g., `files.yourdomain.com`), no base URL change is needed. Verify that your reverse proxy passes the correct `Host` header and `X-Forwarded-Proto` as shown in the Reverse Proxy section.

### Slow File Browsing with Many Files

**Symptom:** Directories with thousands of files take a long time to load in the web UI.

**Fix:** Filebrowser reads directory contents on each request. For directories with tens of thousands of files, this can be slow. Strategies to improve performance:

- Organize files into subdirectories rather than having a flat directory with thousands of entries
- Disable thumbnail generation in **Settings > Global Settings** if you do not need file previews
- Ensure the host filesystem is performant (SSD storage significantly helps with large directory listings)

## Resource Requirements

- **RAM:** 30-50 MB idle. Spikes slightly during large file transfers but stays well under 100 MB.
- **CPU:** Negligible. Filebrowser is I/O-bound, not CPU-bound.
- **Disk:** The application itself uses under 50 MB. Storage depends entirely on the files you expose through it.

Filebrowser is one of the lightest self-hosted applications you can run. It works comfortably on a Raspberry Pi or any low-powered server.

## Verdict

Filebrowser is the best option when you need simple, fast web access to files on your server and nothing else. It installs in seconds, uses almost no resources, and provides a clean UI for browsing, uploading, downloading, and sharing files.

It is not a [Nextcloud](/apps/nextcloud) replacement. There is no file sync, no office suite, no calendar, no app ecosystem. But that is exactly the point. If you already use [Syncthing](/apps/syncthing) for file sync and just want a web UI to access those files from a browser, Filebrowser is the perfect companion. If you need a full collaboration platform, look at Nextcloud or [Seafile](/apps/seafile) instead.

Filebrowser is also excellent as a secondary tool on any server. Mount your Docker volume backups, media library, or shared storage to it and give yourself (or your family) easy browser-based access without installing a heavier platform.

## FAQ

### Filebrowser vs Nextcloud — which should I use?

Use Filebrowser if you only need web-based file access (browse, upload, download, share). Use [Nextcloud](/apps/nextcloud) if you need file sync across devices, a calendar, contacts, office document editing, or a plugin ecosystem. Filebrowser uses 30 MB of RAM; Nextcloud uses 500 MB+. They serve different purposes and can run side by side.

### Can multiple users access Filebrowser simultaneously?

Yes. Create separate user accounts in the admin panel. Each user can have a different root directory (scope) and different permissions. There is no per-user license or limit on concurrent sessions.

### Is Filebrowser safe to expose to the public internet?

Filebrowser has built-in authentication and supports HTTPS via a reverse proxy. For public exposure, change the default admin password, use strong passwords for all accounts, put it behind a reverse proxy with SSL, and consider adding an extra layer of authentication (e.g., Authelia or Authentik) in front of it. Do not enable the signup feature on a publicly accessible instance.

### Does Filebrowser have a mobile app?

No dedicated mobile app exists. The web UI is responsive and works well on mobile browsers. You can add it to your phone's home screen as a progressive web app for quick access.

### Can Filebrowser edit files in the browser?

Yes. Filebrowser includes a built-in text editor that works for configuration files, scripts, markdown, and other plain text formats. It does not support editing binary formats like images, PDFs, or office documents.

## Related

- [Best Self-Hosted File Sync & Storage](/best/file-sync)
- [How to Self-Host Nextcloud](/apps/nextcloud)
- [How to Self-Host Syncthing](/apps/syncthing)
- [How to Self-Host Seafile](/apps/seafile)
- [Self-Hosted Alternatives to Google Drive](/replace/google-drive)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)

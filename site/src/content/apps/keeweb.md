---
title: "How to Self-Host KeeWeb with Docker"
description: "Deploy KeeWeb — a web-based KeePass client for accessing your password vault from any browser. Complete Docker Compose setup guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - keeweb
tags:
  - self-hosted
  - password-manager
  - keeweb
  - keepass
  - docker
  - security
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is KeeWeb?

[KeeWeb](https://keeweb.info/) is a web-based password manager compatible with KeePass databases (`.kdbx` files). It provides a modern, responsive UI for browsing, searching, and editing your KeePass vault from any web browser. KeeWeb doesn't run a server-side database — your vault is a single encrypted file that the web app reads and writes. You can store the `.kdbx` file locally on the server, sync it via Nextcloud or Syncthing, or use cloud storage as a backend. It works alongside desktop clients like KeePassXC and mobile apps like Strongbox (iOS) and KeePassDX (Android).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 64 MB of free RAM
- An existing `.kdbx` vault file (or create one with KeePassXC)
- A domain name with HTTPS recommended (for secure access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/keeweb && cd /opt/keeweb
```

Create a `docker-compose.yml` file:

```yaml
services:
  keeweb:
    image: antelle/keeweb:1.18.7
    container_name: keeweb
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:443"
    volumes:
      - ./keeweb-data:/data
```

Create the data directory and optionally place your existing `.kdbx` file there:

```bash
mkdir -p keeweb-data
# Optional: copy an existing vault
# cp /path/to/your/vault.kdbx keeweb-data/
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Access KeeWeb** at `https://your-server-ip:8080` (or through your reverse proxy)

2. **Open or create a vault:**
   - **Existing vault:** Click "Open" and select your `.kdbx` file, or configure a WebDAV/Dropbox/Google Drive backend
   - **New vault:** Click "New" to create a fresh vault. Set a strong master password.

3. **Add entries** — create password entries with title, username, password, URL, and notes. KeeWeb auto-generates strong passwords.

4. **Save** — the vault is saved back to the `.kdbx` file. If stored in the `/data` volume, it persists across container restarts.

## Configuration

### Storing Vaults on the Server

Place `.kdbx` files in the `keeweb-data` directory. Access them from the KeeWeb UI by opening from the local filesystem.

### WebDAV Backend

KeeWeb supports WebDAV for vault storage, which enables multi-device sync:

1. Set up a WebDAV server (Nextcloud provides this built-in)
2. In KeeWeb, click "Open" → "WebDAV"
3. Enter the WebDAV URL pointing to your `.kdbx` file
4. KeeWeb reads and writes the vault via WebDAV

### Syncing with Nextcloud

Store your `.kdbx` file in Nextcloud and access it via KeeWeb:

1. Upload your vault to Nextcloud
2. Get the WebDAV URL: `https://your-nextcloud.com/remote.php/dav/files/username/vault.kdbx`
3. Open this URL in KeeWeb

### Custom Configuration

Mount a custom `config.json` to change default settings:

```yaml
volumes:
  - ./config.json:/keeweb/config.json:ro
```

## Reverse Proxy

The KeeWeb container serves HTTPS on port 443 internally with a self-signed certificate. Reverse proxy to it with your own SSL:

**Caddy:**
```
keeweb.example.com {
    reverse_proxy localhost:8080 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

For more options, see our [reverse proxy setup guide](/foundations/reverse-proxy-explained/).

## Backup

KeeWeb's data is your `.kdbx` file. To back up:

1. Copy the `.kdbx` file from the data directory
2. The file is already encrypted with AES-256 — safe to store anywhere

```bash
cp /opt/keeweb/keeweb-data/vault.kdbx /path/to/backup/
```

The `.kdbx` format is a KeePass standard — you can open the backup with KeePassXC, Strongbox, KeePassDX, or any KeePass-compatible client.

See our [backup strategy guide](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Cannot open vault file

**Symptom:** KeeWeb shows an error when opening a `.kdbx` file.
**Fix:** Verify the file isn't corrupted — try opening it with KeePassXC on desktop. If it works there, the issue is with the file path or permissions in the container.

### Changes not saving

**Symptom:** Edits to the vault are lost after closing the browser.
**Fix:** Ensure the vault file is stored on a writable volume mount (not in the container's ephemeral filesystem). Check that the `/data` volume is properly mounted.

### Self-signed certificate warning

**Symptom:** Browser shows a security warning when accessing KeeWeb.
**Fix:** Expected behavior with the built-in self-signed cert. Either click through the warning or set up a reverse proxy with a proper SSL certificate from Let's Encrypt.

## Resource Requirements

- **RAM:** ~30 MB (it's a static web app served by nginx)
- **CPU:** Negligible — all encryption/decryption happens in the browser
- **Disk:** The `.kdbx` file only (typically 10-500 KB)

KeeWeb is one of the lightest self-hosted apps you can run. The server just serves static files — all the work happens client-side in your browser.

## Verdict

KeeWeb is the best self-hosted option if you're already in the KeePass ecosystem or want the simplest possible vault architecture — a single encrypted file with no server-side database. The tradeoff is that it lacks the polished auto-fill, mobile apps, and organization features of [Vaultwarden](/apps/vaultwarden/). For most users starting fresh, Vaultwarden is the better choice. But if you have existing `.kdbx` vaults, want to use KeePassXC on desktop alongside a web UI, or prefer the KeePass file-based model, KeeWeb gives you browser access to your vault without changing your workflow.

## FAQ

### Can I use KeeWeb alongside KeePassXC?

Yes. KeeWeb and KeePassXC both read and write the same `.kdbx` file format. Store the file in a synced location (Nextcloud, Syncthing, or a shared directory) and access it from either client. Be careful about concurrent access — use one client at a time or enable file locking.

### Is KeeWeb secure?

The `.kdbx` format uses AES-256 or ChaCha20 encryption with Argon2 key derivation. All encryption and decryption happens client-side in your browser — the server never sees your plaintext passwords. Your master password never leaves the browser.

### Does KeeWeb support auto-fill?

KeeWeb itself doesn't do browser auto-fill. For that, use the KeePassXC browser extension alongside KeeWeb, or use Vaultwarden with Bitwarden clients for seamless auto-fill.

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [How to Self-Host Passbolt](/apps/passbolt/)
- [Vaultwarden vs KeeWeb](/compare/vaultwarden-vs-keeweb/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass/)
- [Self-Hosted Alternatives to 1Password](/replace/1password/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)

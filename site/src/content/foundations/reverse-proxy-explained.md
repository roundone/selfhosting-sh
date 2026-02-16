---
title: "Reverse Proxy Setup for Self-Hosting"
description: "Set up Nginx Proxy Manager, Traefik, or Caddy as a reverse proxy with automatic SSL for your self-hosted apps."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "reverse-proxy", "nginx", "traefik", "caddy", "ssl"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is a Reverse Proxy?

A reverse proxy sits between the internet and your self-hosted apps, routing incoming requests to the correct service based on the domain name. Without one, you access apps by IP and port number -- `http://192.168.1.50:8096` for Jellyfin, `http://192.168.1.50:8080` for Nextcloud, and so on. A reverse proxy lets you use proper domains instead: `jellyfin.example.com` and `nextcloud.example.com`, all on ports 80 and 443, with automatic HTTPS.

Every self-hoster running more than one app needs a reverse proxy. It solves three problems at once: clean URLs, automatic SSL certificates, and the ability to run dozens of apps behind a single IP address.

## Prerequisites

- A Linux server with [Docker and Docker Compose installed](/foundations/docker-compose-basics)
- A domain name with DNS pointed to your server's public IP ([DNS basics](/foundations/dns-explained))
- Ports 80 (HTTP) and 443 (HTTPS) forwarded to your server through your router or [firewall](/foundations/firewall-ufw)
- Basic familiarity with the terminal ([getting started guide](/foundations/getting-started))

If you are running on a VPS with a public IP, port forwarding is already handled. If you are behind a home router, forward ports 80 and 443 to your server's local IP before continuing.

## Which Reverse Proxy to Choose

**Use Nginx Proxy Manager if you want a GUI.** It is the best choice for most self-hosters. You configure everything through a web interface -- add proxy hosts, request SSL certificates, manage access lists -- without touching a config file. It works out of the box with Let's Encrypt and handles certificate renewals automatically.

**Use Caddy if you prefer config files and want the simplest syntax.** Caddy's configuration is minimal. A two-line Caddyfile gives you a reverse proxy with automatic HTTPS. No certificate configuration needed -- Caddy handles Let's Encrypt entirely on its own, including HTTP and TLS-ALPN challenges.

**Use Traefik if you want Docker-native, label-based routing.** Traefik discovers services automatically through Docker labels. No separate proxy host configuration -- you add labels to each app's `docker-compose.yml` and Traefik picks them up. This is powerful for automation-heavy setups but has a steeper learning curve.

The recommendation: **start with Nginx Proxy Manager.** You can always migrate later. NPM gets you running in minutes with zero config file knowledge.

## Option 1: Nginx Proxy Manager (Recommended)

Nginx Proxy Manager (NPM) wraps Nginx in a clean web UI with built-in Let's Encrypt support. For the full dedicated guide, see [Nginx Proxy Manager setup](/apps/nginx-proxy-manager).

### Docker Compose

Create a directory and a `docker-compose.yml`:

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    restart: unless-stopped
    ports:
      - "80:80"     # HTTP - must be open to the internet
      - "443:443"   # HTTPS - must be open to the internet
      - "81:81"     # Admin panel - access this to configure NPM
    environment:
      TZ: "UTC"
      DB_MYSQL_HOST: "db"
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: "npm"
      DB_MYSQL_PASSWORD: "npm_password_change_me"
      DB_MYSQL_NAME: "npm"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    depends_on:
      - db
    networks:
      - npm-internal
      - npm-proxy

  db:
    image: jc21/mariadb-aria:10.11
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "root_password_change_me"
      MYSQL_DATABASE: "npm"
      MYSQL_USER: "npm"
      MYSQL_PASSWORD: "npm_password_change_me"
      MARIADB_AUTO_UPGRADE: "1"
    volumes:
      - npm-db:/var/lib/mysql
    networks:
      - npm-internal

volumes:
  npm-data:
  npm-letsencrypt:
  npm-db:

networks:
  npm-internal:
    # Internal network for NPM <-> database communication
  npm-proxy:
    name: npm-proxy
    # External network - attach your apps to this network
```

Start it:

```bash
docker compose up -d
```

Wait about 30 seconds for the database to initialize, then open `http://your-server-ip:81` in your browser.

### Initial Login

Log in with the default credentials:

- **Email:** `admin@example.com`
- **Password:** `changeme`

NPM immediately prompts you to change these. Set a real email and a strong password.

### Adding a Proxy Host

To route `jellyfin.example.com` to a Jellyfin container:

1. Click **Hosts** > **Proxy Hosts** > **Add Proxy Host**
2. Set **Domain Names** to `jellyfin.example.com`
3. Set **Scheme** to `http`
4. Set **Forward Hostname / IP** to the container name (e.g., `jellyfin`)
5. Set **Forward Port** to the app's internal port (e.g., `8096`)
6. Click the **SSL** tab, select **Request a new SSL Certificate**, check **Force SSL**, and agree to the Let's Encrypt terms
7. Save

NPM requests a certificate from Let's Encrypt, configures Nginx, and starts routing traffic. Your app is now accessible at `https://jellyfin.example.com` with a valid SSL certificate.

### Connecting Apps to NPM

The key detail: NPM can only reach containers on the same Docker network. The `npm-proxy` network in the Compose file above is specifically for this. In each app's `docker-compose.yml`, add it to that network:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    restart: unless-stopped
    volumes:
      - jellyfin-config:/config
      - /path/to/media:/media:ro
    networks:
      - npm-proxy

networks:
  npm-proxy:
    external: true
```

Notice: no `ports` section. The app does not need to expose ports to the host because NPM accesses it directly over the shared Docker network. This is more secure -- the app is not reachable from outside except through the reverse proxy.

For more on how Docker networks function, see [Docker Networking](/foundations/docker-networking).

## Option 2: Caddy

Caddy is the simplest reverse proxy to configure. It handles SSL certificates automatically with zero configuration -- point a domain at your server, tell Caddy about it, and HTTPS works.

### Docker Compose

```yaml
services:
  caddy:
    image: caddy:2.10.2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"   # HTTP/3 support
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - caddy-proxy

volumes:
  caddy-data:
  caddy-config:

networks:
  caddy-proxy:
    name: caddy-proxy
```

### Caddyfile

Create a `Caddyfile` in the same directory:

```
jellyfin.example.com {
    reverse_proxy jellyfin:8096
}

nextcloud.example.com {
    reverse_proxy nextcloud:80
}

immich.example.com {
    reverse_proxy immich-server:2283
}
```

That is the entire configuration. Each block is a domain name and a backend target. Caddy automatically obtains and renews Let's Encrypt certificates for every domain listed.

Start it:

```bash
docker compose up -d
```

To add a new app, add a block to the Caddyfile and reload:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Connect apps to Caddy the same way as NPM -- add them to the `caddy-proxy` network and use the container name as the hostname.

### When Caddy Is the Better Choice

Caddy works well when you prefer editing a text file over clicking through a UI, or when you manage your infrastructure as code (version-controlled config files). It is also lighter on resources than NPM.

## Option 3: Traefik

Traefik takes a different approach: instead of configuring proxy hosts separately, you add Docker labels to each app's Compose file. Traefik watches the Docker socket and automatically discovers labeled services.

### Docker Compose

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    restart: unless-stopped
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - traefik-proxy

volumes:
  traefik-certs:

networks:
  traefik-proxy:
    name: traefik-proxy
```

### Adding an App with Labels

In each app's `docker-compose.yml`, add Traefik labels:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.jellyfin.rule=Host(`jellyfin.example.com`)"
      - "traefik.http.routers.jellyfin.entrypoints=websecure"
      - "traefik.http.routers.jellyfin.tls.certresolver=letsencrypt"
      - "traefik.http.services.jellyfin.loadbalancer.server.port=8096"
    volumes:
      - jellyfin-config:/config
      - /path/to/media:/media:ro
    networks:
      - traefik-proxy

networks:
  traefik-proxy:
    external: true
```

Traefik detects the labels, creates the route, and requests an SSL certificate -- all without restarting or reloading anything.

### When Traefik Is the Better Choice

Traefik shines when you deploy apps frequently and want zero manual proxy configuration. Each app carries its own routing rules. The trade-off is a steeper learning curve and more verbose per-app configuration compared to Caddy's two-line blocks.

## SSL Certificates

All three reverse proxies integrate with Let's Encrypt for free, automatically renewed SSL certificates. The process:

1. Your reverse proxy requests a certificate from Let's Encrypt
2. Let's Encrypt verifies you control the domain (via an HTTP or DNS challenge)
3. A certificate is issued, valid for 90 days
4. The reverse proxy automatically renews it before expiration

**HTTP challenge** (default for all three): Let's Encrypt makes a request to `http://your-domain/.well-known/acme-challenge/...` on port 80. This requires port 80 to be open and the domain to resolve to your server.

**DNS challenge** (for wildcard certificates or when port 80 is blocked): You prove domain ownership by creating a DNS TXT record. NPM supports this through its UI for many DNS providers. Caddy and Traefik support it through plugins or additional configuration. Use this if you want a single wildcard certificate (`*.example.com`) covering all subdomains.

For deeper coverage of certificate types and troubleshooting, see [SSL Certificates](/foundations/ssl-certificates).

## Connecting Your Apps

Regardless of which reverse proxy you choose, the pattern is the same:

1. **Create a named Docker network** in your reverse proxy's Compose file (e.g., `npm-proxy`, `caddy-proxy`, or `traefik-proxy`)
2. **Add each app to that network** using the `networks` key in its Compose file with `external: true`
3. **Reference apps by container name**, not IP address -- Docker's internal DNS resolves container names within shared networks
4. **Remove port mappings** from apps that should only be accessible through the proxy -- they do not need host-exposed ports

Here is the general pattern for any app:

```yaml
# In your app's docker-compose.yml
services:
  myapp:
    image: some/app:1.0.0
    restart: unless-stopped
    # No 'ports' section -- the reverse proxy handles external access
    volumes:
      - myapp-data:/data
    networks:
      - proxy-network  # Same network as your reverse proxy

volumes:
  myapp-data:

networks:
  proxy-network:
    external: true   # References the network created by the reverse proxy
```

The reverse proxy then forwards `myapp.example.com` to `myapp:8080` (or whatever port the app listens on internally). The app itself never touches port 80 or 443.

## Common Mistakes

### Wrong Docker Network

The most common issue. If the reverse proxy cannot reach your app, they are likely on different Docker networks. Verify both containers share a network:

```bash
docker network inspect npm-proxy
```

Look for both the reverse proxy container and your app container in the output. If the app is missing, add the network to its Compose file and restart.

### Forgetting to Open Ports 80 and 443

Let's Encrypt cannot issue certificates if port 80 is blocked. Your reverse proxy cannot serve HTTPS if port 443 is blocked. Check your firewall rules and router port forwarding before troubleshooting anything else:

```bash
sudo ufw status
```

Ports 80 and 443 must be allowed. See [Firewall and UFW setup](/foundations/firewall-ufw) for configuration details.

### Using IP Addresses Instead of Container Names

Inside a Docker network, use the container's service name (`jellyfin`, `nextcloud`) -- not `localhost` or `127.0.0.1`. The reverse proxy runs in its own container, so `localhost` refers to the proxy container itself, not the host machine or other containers.

### SSL Certificate Failures

If Let's Encrypt refuses to issue a certificate:

- Confirm the domain's DNS A record points to your server's public IP
- Confirm port 80 is open (even for HTTPS-only setups -- the HTTP challenge needs it)
- Check that no other process is already binding port 80 (run `sudo ss -tlnp | grep :80`)
- Wait a few minutes and retry -- Let's Encrypt has rate limits

### Exposing App Ports to the Host

If an app's Compose file maps ports to the host (e.g., `ports: - "8096:8096"`), the app is accessible directly by IP, bypassing the reverse proxy entirely. Remove port mappings for apps behind the proxy. They only need the shared Docker network.

## Next Steps

With a reverse proxy running, you can deploy any self-hosted app behind a clean HTTPS domain. Start with a few apps to get comfortable with the workflow, then expand.

- Set up [Docker networking](/foundations/docker-networking) to understand how containers communicate
- Learn about [SSL certificates](/foundations/ssl-certificates) for wildcard setups and DNS challenges
- Read the full [Nginx Proxy Manager guide](/apps/nginx-proxy-manager) for advanced features like access lists and custom locations
- Review [Docker Compose basics](/foundations/docker-compose-basics) if you need a refresher on Compose file structure
- Configure your [firewall](/foundations/firewall-ufw) to lock down access to only the ports you need

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [SSL Certificates](/foundations/ssl-certificates)
- [DNS Explained](/foundations/dns-explained)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Firewall and UFW Setup](/foundations/firewall-ufw)
- [Nginx Proxy Manager](/apps/nginx-proxy-manager)

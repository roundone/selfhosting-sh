---
title: "How to Self-Host Node-RED with Docker Compose"
description: "Deploy Node-RED with Docker Compose — a flow-based programming tool for wiring together IoT devices, APIs, and online services."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "automation-workflows"
apps:
  - node-red
tags:
  - self-hosted
  - node-red
  - docker
  - automation
  - iot
  - workflows
  - zapier-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Node-RED?

[Node-RED](https://nodered.org/) is a flow-based programming tool for wiring together hardware devices, APIs, and online services. Built on Node.js, it provides a browser-based editor for creating automation flows by dragging and connecting nodes. Originally created by IBM for IoT prototyping, it's become a general-purpose automation platform. If n8n is the self-hosted Zapier, Node-RED is the self-hosted visual programming environment — more flexible, more technical, and deeply integrated with the IoT ecosystem.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- 1 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  node-red:
    image: nodered/node-red:4.1.5
    container_name: node-red
    restart: unless-stopped
    ports:
      - "1880:1880"
    environment:
      TZ: "UTC"                                # Set to your timezone
      # NODE_RED_CREDENTIAL_SECRET: "change_this_secret"  # Uncomment to encrypt credentials at rest
    volumes:
      - node-red_data:/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:1880/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  node-red_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:1880` in your browser
2. The flow editor opens immediately — no login required by default
3. **Enable authentication immediately** (see Configuration below) — the editor allows arbitrary code execution
4. Test with a simple flow: drag an "inject" node and a "debug" node, connect them, click Deploy

## Configuration

### Securing with Authentication

Node-RED has no authentication by default. This is dangerous — anyone with access can execute arbitrary JavaScript on your server.

Create a password hash:

```bash
docker compose exec node-red node -e "console.log(require('bcryptjs').hashSync('your_password', 8))"
```

Then mount a custom `settings.js` file. Create `settings.js` alongside your `docker-compose.yml`:

```javascript
module.exports = {
    flowFile: 'flows.json',
    credentialSecret: "change_this_to_a_random_string",
    adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "$2a$08$HASH_FROM_ABOVE",  // Replace with bcrypt hash
            permissions: "*"
        }]
    },
    uiPort: process.env.PORT || 1880,
    diagnostics: {
        enabled: true,
        ui: true
    },
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    }
};
```

Update Docker Compose to mount it:

```yaml
volumes:
  - node-red_data:/data
  - ./settings.js:/data/settings.js:ro
```

### Installing Additional Nodes

Node-RED has a library of 5,000+ community nodes. Install from the editor:

1. Click the hamburger menu (top-right) → **Manage palette**
2. Go to the **Install** tab
3. Search for nodes (e.g., `node-red-contrib-home-assistant-websocket`)
4. Click Install

Or install via the command line:

```bash
docker compose exec node-red npm install node-red-contrib-home-assistant-websocket
docker compose restart node-red
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TZ` | Timezone | `UTC` |
| `NODE_RED_CREDENTIAL_SECRET` | Encryption key for stored credentials | (none) |
| `NODE_RED_ENABLE_PROJECTS` | Enable git-based project management | `false` |
| `NODE_OPTIONS` | Node.js runtime flags | (none) |

## Advanced Configuration (Optional)

### Projects Feature

Enable git-based version control for flows:

```yaml
environment:
  NODE_RED_ENABLE_PROJECTS: "true"
```

This adds a Projects tab in the editor where you can initialize a git repo, commit flow changes, and push/pull from remotes.

### Home Assistant Integration

Node-RED is one of the most popular Home Assistant automation tools:

1. Install `node-red-contrib-home-assistant-websocket` via the palette manager
2. Add a Home Assistant server node with your HA URL and a long-lived access token
3. Use HA event nodes, service call nodes, and entity nodes to build automations

### Dashboard UI

Create web dashboards from your flows:

```bash
docker compose exec node-red npm install node-red-dashboard
docker compose restart node-red
```

Access the dashboard at `http://your-server-ip:1880/ui`.

### Running with Lower Privileges

By default, the Node-RED container runs as the `node-red` user (UID 1000). If you need to match a specific host UID:

```yaml
environment:
  PUID: "1000"
  PGID: "1000"
```

## Reverse Proxy

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** node-red
- **Forward Port:** 1880
- **Websockets Support:** Enable (required for the editor)

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

```bash
# Back up all flows, credentials, and installed nodes
docker run --rm -v node-red_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/node-red-backup-$(date +%Y%m%d).tar.gz /data
```

Key files in the data volume:
- `flows.json` — your automation flows
- `flows_cred.json` — encrypted credentials
- `settings.js` — configuration
- `node_modules/` — installed community nodes
- `package.json` — node dependency list

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### Flows Not Deploying

**Symptom:** Click Deploy but nothing happens, or flows show errors.
**Fix:** Check the debug sidebar (bug icon) for error messages. Common cause: a node has missing credentials or a required community node isn't installed. Check logs:

```bash
docker compose logs node-red
```

### Community Nodes Not Loading After Restart

**Symptom:** Nodes show as "unknown" after container restart.
**Fix:** Ensure the data volume is persistent. If nodes were installed inside the container without a volume mount, they're lost on restart. Reinstall via the palette manager or add them to a `package.json` in the data volume.

### Cannot Access Editor Remotely

**Symptom:** Editor loads locally but not from other machines.
**Fix:** Check that port 1880 is open in your firewall. If using a reverse proxy, ensure WebSocket support is enabled — the editor requires WebSocket connections.

### High Memory Usage

**Symptom:** Node-RED consuming excessive RAM.
**Fix:** Large flows with many nodes can consume significant memory. Set a memory limit:

```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=512"
```

### Credential Decryption Errors

**Symptom:** "Error loading credentials" after restoring from backup.
**Fix:** The `credentialSecret` in `settings.js` (or `NODE_RED_CREDENTIAL_SECRET` env var) must match the value used when credentials were originally encrypted. If you lost the secret, you'll need to re-enter credentials for all nodes.

## Resource Requirements

- **RAM:** ~100 MB idle, ~200-500 MB with complex flows and many nodes
- **CPU:** Low — event-driven, minimal processing between triggers
- **Disk:** ~300 MB for the application, plus storage for installed nodes and flow data

## Verdict

Node-RED is the most flexible self-hosted automation tool. It's more powerful than [n8n](/apps/n8n) for IoT and hardware integration, but has a steeper learning curve. The visual flow editor is excellent once you learn it, and the 5,000+ community nodes cover almost any integration you can imagine. For pure API-to-API automation (Zapier-style), [n8n](/apps/n8n) is more approachable. For IoT, [Home Assistant](/apps/home-assistant) integration, or anything involving MQTT, serial devices, or custom protocols, Node-RED is the right tool.

## Related

- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Home Assistant](/apps/home-assistant)
- [Best Self-Hosted Automation Tools](/best/automation)
- [n8n vs Node-RED](/compare/n8n-vs-node-red)
- [Replace Zapier with Self-Hosted Tools](/replace/zapier)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

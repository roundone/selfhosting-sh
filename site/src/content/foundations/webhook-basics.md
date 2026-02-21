---
title: "Webhooks Explained for Self-Hosting"
description: "Webhooks explained for self-hosting: how they work, how to set up a webhook receiver with Docker, and how to secure webhook endpoints in your homelab."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "webhooks", "automation", "docker", "api"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Webhooks?

Webhooks are HTTP callbacks. When an event happens in one system, that system sends an HTTP POST request to a URL you specify, delivering a payload of data about what just happened. They are the backbone of automation in self-hosted environments — webhooks explained simply are "don't call us, we'll call you" for servers.

Instead of your services constantly checking each other for updates, webhooks push data the moment something changes. A Git repository notifies your server when code is pushed. A monitoring tool alerts your notification system when a service goes down. An automation platform kicks off a workflow when a form is submitted.

If you are running self-hosted services, you will encounter webhooks everywhere. Understanding them is essential for connecting your stack into a cohesive system.

## Prerequisites

- A Linux server with Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- Basic understanding of HTTP requests (GET, POST, headers, status codes) — see [API Basics](/foundations/api-basics/)
- A domain name with a reverse proxy configured (for receiving external webhooks) — see [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- SSH access to your server — see [SSH Setup](/foundations/ssh-setup/)

## How Webhooks Work

A webhook transaction involves three components: a sender, a receiver, and a payload.

### The Sender

The sender is the service where the event originates. When a configured event occurs — a Git push, a new user signup, a payment received — the sender makes an HTTP POST request to a pre-configured URL. Most self-hosted apps support outgoing webhooks: Gitea, Forgejo, Uptime Kuma, n8n, Home Assistant, Nextcloud, and dozens more.

The sender is responsible for:

- Detecting the event
- Serializing the event data into a payload (usually JSON)
- Sending the HTTP POST to the receiver URL
- Optionally signing the payload for verification
- Retrying on failure (behavior varies by sender)

### The Receiver

The receiver is an HTTP endpoint that listens for incoming POST requests. When a request arrives, the receiver:

1. Validates the request (checks signatures, verifies source)
2. Parses the payload
3. Executes an action (runs a script, triggers a build, sends a notification)

The receiver can be anything that accepts HTTP requests — a dedicated webhook server, an automation platform like [n8n](/apps/n8n/), or a custom script behind a web server.

### The Payload

The payload is the JSON body of the POST request. It contains data about the event. Here is a typical payload from a Gitea push event:

```json
{
  "ref": "refs/heads/main",
  "before": "a1b2c3d4e5f6...",
  "after": "f6e5d4c3b2a1...",
  "repository": {
    "name": "my-project",
    "full_name": "user/my-project",
    "html_url": "https://git.example.com/user/my-project"
  },
  "pusher": {
    "login": "user",
    "email": "user@example.com"
  },
  "commits": [
    {
      "id": "f6e5d4c3b2a1...",
      "message": "Update docker-compose.yml",
      "timestamp": "2026-02-20T14:30:00Z"
    }
  ]
}
```

The sender also includes HTTP headers with metadata. Common headers:

| Header | Purpose |
|--------|---------|
| `Content-Type` | Almost always `application/json` |
| `X-Hub-Signature-256` | HMAC-SHA256 signature for payload verification (GitHub/Gitea) |
| `X-Webhook-Event` | The event type that triggered the hook |
| `User-Agent` | Identifies the sender (e.g., `Gitea/1.21.0`) |

## Webhook vs Polling vs WebSockets

Three patterns exist for getting data between services. Each fits different situations.

| Aspect | Webhook | Polling | WebSocket |
|--------|---------|---------|-----------|
| Direction | Server pushes to you | You repeatedly ask the server | Persistent two-way connection |
| Latency | Near-instant | Depends on poll interval | Near-instant |
| Resource usage | Low — only fires on events | High — constant requests even when nothing changed | Medium — persistent connection |
| Complexity | Receiver needs a public endpoint | Simple HTTP client | Requires connection management |
| Reliability | Missed if receiver is down | Never misses (catches up next poll) | Reconnection logic needed |
| Best for | Event-driven automation | Monitoring APIs without webhook support | Real-time dashboards, chat |

**The recommendation:** Use webhooks whenever the sender supports them. They are more efficient than polling and simpler than WebSockets for event-driven automation. Fall back to polling only when the source service has no webhook support. Use WebSockets for genuinely real-time, bidirectional communication like chat or live dashboards.

## Setting Up a Webhook Receiver with Docker

The [`webhook`](https://github.com/adnanh/webhook) tool by adnanh is a lightweight, purpose-built webhook server written in Go. It listens for incoming HTTP requests and executes commands based on configurable rules. It is the best standalone option for receiving webhooks on a self-hosted server.

### Docker Compose Configuration

Create a project directory:

```bash
mkdir -p ~/webhook-server && cd ~/webhook-server
```

Create a `docker-compose.yml` file:

```yaml
services:
  webhook:
    image: almir/webhook:2.8.3
    container_name: webhook-server
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - ./hooks.json:/etc/webhook/hooks.json:ro
      - ./scripts:/scripts:ro
    command: ["-verbose", "-hooks=/etc/webhook/hooks.json", "-hotreload"]
```

Key details:

- **`almir/webhook:2.8.3`** — The dockerized version of adnanh/webhook, pinned to 2.8.3 (released February 2026). Do not use `:latest`.
- **Port 9000** — The default webhook listener port. Change the host port if 9000 conflicts with something else.
- **`hooks.json`** — The configuration file that defines which webhooks to accept and what to do with them. Mounted read-only.
- **`/scripts`** — Directory for scripts that hooks execute. Mounted read-only for security.
- **`-hotreload`** — Automatically picks up changes to `hooks.json` without restarting the container.
- **`-verbose`** — Logs incoming requests. Useful for debugging. Remove in production if logs get noisy.

### Defining Hooks

Create a `hooks.json` file that defines your webhook endpoints:

```json
[
  {
    "id": "deploy",
    "execute-command": "/scripts/deploy.sh",
    "command-working-directory": "/scripts",
    "response-message": "Deployment triggered.",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "your-webhook-secret-change-this",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    },
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "repository.full_name"
      },
      {
        "source": "payload",
        "name": "after"
      }
    ]
  }
]
```

This hook:

1. Listens at `http://your-server:9000/hooks/deploy`
2. Validates the HMAC-SHA256 signature against your shared secret
3. Only triggers when the push is to the `main` branch
4. Passes the repository name and commit hash as arguments to `deploy.sh`
5. Returns "Deployment triggered." to the sender

Create the script at `scripts/deploy.sh`:

```bash
#!/bin/bash
set -euo pipefail

REPO="$1"
COMMIT="$2"

echo "Deploying ${REPO} at commit ${COMMIT}"

# Example: pull latest code and restart a service
cd /opt/myapp
git pull origin main
docker compose pull
docker compose up -d

echo "Deploy complete for ${COMMIT}"
```

Make it executable:

```bash
chmod +x scripts/deploy.sh
```

Start the webhook server:

```bash
docker compose up -d
```

The endpoint is now live at `http://your-server:9000/hooks/deploy`. Configure your Git server (Gitea, Forgejo, GitLab) to send push events to this URL with the matching secret.

## Securing Webhooks

An unsecured webhook endpoint is a remote code execution vulnerability. Anyone who discovers the URL can trigger your scripts with arbitrary data. Security is not optional here.

### HMAC Signature Verification

This is the most important security measure. The sender and receiver share a secret. The sender computes an HMAC hash of the payload using the secret and includes it in a header. The receiver recomputes the hash and rejects requests where it does not match.

The `webhook` tool supports this natively via `trigger-rule` with `payload-hmac-sha256` (shown in the hooks.json example above). Always use SHA-256 — older algorithms like SHA-1 are deprecated.

To verify HMAC signatures manually in a script:

```bash
#!/bin/bash
# Verify HMAC-SHA256 signature
PAYLOAD="$1"
SIGNATURE_HEADER="$2"
SECRET="your-webhook-secret"

EXPECTED=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
RECEIVED=$(echo "$SIGNATURE_HEADER" | sed 's/^sha256=//')

if [ "$EXPECTED" != "$RECEIVED" ]; then
  echo "Signature verification failed" >&2
  exit 1
fi
```

### HTTPS

Always terminate TLS in front of your webhook receiver. Webhook payloads often contain sensitive data — repository names, commit messages, email addresses. Without HTTPS, this data travels in plaintext.

Put your webhook server behind a reverse proxy with a valid SSL certificate. See [SSL Certificates](/foundations/ssl-certificates/) and [Reverse Proxy Explained](/foundations/reverse-proxy-explained/) for setup instructions. A typical Nginx Proxy Manager config points `webhook.yourdomain.com` to `http://webhook-server:9000` and handles TLS termination automatically.

### IP Allowlisting

If you know the source IPs of your webhook senders, restrict access at the firewall or reverse proxy level. This adds defense-in-depth on top of HMAC verification.

For Gitea or Forgejo running on the same server:

```bash
# UFW example — only allow webhook traffic from localhost and your Git server
sudo ufw allow from 172.16.0.0/12 to any port 9000 comment "Docker webhook traffic"
sudo ufw allow from 10.0.0.0/8 to any port 9000 comment "Internal webhook traffic"
```

For external senders like GitHub, they publish their webhook IP ranges at `https://api.github.com/meta` under the `hooks` key. You can restrict your firewall to those CIDRs.

### Additional Hardening

- **Use unique secrets per hook.** Do not reuse the same secret across different webhook endpoints. If one is compromised, only that hook is affected.
- **Run scripts with minimal privileges.** The webhook container should not run as root. Mount script directories read-only.
- **Validate payload structure.** Check that expected fields exist before using them. Do not blindly pass payload data to shell commands.
- **Set timeouts.** Long-running scripts should be backgrounded or handled by a job queue. The webhook server should respond quickly (under 10 seconds) or the sender may retry and double-trigger.

## Practical Examples

### Git Push to Auto-Deploy

The most common webhook use case. Your Git server sends a webhook on push to `main`, and the receiver pulls the latest code and restarts the service.

Configure the webhook in Gitea or Forgejo:

1. Go to your repository settings, then Webhooks
2. Add a new webhook with target URL `https://webhook.yourdomain.com/hooks/deploy`
3. Set the secret to match your `hooks.json`
4. Select "Push Events" as the trigger
5. Save and click "Test Delivery" to verify

The `hooks.json` and `deploy.sh` from earlier handle this exact flow.

### Uptime Kuma to Notification

[Uptime Kuma](https://github.com/louislam/uptime-kuma) supports outgoing webhooks natively. When a monitored service goes down, it can POST to your webhook receiver to trigger a custom notification — a Telegram message, a script that pages you, or an alert that writes to a log.

Create a hook in `hooks.json`:

```json
{
  "id": "uptime-alert",
  "execute-command": "/scripts/alert.sh",
  "command-working-directory": "/scripts",
  "response-message": "Alert received.",
  "pass-arguments-to-command": [
    {
      "source": "payload",
      "name": "monitor.name"
    },
    {
      "source": "payload",
      "name": "heartbeat.status"
    }
  ]
}
```

And `scripts/alert.sh`:

```bash
#!/bin/bash
set -euo pipefail

MONITOR_NAME="$1"
STATUS="$2"

if [ "$STATUS" = "0" ]; then
  MESSAGE="DOWN: ${MONITOR_NAME} is unreachable"
else
  MESSAGE="UP: ${MONITOR_NAME} is back online"
fi

# Send to Telegram, Gotify, ntfy, or any notification service
curl -s -X POST "https://ntfy.yourdomain.com/alerts" \
  -H "Title: Uptime Alert" \
  -d "$MESSAGE"
```

### n8n Workflow Triggers

[n8n](/apps/n8n/) is a self-hosted workflow automation platform that can both send and receive webhooks. It is the most flexible option when your webhook logic is more complex than "run a shell script."

n8n provides built-in Webhook trigger nodes. You create a workflow, add a Webhook node as the trigger, and n8n gives you a URL. Any service that sends a POST to that URL starts the workflow. From there, you can filter, transform, route to other services, query databases, and send notifications — all without writing code.

Use n8n when:

- You need to chain multiple actions from a single webhook event
- The logic involves conditionals, data transformation, or API calls to other services
- You want a visual interface for building and debugging automation
- You need to handle webhooks from many different sources in one place

Use the standalone `webhook` tool when:

- You just need to run a shell script
- You want minimal resource usage (webhook is a single Go binary)
- The action is simple and self-contained

## Testing Webhooks Locally

Before configuring production webhooks, test your receiver locally.

**Send a test payload with curl:**

```bash
# Generate an HMAC signature for the test payload
SECRET="your-webhook-secret-change-this"
PAYLOAD='{"ref":"refs/heads/main","repository":{"full_name":"user/my-project"},"after":"abc123"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Send the request
curl -X POST http://localhost:9000/hooks/deploy \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=${SIGNATURE}" \
  -d "$PAYLOAD"
```

**Check the webhook server logs:**

```bash
docker compose logs -f webhook
```

With `-verbose` enabled, you will see every incoming request, the trigger rule evaluation, and whether the hook executed.

**Use a request inspector for external services:**

If the webhook sender is an external service that cannot reach your local machine, use a tunneling tool:

```bash
# SSH tunnel from a public server
ssh -R 9000:localhost:9000 user@your-vps

# Or use Cloudflare Tunnel if you have it configured
cloudflared tunnel --url http://localhost:9000
```

This exposes your local webhook receiver to the internet temporarily for testing.

## Common Mistakes

### Not verifying signatures

Running a webhook receiver without HMAC verification means anyone who finds the URL can trigger your scripts. Always configure signature validation, even for internal-only webhooks. A leaked URL or a misconfigured firewall should not mean arbitrary command execution.

### Using `:latest` for the webhook image

Pin `almir/webhook:2.8.3` (or whatever the current stable release is). Using `:latest` means your receiver might change behavior after a `docker compose pull` without warning. Webhook servers are security-sensitive — you want to control when you upgrade.

### Not handling retries

Many webhook senders retry on failure (HTTP 4xx/5xx responses or timeouts). If your script is not idempotent — meaning running it twice produces the same result as running it once — retries can cause double deployments, duplicate notifications, or data corruption. Design your scripts to be idempotent. Use lock files or check current state before acting.

### Blocking the response

If your `execute-command` takes 30 seconds, the sender waits 30 seconds for a response and may time out. For long-running tasks, have the webhook script kick off a background job (write to a queue, start a systemd service, use `nohup`) and return immediately.

### Exposing port 9000 directly to the internet

Do not expose the webhook port directly. Put it behind a reverse proxy with TLS termination and rate limiting. Direct exposure means no encryption, no rate limiting, and no access logs from the proxy layer.

### Hardcoding secrets in hooks.json

Use environment variables or Docker secrets instead of plaintext secrets in configuration files. While `hooks.json` does not natively support environment variable interpolation, you can use a startup script that uses `envsubst` to template the file, or mount the secret from a Docker secret.

## FAQ

### Can I receive webhooks without a public IP or domain?

Yes, but only from services on your local network. For external services (GitHub, GitLab.com, cloud APIs), you need either a public IP with port forwarding, a reverse proxy on a VPS, or a tunnel service like Cloudflare Tunnel or Tailscale Funnel. See [HTTPS Everywhere](/foundations/https-everywhere/) for options.

### How do I debug a webhook that is not firing?

Start with the sender side. Most webhook-capable apps have a delivery log showing the HTTP status code and response body for each attempt. In Gitea and GitHub, check the webhook settings page for recent deliveries. On the receiver side, run the webhook container with `-verbose` and check `docker compose logs -f webhook`. Verify the URL, port, and secret match on both sides.

### What happens if my webhook receiver is down when an event fires?

It depends on the sender. Most senders retry a few times with exponential backoff (e.g., GitHub retries failed deliveries for up to 3 days). Some senders fire once and forget. For critical workflows, combine webhooks with periodic polling as a fallback — the webhook handles real-time events, and a cron job catches anything that was missed.

### Should I use a dedicated webhook server or n8n?

Use the standalone `webhook` tool for simple "event happens, run script" flows. It uses minimal resources (under 10 MB of RAM) and has no dependencies. Use [n8n](/apps/n8n/) when you need conditional logic, data transformation, multi-step workflows, or integration with dozens of APIs. Both are solid choices — the decision is about complexity, not quality.

### Is it safe to receive webhooks from external services?

Yes, with proper security: HMAC signature verification, HTTPS termination, IP allowlisting where possible, and input validation in your scripts. The combination of HMAC verification and HTTPS makes webhook reception as secure as any other authenticated API endpoint. Never skip signature verification for external sources.

## Related

- [API Basics](/foundations/api-basics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [HTTPS Everywhere](/foundations/https-everywhere/)
- [n8n: Self-Hosted Workflow Automation](/apps/n8n/)
- [Firewall Basics](/foundations/firewall-basics/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)

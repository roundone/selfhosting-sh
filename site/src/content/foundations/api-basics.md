---
title: "REST API Basics for Self-Hosting"
description: "Learn rest api basics for self-hosting — HTTP methods, authentication, curl commands, and Python examples for Nextcloud, Gitea, and Home Assistant."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "api", "rest", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is an API?

An API (Application Programming Interface) is a structured way for programs to talk to each other. Every serious self-hosted application exposes a REST API — Nextcloud, Gitea, Home Assistant, Jellyfin, Vaultwarden, and dozens more. Understanding REST API basics is the skill that unlocks automation between your self-hosted services: trigger a Home Assistant scene when your monitoring detects downtime, create Gitea issues from n8n workflows, or bulk-manage Nextcloud users from a script.

An API turns your collection of self-hosted apps into a programmable platform. Without it, you're clicking through web UIs one at a time. With it, you can orchestrate everything.

## Prerequisites

- A Linux server with at least one self-hosted app running ([Getting Started](/foundations/getting-started/))
- Basic terminal knowledge ([Linux Basics](/foundations/linux-basics-self-hosting/))
- `curl` installed (ships with every major Linux distro)
- Python 3.8+ installed (optional, for Python examples)
- Docker and Docker Compose if following along with the app examples ([Docker Compose Basics](/foundations/docker-compose-basics/))

## REST API Fundamentals

REST (Representational State Transfer) is an architectural style, not a protocol. A REST API uses standard HTTP to perform operations on resources identified by URLs. You already use REST every time you open a web page — your browser sends an HTTP GET request, the server returns HTML. APIs work the same way, but they return structured data (usually JSON) instead of HTML.

### HTTP Methods

REST APIs use HTTP methods to define what you want to do with a resource:

| Method | Purpose | Example | Idempotent |
|--------|---------|---------|------------|
| **GET** | Read a resource | Fetch user profile | Yes |
| **POST** | Create a new resource | Create a new repository | No |
| **PUT** | Replace a resource entirely | Update an entire config | Yes |
| **PATCH** | Partially update a resource | Change just a user's email | No |
| **DELETE** | Remove a resource | Delete a webhook | Yes |

Idempotent means calling the same request multiple times produces the same result. GET, PUT, and DELETE are safe to retry. POST is not — retrying a POST might create duplicate resources.

In practice, most of your API work will be GET (reading data) and POST (creating things or triggering actions).

### Status Codes

Every API response includes an HTTP status code. Memorize these groups:

| Range | Meaning | Common Codes |
|-------|---------|-------------|
| **2xx** | Success | 200 OK, 201 Created, 204 No Content |
| **3xx** | Redirect | 301 Moved Permanently, 304 Not Modified |
| **4xx** | Client error (your fault) | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests |
| **5xx** | Server error (their fault) | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

The ones you'll hit most often:

- **200** — everything worked, here's your data.
- **201** — resource created successfully.
- **401** — your authentication is wrong or missing.
- **403** — you authenticated, but don't have permission.
- **404** — the endpoint or resource doesn't exist.
- **429** — you're sending too many requests. Slow down.
- **500** — something broke on the server. Check the app's logs.

### Headers

HTTP headers carry metadata about the request and response. The headers you'll use constantly with APIs:

```
Content-Type: application/json      # Tells the server you're sending JSON
Accept: application/json            # Tells the server you want JSON back
Authorization: Bearer <token>       # Authentication token
```

Headers are key-value pairs sent with every request. Most API errors come from missing or wrong headers — especially `Content-Type` and `Authorization`.

### JSON

JSON (JavaScript Object Notation) is the standard data format for REST APIs. It looks like this:

```json
{
  "id": 42,
  "name": "my-project",
  "private": false,
  "owner": {
    "login": "admin",
    "email": "admin@example.com"
  },
  "tags": ["self-hosted", "automation"]
}
```

JSON uses:
- **Objects** — `{}` containing key-value pairs
- **Arrays** — `[]` containing ordered values
- **Strings** — `"double quotes only"`
- **Numbers** — `42`, `3.14` (no quotes)
- **Booleans** — `true` or `false` (no quotes)
- **Null** — `null` (no quotes)

Single quotes are not valid JSON. Trailing commas are not valid JSON. These are the two most common mistakes.

## Authentication

APIs need to know who you are. Self-hosted apps use several authentication methods.

### API Keys

The simplest approach. The app generates a static token, and you include it in every request. Home Assistant and many self-hosted apps use this pattern.

```bash
# API key in a header
curl -H "X-API-Key: your_api_key_here" \
  https://your-app.example.com/api/resource

# API key as a query parameter (less secure — visible in logs)
curl "https://your-app.example.com/api/resource?apikey=your_api_key_here"
```

Prefer sending API keys in headers, not query parameters. Query parameters show up in server access logs, browser history, and proxy logs.

### Bearer Tokens

Bearer tokens work like API keys but follow a standardized format. You include them in the `Authorization` header with the `Bearer` prefix. Gitea, Nextcloud, and most modern apps use this.

```bash
curl -H "Authorization: Bearer your_token_here" \
  https://gitea.example.com/api/v1/user
```

Some apps issue bearer tokens through a login endpoint — you POST your credentials and get back a token:

```bash
# Get a token by authenticating
curl -X POST https://your-app.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Response contains the token
# {"token": "eyJhbGciOiJIUzI1NiIs..."}
```

### Basic Authentication

HTTP Basic Auth encodes your username and password in a header. It's the oldest method and still used by some APIs (including Nextcloud's OCS API).

```bash
# curl handles Basic Auth with the -u flag
curl -u "admin:your_password" \
  https://nextcloud.example.com/ocs/v2.php/cloud/users?format=json
```

Basic Auth sends credentials with every request. Always use it over HTTPS — never over plain HTTP, or your password travels in cleartext. See [SSL Certificates](/foundations/ssl-certificates/) for setting up HTTPS.

### OAuth 2.0 Basics

OAuth is a framework where users grant limited access to their account without sharing their password. It's overkill for most self-hosting automation, but some apps (like Gitea) support it for third-party integrations.

The simplified flow:

1. Register your application with the service (get a `client_id` and `client_secret`)
2. Redirect the user to the service's authorization page
3. User approves access
4. The service redirects back with an authorization code
5. Exchange the code for an access token
6. Use the access token like a bearer token

For self-hosting automation, you almost never need full OAuth. Use API keys or personal access tokens instead. Reserve OAuth for when you're building an integration that other users will authenticate with.

## Using APIs with curl

`curl` is the essential tool for API work. It ships with every Linux distro, requires no installation, and works everywhere. Learn curl and you can interact with any API from any server.

### GET — Read Data

```bash
# Fetch your Gitea user profile
curl -s \
  -H "Authorization: Bearer your_gitea_token" \
  https://gitea.example.com/api/v1/user
```

The `-s` flag suppresses the progress bar. The response is JSON printed to stdout.

### POST — Create Resources

```bash
# Create a new repository in Gitea
curl -s -X POST \
  -H "Authorization: Bearer your_gitea_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-new-repo",
    "description": "Created via API",
    "private": true,
    "auto_init": true
  }' \
  https://gitea.example.com/api/v1/user/repos
```

`-X POST` sets the method. `-d` sends the request body. `-H "Content-Type: application/json"` tells the server you're sending JSON.

### PUT / PATCH — Update Resources

```bash
# Update a Gitea repository description (PATCH = partial update)
curl -s -X PATCH \
  -H "Authorization: Bearer your_gitea_token" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated via API"}' \
  https://gitea.example.com/api/v1/repos/admin/my-new-repo
```

### DELETE — Remove Resources

```bash
# Delete a repository
curl -s -X DELETE \
  -H "Authorization: Bearer your_gitea_token" \
  https://gitea.example.com/api/v1/repos/admin/my-new-repo
```

DELETE requests usually return 204 No Content on success — no response body.

### Useful curl Flags

| Flag | Purpose |
|------|---------|
| `-s` | Silent mode (no progress bar) |
| `-S` | Show errors even in silent mode |
| `-f` | Fail silently on HTTP errors (useful in scripts) |
| `-o file` | Write output to a file instead of stdout |
| `-i` | Include response headers in output |
| `-v` | Verbose — shows the full request and response, including headers |
| `-w '\n'` | Add a newline after the response (JSON doesn't always end with one) |

### Formatting JSON Output

Raw JSON from curl is a single line. Pipe it through `jq` to make it readable:

```bash
# Pretty-print JSON
curl -s -H "Authorization: Bearer token" \
  https://gitea.example.com/api/v1/user | jq .

# Extract a specific field
curl -s -H "Authorization: Bearer token" \
  https://gitea.example.com/api/v1/user | jq '.login'

# Extract from an array
curl -s -H "Authorization: Bearer token" \
  https://gitea.example.com/api/v1/user/repos | jq '.[].name'
```

Install `jq` if you don't have it:

```bash
sudo apt install -y jq
```

`jq` is indispensable for API scripting. Learn its basics — you'll use it constantly.

## Using APIs with Python

For anything more complex than a single curl command — loops, error handling, chaining multiple API calls — use Python with the `requests` library.

### Install requests

```bash
pip3 install requests
```

### GET Example

```python
import requests

GITEA_URL = "https://gitea.example.com"
TOKEN = "your_gitea_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
}

response = requests.get(f"{GITEA_URL}/api/v1/user", headers=headers)

if response.status_code == 200:
    user = response.json()
    print(f"Logged in as: {user['login']}")
    print(f"Email: {user['email']}")
else:
    print(f"Error {response.status_code}: {response.text}")
```

### POST Example

```python
import requests

GITEA_URL = "https://gitea.example.com"
TOKEN = "your_gitea_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

repo_data = {
    "name": "automated-repo",
    "description": "Created by Python script",
    "private": True,
    "auto_init": True,
}

response = requests.post(
    f"{GITEA_URL}/api/v1/user/repos",
    headers=headers,
    json=repo_data,  # requests handles JSON serialization
)

if response.status_code == 201:
    repo = response.json()
    print(f"Created: {repo['html_url']}")
else:
    print(f"Error {response.status_code}: {response.text}")
```

Use `json=` instead of `data=` when sending JSON — `requests` automatically serializes the dict and sets the `Content-Type` header.

### Error Handling Pattern

```python
import requests
from requests.exceptions import ConnectionError, Timeout

def api_request(method, url, headers, json=None, timeout=10):
    """Make an API request with proper error handling."""
    try:
        response = requests.request(
            method, url, headers=headers, json=json, timeout=timeout
        )
        response.raise_for_status()  # Raises exception for 4xx/5xx
        return response.json() if response.content else None
    except ConnectionError:
        print(f"Cannot connect to {url} — is the service running?")
        return None
    except Timeout:
        print(f"Request to {url} timed out after {timeout}s")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"HTTP {e.response.status_code}: {e.response.text}")
        return None
```

Always set a `timeout`. Without it, a hung service will block your script indefinitely.

## Self-Hosted Apps with APIs

Here are practical examples against three of the most popular self-hosted apps. These are real endpoints you can use today.

### Nextcloud — OCS API

Nextcloud uses the OCS (Open Collaboration Services) API with Basic Auth. Add `format=json` to get JSON instead of XML.

**List all users:**

```bash
curl -s -u "admin:your_nextcloud_password" \
  -H "OCS-APIRequest: true" \
  "https://nextcloud.example.com/ocs/v2.php/cloud/users?format=json" | jq '.ocs.data.users'
```

The `OCS-APIRequest: true` header is required — Nextcloud rejects OCS requests without it.

**Create a new user:**

```bash
curl -s -X POST \
  -u "admin:your_nextcloud_password" \
  -H "OCS-APIRequest: true" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "userid=newuser&password=SecurePass123&email=user@example.com" \
  "https://nextcloud.example.com/ocs/v2.php/cloud/users?format=json"
```

**Get server status (no auth required):**

```bash
curl -s https://nextcloud.example.com/status.php | jq .
```

### Gitea — REST API v1

Gitea has a clean REST API. Generate a token at `Settings > Applications > Manage Access Tokens`.

**List your repositories:**

```bash
curl -s \
  -H "Authorization: Bearer your_gitea_token" \
  https://gitea.example.com/api/v1/user/repos | jq '.[].full_name'
```

**Create an issue:**

```bash
curl -s -X POST \
  -H "Authorization: Bearer your_gitea_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Automated issue from API",
    "body": "This issue was created by a script.",
    "labels": [1]
  }' \
  https://gitea.example.com/api/v1/repos/admin/my-repo/issues
```

**Search repositories:**

```bash
curl -s \
  -H "Authorization: Bearer your_gitea_token" \
  "https://gitea.example.com/api/v1/repos/search?q=docker&limit=5" | jq '.data[].full_name'
```

Gitea also publishes an OpenAPI/Swagger spec at `/api/swagger` — open it in your browser for the full endpoint reference.

### Home Assistant — REST API

Home Assistant uses long-lived access tokens. Generate one at `Profile > Long-Lived Access Tokens`.

**Get all entity states:**

```bash
curl -s \
  -H "Authorization: Bearer your_ha_token" \
  -H "Content-Type: application/json" \
  https://homeassistant.example.com:8123/api/states | jq '.[].entity_id'
```

**Get a specific entity state:**

```bash
curl -s \
  -H "Authorization: Bearer your_ha_token" \
  https://homeassistant.example.com:8123/api/states/sensor.living_room_temperature | jq '{state: .state, unit: .attributes.unit_of_measurement}'
```

**Call a service (turn on a light):**

```bash
curl -s -X POST \
  -H "Authorization: Bearer your_ha_token" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room"}' \
  https://homeassistant.example.com:8123/api/services/light/turn_on
```

**Fire an event:**

```bash
curl -s -X POST \
  -H "Authorization: Bearer your_ha_token" \
  -H "Content-Type: application/json" \
  -d '{"message": "Backup completed"}' \
  https://homeassistant.example.com:8123/api/events/custom_backup_done
```

Home Assistant's API is one of the most powerful in the self-hosting ecosystem. Combined with its automation engine, you can build complex workflows entirely through API calls.

## API Rate Limiting

Most APIs limit how many requests you can make in a given time window. This protects the server from being overwhelmed — whether by a bug in your script or a deliberate attack.

### How Rate Limiting Works

The server tracks your requests (usually by IP or API token) and returns headers telling you your limits:

```
X-RateLimit-Limit: 100        # Max requests per window
X-RateLimit-Remaining: 47     # Requests left in current window
X-RateLimit-Reset: 1708300800 # Unix timestamp when the window resets
```

When you exceed the limit, you get a `429 Too Many Requests` response. Your script should handle this:

```python
import requests
import time

def rate_limited_request(url, headers, max_retries=3):
    """Make a request with automatic retry on rate limit."""
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            print(f"Rate limited. Waiting {retry_after}s...")
            time.sleep(retry_after)
            continue

        return response

    raise Exception(f"Still rate limited after {max_retries} retries")
```

### Rate Limiting Best Practices

- **Add delays between bulk operations.** If creating 100 users, add a `time.sleep(0.5)` between each request.
- **Cache GET responses.** Don't fetch the same data repeatedly. Store it locally.
- **Use pagination.** Fetch large lists in pages instead of all at once.
- **Read the API docs.** Each app documents its specific limits (or lack thereof). Self-hosted apps often have no rate limiting at all — but that doesn't mean you should hammer them with 1,000 requests per second.

## Webhooks

Webhooks are the reverse of a normal API call. Instead of you asking the app for data (polling), the app sends data to your URL when something happens. Webhooks are event-driven — they fire immediately when triggered, with zero delay.

### How Webhooks Work

1. You set up an HTTP endpoint that can receive POST requests (a webhook receiver)
2. You register that URL in the app's webhook settings
3. When an event occurs (push to repo, new user created, sensor state change), the app sends a POST request to your URL with event details in the JSON body

### Gitea Webhook Example

In Gitea, go to `Repository Settings > Webhooks > Add Webhook`.

Configure:
- **Target URL:** `https://your-automation.example.com/webhook/gitea`
- **HTTP Method:** POST
- **Content Type:** application/json
- **Secret:** a shared secret for verifying the webhook is genuine
- **Trigger Events:** push, pull request, issue, etc.

Gitea sends a payload like this on every push:

```json
{
  "ref": "refs/heads/main",
  "before": "abc123...",
  "after": "def456...",
  "repository": {
    "full_name": "admin/my-repo"
  },
  "pusher": {
    "login": "admin"
  },
  "commits": [
    {
      "message": "Fix container restart policy",
      "url": "https://gitea.example.com/admin/my-repo/commit/def456"
    }
  ]
}
```

### Receiving Webhooks

A minimal Python webhook receiver:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import hmac
import hashlib

WEBHOOK_SECRET = "your_shared_secret"

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Verify the webhook signature (Gitea uses X-Gitea-Signature)
        signature = self.headers.get("X-Gitea-Signature", "")
        expected = hmac.new(
            WEBHOOK_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            self.send_response(403)
            self.end_headers()
            return

        payload = json.loads(body)
        print(f"Push to {payload['repository']['full_name']}")
        print(f"By: {payload['pusher']['login']}")

        self.send_response(200)
        self.end_headers()

server = HTTPServer(("0.0.0.0", 9000), WebhookHandler)
print("Webhook receiver listening on port 9000")
server.serve_forever()
```

Always verify webhook signatures. Without verification, anyone who discovers your webhook URL can send fake events. The shared secret ensures only the legitimate source can trigger your receiver.

For production use, run webhook receivers behind your reverse proxy with HTTPS. Tools like [n8n](/apps/n8n/) and [Huginn](/apps/huginn/) provide webhook receivers with visual workflow builders — far better than rolling your own for complex automation chains.

## Common Mistakes

### Forgetting Content-Type Header

Sending JSON without `Content-Type: application/json` is the number one API mistake. The server receives your data but doesn't know how to parse it, returning a 400 Bad Request or silently ignoring the body.

```bash
# Wrong — missing Content-Type
curl -X POST -d '{"name": "test"}' https://api.example.com/resource

# Correct
curl -X POST -H "Content-Type: application/json" -d '{"name": "test"}' https://api.example.com/resource
```

### Using HTTP Instead of HTTPS

API tokens sent over plain HTTP are visible to anyone on the network. Always use HTTPS, even on your local network. Self-signed certificates or a proper reverse proxy with Let's Encrypt solve this. See [SSL Certificates](/foundations/ssl-certificates/) for setup.

### Hardcoding Credentials in Scripts

Never put API tokens directly in script files that get committed to Git:

```python
# Wrong
TOKEN = "ghp_abc123def456"

# Right — use environment variables
import os
TOKEN = os.environ["GITEA_TOKEN"]
```

Store credentials in environment variables or a `.env` file excluded from version control. See [Docker Environment Variables](/foundations/docker-environment-variables/) for patterns.

### Not Handling Errors

Assuming every request succeeds will burn you. Network issues, service restarts, and auth token expiry all happen. Always check status codes:

```python
response = requests.get(url, headers=headers, timeout=10)
if response.status_code != 200:
    print(f"Failed: {response.status_code} — {response.text}")
    # Handle the error, don't just continue
```

### Invalid JSON

Single quotes, trailing commas, and unquoted keys are not valid JSON:

```bash
# Wrong (single quotes)
curl -d "{'name': 'test'}" ...

# Wrong (trailing comma)
curl -d '{"name": "test",}' ...

# Correct
curl -d '{"name": "test"}' ...
```

Use `jq` to validate JSON before sending: `echo '{"name": "test"}' | jq .`

## Next Steps

- **Automate with n8n.** If you want visual workflow automation between your self-hosted apps, [n8n](/apps/n8n/) connects to hundreds of APIs with a drag-and-drop interface.
- **Explore your apps' API docs.** Most self-hosted apps publish API documentation — Gitea at `/api/swagger`, Home Assistant at `/api/`, Nextcloud at the developer docs site.
- **Build a monitoring script.** Use what you learned here to write a script that checks the health of all your services via their APIs and sends alerts through [SMTP](/foundations/smtp-email-basics/).
- **Secure your API endpoints.** Restrict API access with firewall rules and strong tokens. See the [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist/).
- **Learn about ports and networking.** Understanding how your services expose APIs on the network is critical. See [Ports Explained](/foundations/ports-explained/).

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/) — deploy the apps you'll be interacting with via APIs
- [Docker Environment Variables](/foundations/docker-environment-variables/) — securely manage API keys and tokens in your containers
- [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist/) — protect your API endpoints
- [SSL Certificates](/foundations/ssl-certificates/) — encrypt API traffic with HTTPS
- [Ports Explained](/foundations/ports-explained/) — understand how services expose their APIs on the network
- [SMTP Email Basics](/foundations/smtp-email-basics/) — send notifications triggered by API events

## FAQ

### Do all self-hosted apps have APIs?

Most mature self-hosted apps expose a REST API, but not all. Apps like Pi-hole, Uptime Kuma, and Portainer all have APIs. Smaller or newer apps might not. Check the project's documentation or GitHub repository — look for an `api/` directory, Swagger/OpenAPI specs, or API documentation pages. If there's no API, you can sometimes interact with the app's database directly, but that's fragile and not recommended.

### Should I use curl or Python for API automation?

Use curl for one-off requests, quick testing, and simple scripts. Use Python (with the `requests` library) when you need loops, error handling, conditional logic, or chaining multiple API calls together. A good rule: if your shell script has more than 10 lines of curl commands, rewrite it in Python.

### How do I find the right API endpoint for what I want to do?

Start with the app's official documentation. Many apps publish interactive API docs — Gitea has Swagger at `/api/swagger`, Home Assistant documents everything at `developers.home-assistant.io`. If docs are sparse, check the app's source code on GitHub for route definitions. You can also use your browser's developer tools (Network tab) to see which API calls the web UI makes when you perform an action — then replicate those calls with curl.

### Is it safe to expose self-hosted APIs to the internet?

Only behind HTTPS with proper authentication. Never expose an API endpoint over plain HTTP. Use a reverse proxy with SSL termination, require strong API tokens, and consider restricting access by IP or through a VPN like Tailscale or WireGuard. For internal-only automation, keep APIs on your local network and use [Cloudflare Tunnel](/foundations/cloudflare-tunnel/) or [Tailscale](/foundations/tailscale-setup/) for remote access instead of opening ports.

### What's the difference between an API key and a bearer token?

Functionally, they're similar — both are strings you send with requests to authenticate. The difference is mostly in convention and management. API keys are typically long-lived, generated in an app's settings page, and sent in a custom header (like `X-API-Key`). Bearer tokens follow the OAuth standard, are sent in the `Authorization: Bearer <token>` header, and may be short-lived with refresh mechanisms. For self-hosting automation, the distinction rarely matters — use whichever the app provides.

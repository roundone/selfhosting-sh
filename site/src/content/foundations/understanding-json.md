---
title: "JSON Basics for Self-Hosting"
description: "Understand JSON syntax, structure, and common patterns used in Docker configs, API responses, and self-hosted application settings."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["json", "configuration", "api", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is JSON?

JSON (JavaScript Object Notation) is a text format for structured data. You'll encounter it constantly in self-hosting: Docker daemon configuration, API responses, application settings, Portainer templates, and webhook payloads.

Unlike [YAML](/foundations/yaml-basics) (which Docker Compose uses), JSON uses braces and brackets instead of indentation. It's stricter — no comments allowed, trailing commas break parsing — but also more universal. Every programming language and API speaks JSON.

## Prerequisites

- Basic command line knowledge ([Linux Basics](/foundations/linux-basics-self-hosting))
- A text editor ([Linux Text Editors](/foundations/linux-text-editors))

## JSON Syntax

### Data Types

JSON has six data types:

```json
{
  "string": "hello world",
  "number": 42,
  "float": 3.14,
  "boolean": true,
  "null_value": null,
  "array": [1, 2, 3],
  "object": {
    "nested_key": "nested_value"
  }
}
```

| Type | Example | Notes |
|------|---------|-------|
| String | `"hello"` | Always double-quoted. No single quotes. |
| Number | `42`, `3.14` | No quotes. Integers and floats. |
| Boolean | `true`, `false` | Lowercase. No quotes. |
| Null | `null` | Lowercase. Represents "no value." |
| Array | `[1, 2, 3]` | Ordered list. Can contain any types. |
| Object | `{"key": "val"}` | Key-value pairs. Keys must be strings. |

### Objects (Key-Value Pairs)

Objects are the most common JSON structure. They use curly braces `{}`:

```json
{
  "hostname": "server01",
  "ip": "192.168.1.100",
  "port": 8080,
  "ssl": true
}
```

Rules:
- Keys must be double-quoted strings
- Key-value pairs separated by commas
- No trailing comma after the last pair
- Keys must be unique within the same object

### Arrays (Ordered Lists)

Arrays use square brackets `[]`:

```json
{
  "dns_servers": ["1.1.1.1", "8.8.8.8", "9.9.9.9"],
  "ports": [80, 443, 8080],
  "services": [
    {"name": "nextcloud", "port": 8080},
    {"name": "jellyfin", "port": 8096}
  ]
}
```

### Nesting

JSON structures can be nested to any depth:

```json
{
  "server": {
    "network": {
      "interfaces": [
        {
          "name": "eth0",
          "addresses": ["192.168.1.100/24"]
        }
      ]
    }
  }
}
```

## JSON in Self-Hosting

### Docker Daemon Configuration

The Docker daemon reads `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "dns": ["1.1.1.1", "8.8.8.8"],
  "default-address-pools": [
    {
      "base": "172.17.0.0/12",
      "size": 24
    }
  ]
}
```

After editing, restart Docker:

```bash
sudo systemctl restart docker
```

A single syntax error in this file prevents Docker from starting. Always validate before restarting.

### API Responses

Most self-hosted apps expose REST APIs that return JSON:

```bash
# Nextcloud status
curl -s https://cloud.example.com/status.php | jq .

# Portainer API
curl -s -H "X-API-Key: your-key" \
  https://portainer.example.com/api/endpoints | jq .
```

### Application Configuration

Many apps store settings in JSON files:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000
  },
  "database": {
    "type": "postgres",
    "host": "db",
    "port": 5432,
    "name": "myapp",
    "user": "appuser",
    "password": "change-me"
  },
  "features": {
    "registration": false,
    "api_access": true
  }
}
```

## Working with JSON on the Command Line

### jq — The JSON Swiss Army Knife

`jq` is the essential tool for parsing JSON on the command line.

```bash
# Install jq
sudo apt install jq  # Debian/Ubuntu
sudo dnf install jq  # Fedora

# Pretty-print JSON
echo '{"name":"test","port":8080}' | jq .

# Extract a specific field
echo '{"name":"test","port":8080}' | jq '.name'
# Output: "test"

# Extract from nested objects
echo '{"server":{"port":8080}}' | jq '.server.port'
# Output: 8080

# Extract from arrays
echo '{"dns":["1.1.1.1","8.8.8.8"]}' | jq '.dns[0]'
# Output: "1.1.1.1"

# Filter arrays
echo '[{"name":"a","up":true},{"name":"b","up":false}]' | \
  jq '.[] | select(.up == true)'
```

### Validating JSON

Check if a file is valid JSON before applying it:

```bash
# Using jq
jq . /etc/docker/daemon.json > /dev/null
# Exit code 0 = valid, non-zero = invalid

# Using python
python3 -m json.tool /etc/docker/daemon.json > /dev/null
```

### Modifying JSON Files

Edit JSON with `jq`:

```bash
# Add a key
jq '. + {"new_key": "value"}' config.json > config_new.json

# Change a value
jq '.port = 9090' config.json > config_new.json

# Delete a key
jq 'del(.old_key)' config.json > config_new.json

# Add to an array
jq '.dns += ["9.9.9.9"]' daemon.json > daemon_new.json
```

Always write to a new file first, verify, then replace the original.

## JSON vs YAML

You'll use both formats in self-hosting. Here's when you see each:

| Format | Used In | Comments | Trailing Commas |
|--------|---------|----------|----------------|
| JSON | Docker daemon, APIs, app configs | Not allowed | Not allowed |
| YAML | Docker Compose, Ansible, K8s | Allowed | N/A (no commas) |

The same data in both formats:

**JSON:**
```json
{
  "services": {
    "web": {
      "image": "nginx:1.25",
      "ports": ["80:80"]
    }
  }
}
```

**YAML:**
```yaml
services:
  web:
    image: nginx:1.25
    ports:
      - "80:80"
```

YAML is generally easier to read and write. JSON is more universal and less ambiguous.

## Common Mistakes

### Trailing Commas

```json
{
  "name": "test",
  "port": 8080,
}
```

That trailing comma after `8080` is invalid JSON. Remove it. This is the single most common JSON syntax error.

### Single Quotes

```json
{
  'name': 'test'
}
```

JSON requires double quotes. Single quotes are invalid. Always use `"`.

### Unquoted Keys

```json
{
  name: "test"
}
```

Keys must be double-quoted strings. This isn't JavaScript — it's JSON.

### Comments

```json
{
  "port": 8080  // web server port
}
```

JSON does not support comments. Some tools (like VS Code) allow JSONC (JSON with Comments), but standard JSON parsers will reject this. Use a separate documentation file or inline the explanation in key names.

## Next Steps

- Learn YAML syntax at [YAML Basics](/foundations/yaml-basics) — used for Docker Compose
- Work with APIs using [API Basics](/foundations/api-basics)
- Configure Docker with [Docker Compose Basics](/foundations/docker-compose-basics)

## FAQ

### Can I add comments to JSON files?

Standard JSON does not support comments. Some tools support JSONC (JSON with Comments), but never rely on this for configs that other tools will read. If you need to document a JSON config, keep a separate README or use descriptive key names.

### What's the difference between JSON and JSON5?

JSON5 is an extension that allows comments, trailing commas, single quotes, and unquoted keys. Some newer tools support it, but most self-hosted applications expect standard JSON. Stick with standard JSON unless the app's documentation explicitly mentions JSON5 support.

### How do I convert between JSON and YAML?

Use `yq` (a YAML processor similar to `jq`): `yq -o=json '.' file.yaml` converts YAML to JSON. For the reverse: `yq -o=yaml '.' file.json`. Install with `snap install yq` or from the GitHub releases.

### Why does Docker use JSON for daemon config but YAML for Compose?

Historical reasons. The Docker daemon predates Docker Compose and was configured with JSON from the start. Compose was designed for human-readability and chose YAML. Both formats work fine for their respective purposes.

## Related

- [YAML Basics](/foundations/yaml-basics)
- [API Basics](/foundations/api-basics)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Linux Text Editors](/foundations/linux-text-editors)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)

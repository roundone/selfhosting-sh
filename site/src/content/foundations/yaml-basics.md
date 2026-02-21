---
title: "YAML Basics for Self-Hosting"
description: "A yaml syntax tutorial covering indentation, data types, anchors, and common pitfalls — everything you need for Docker Compose files."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "yaml", "docker-compose", "configuration"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is YAML?

YAML (YAML Ain't Markup Language) is the configuration format behind almost every self-hosted application you will deploy. Every `docker-compose.yml` file, every Ansible playbook, every Kubernetes manifest — all YAML. Understanding yaml syntax is not optional if you self-host anything. It is the first thing that will break when you misconfigure a service, and the source of the problem is almost always indentation.

YAML is designed to be human-readable. Compared to JSON, it drops the curly braces and quotes in favor of whitespace and indentation. This makes it cleaner to read — and far easier to break with a misplaced space.

This guide covers YAML from the ground up: syntax rules, data types, Docker Compose patterns, anchors, validation, and every common mistake that will waste your time if you do not learn to avoid them.

## Prerequisites

- Basic comfort with the Linux command line
- A text editor — see [Linux Text Editors](/foundations/linux-text-editors/)
- Familiarity with [Docker Compose Basics](/foundations/docker-compose-basics/) is helpful but not required

## YAML Syntax Rules

### Indentation

YAML uses indentation to define structure. This is its most powerful feature and its biggest pitfall. The rules are strict:

- **Use spaces, never tabs.** A single tab character anywhere in a YAML file is a syntax error. No exceptions.
- **Use 2-space indentation.** YAML does not mandate a specific number of spaces, but 2 spaces is the standard for Docker Compose files and the broader ecosystem. Pick 2 spaces and never deviate.
- **Indentation must be consistent within a block.** All items at the same level must have the same indentation.

```yaml
# Correct — 2-space indentation throughout
services:
  app:
    image: nginx:1.27.3
    ports:
      - "8080:80"
```

```yaml
# Wrong — mixed indentation (3 spaces then 2 spaces)
services:
   app:
     image: nginx:1.27.3
     ports:
      - "8080:80"
```

```yaml
# Wrong — tabs used (invisible but fatal)
services:
	app:
		image: nginx:1.27.3
```

Configure your editor to insert spaces when you press Tab and to display whitespace characters. This single setting prevents the majority of YAML errors.

### Key-Value Pairs

The fundamental building block of YAML is the key-value pair, separated by a colon and a space:

```yaml
image: nginx:1.27.3
container_name: webserver
restart: unless-stopped
```

The space after the colon is mandatory. `image:nginx` is invalid YAML. `image: nginx` is correct.

Keys are strings. Values can be strings, numbers, booleans, null, lists, or nested objects.

### Comments

Comments start with `#` and continue to the end of the line:

```yaml
services:
  app:
    image: nginx:1.27.3  # Pin to a specific version
    # This port mapping exposes the app on host port 8080
    ports:
      - "8080:80"
```

YAML has no multi-line comment syntax. Each comment line needs its own `#`.

### Lists (Sequences)

Lists are created with a dash and a space (`- `):

```yaml
# A list of strings
ports:
  - "8080:80"
  - "8443:443"

# A list of items
volumes:
  - app-data:/var/lib/app
  - ./config:/etc/app/config:ro
```

Lists can also be written inline using square brackets (flow syntax):

```yaml
tags: ["web", "production", "nginx"]
```

Both forms are valid. Use the block form (dashes) for Docker Compose files — it is easier to read when items are long.

### Nested Objects (Mappings)

Indent child keys under a parent to create nested structures:

```yaml
services:
  database:
    image: postgres:16.4-alpine
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: myapp
    volumes:
      - db-data:/var/lib/postgresql/data
```

Here, `database` is nested under `services`. `image`, `environment`, and `volumes` are nested under `database`. `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are nested under `environment`.

Each level of nesting adds exactly 2 more spaces of indentation.

### Multi-Line Strings

YAML offers two clean ways to handle multi-line values.

**Literal block (`|`)** — preserves newlines exactly as written:

```yaml
healthcheck:
  test: |
    curl -f http://localhost:3000/health
    && echo "healthy"
    || exit 1
  interval: 30s
```

**Folded block (`>`)** — joins lines into a single line (newlines become spaces):

```yaml
description: >
  This is a long description
  that will be folded into
  a single line.
```

The result of the folded block is: `This is a long description that will be folded into a single line.`

Use `|` when whitespace matters (scripts, commands). Use `>` when you want to wrap a long string across multiple lines for readability.

Both support a trailing `-` to strip the final newline:

```yaml
command: |-
  sh -c "echo hello && echo world"
```

## Data Types in YAML

YAML infers data types automatically. This is both a convenience and a trap.

### Strings

```yaml
# Unquoted — works for most strings
name: myapp

# Double-quoted — supports escape sequences (\n, \t)
message: "Line one\nLine two"

# Single-quoted — literal (no escape processing)
pattern: 'C:\Users\path'
```

### Numbers

```yaml
port: 8080          # Integer
ratio: 3.14         # Float
hex: 0xFF           # Hexadecimal (255)
octal: 0o77         # Octal (63)
```

### Booleans

```yaml
enabled: true
debug: false
```

YAML 1.1 (still used by many parsers) also treats these as booleans: `yes`, `no`, `on`, `off`, `y`, `n`, `True`, `False`, `YES`, `NO`. This is one of the most common sources of bugs. See the "Boolean Gotchas" section under Common Mistakes.

### Null

```yaml
value: null
also_null: ~
also_also_null:    # empty value is null
```

### The Quoting Rule

**Always quote strings that could be misinterpreted as another type.** This is not optional advice — it is the single most important defensive habit in YAML:

```yaml
# Dangerous — parsed as boolean true
feature_flag: yes

# Safe — explicitly a string
feature_flag: "yes"

# Dangerous — parsed as float
version: 1.0

# Safe — explicitly a string
version: "1.0"

# Dangerous — parsed as integer
zip_code: 01onal

# Safe — explicitly a string
zip_code: "01onal"
```

When in doubt, quote it. Quotes never hurt. Missing quotes cause silent data corruption.

## YAML vs JSON vs TOML

You will encounter all three formats in self-hosting. Here is when each one makes sense.

| Feature | YAML | JSON | TOML |
|---------|------|------|------|
| Comments | Yes (`#`) | No | Yes (`#`) |
| Human readability | High | Medium | High |
| Indentation-based | Yes | No (braces) | No (sections) |
| Standard for | Docker Compose, K8s, Ansible | APIs, package.json | Rust (Cargo.toml), some Go tools |
| Multi-line strings | Yes (`\|`, `>`) | No (escape `\n`) | Yes (triple quotes) |
| Footgun potential | High (indentation, type inference) | Low (explicit syntax) | Medium |

YAML is the standard for Docker Compose. You do not get to choose — `docker-compose.yml` is YAML. But when creating your own configuration files for scripts or tools, TOML or JSON are less error-prone choices.

**The honest take:** YAML's readability advantage disappears the moment you fight an indentation error for 30 minutes. Use a linter. Always.

## YAML in Docker Compose

Docker Compose files are the most common YAML you will write when self-hosting. Every Compose pattern maps directly to a YAML feature.

### Services as Nested Mappings

Each service is a nested mapping under the top-level `services` key:

```yaml
services:
  frontend:
    image: nginx:1.27.3
    ports:
      - "80:80"

  backend:
    image: myapp:2.1.0
    environment:
      DATABASE_URL: "postgres://db:5432/myapp"

  db:
    image: postgres:16.4-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
```

The top-level keys in a Compose file (`services`, `volumes`, `networks`, `secrets`, `configs`) are all at zero indentation. Everything else is nested underneath.

### Environment Variables — Two Syntaxes

Docker Compose accepts environment variables as either a mapping or a list. Both are valid YAML, and they do the same thing:

```yaml
# Mapping syntax (key: value)
environment:
  POSTGRES_USER: myapp
  POSTGRES_PASSWORD: secret
  POSTGRES_DB: myapp

# List syntax (- KEY=value)
environment:
  - POSTGRES_USER=myapp
  - POSTGRES_PASSWORD=secret
  - POSTGRES_DB=myapp
```

The mapping syntax is cleaner. The list syntax matches the format of `.env` files, making it easier to copy values back and forth. Pick one and be consistent within a project.

For managing environment variables at scale, see [Docker Environment Variables](/foundations/docker-environment-variables/).

### Ports as Quoted Strings

Always quote port mappings:

```yaml
# Correct — quoted
ports:
  - "8080:80"
  - "443:443"

# Risky — unquoted
ports:
  - 8080:80
```

Unquoted, YAML can interpret `80:80` as a base-60 integer (4880). Quoting prevents this entirely. Every Docker Compose example in official documentation uses quoted port strings. Follow that convention.

### Health Checks with Lists

Docker Compose health checks use the YAML list syntax for the `test` command:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

The flow-style list (`["CMD-SHELL", "..."]`) is standard for health check commands because it maps directly to how Docker executes them.

### depends_on with Conditions

A common Compose pattern nests conditions under `depends_on`:

```yaml
services:
  app:
    image: myapp:2.1.0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
```

This demonstrates a three-level nesting: `services` → `app` → `depends_on` → `db` → `condition`. Each level is indented by 2 spaces from its parent.

### Docker Compose Secrets

Secrets use both top-level declarations and per-service references:

```yaml
services:
  app:
    image: myapp:2.1.0
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

The `secrets` key appears twice — once inside a service (as a list of secret names) and once at the top level (defining where each secret lives). Both are valid YAML; Docker Compose gives them different meanings based on context. For a full walkthrough, see [Docker Compose Secrets](/foundations/docker-compose-secrets/).

### Profiles

Docker Compose profiles use a list inside each service to control which services start by default:

```yaml
services:
  app:
    image: myapp:2.1.0
    # No profiles — starts by default

  debug:
    image: busybox:1.37
    profiles:
      - debug
    command: sleep infinity
```

Only services without a `profiles` key (or with an active profile) start when you run `docker compose up`. See [Docker Compose Profiles](/foundations/docker-compose-profiles/) for the full guide.

## YAML Anchors and Aliases

Anchors (`&`) and aliases (`*`) let you reuse values without repeating them. This is native YAML — not a Docker Compose feature — but it works in Compose files.

### Basic Anchor and Alias

Define an anchor with `&name`, reference it with `*name`:

```yaml
x-common-env: &common-env
  TZ: America/New_York
  PUID: "1000"
  PGID: "1000"

services:
  app-one:
    image: app-one:3.2.1
    environment:
      <<: *common-env
      APP_SPECIFIC_VAR: value1

  app-two:
    image: app-two:1.5.0
    environment:
      <<: *common-env
      APP_SPECIFIC_VAR: value2
```

The `<<:` syntax is the merge key — it inserts all key-value pairs from the anchored mapping. Each service gets `TZ`, `PUID`, and `PGID` without repeating them.

The `x-` prefix on `x-common-env` is a Docker Compose convention for extension fields — top-level keys that Compose ignores. Use them for anchors that do not represent services, volumes, or networks.

### Anchor for Restart Policy and Logging

A practical pattern for self-hosting — define common service options once:

```yaml
x-service-defaults: &service-defaults
  restart: unless-stopped
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"

services:
  app:
    <<: *service-defaults
    image: myapp:2.1.0
    ports:
      - "8080:80"

  worker:
    <<: *service-defaults
    image: myapp-worker:2.1.0
```

Both `app` and `worker` inherit `restart: unless-stopped` and the logging configuration. If you need to change the restart policy across all services, you change it in one place.

### Limitations

Anchors and aliases are resolved by the YAML parser, not by Docker Compose. This means:

- You cannot anchor values across separate files
- Aliases cannot modify the anchored value — they copy it exactly (the merge key `<<:` is the one exception that allows combining)
- Deep merging is not supported — if the alias and the service both define `environment`, the service's version wins entirely rather than merging individual keys

Use anchors for simple deduplication. For anything more complex, use `.env` files or multiple Compose files with `docker compose -f`.

## Validating YAML

A YAML linter catches errors before they reach Docker Compose. Use one. Always.

### yamllint (Recommended)

Install it:

```bash
# Ubuntu/Debian
sudo apt install yamllint

# Or via pip
pip install yamllint
```

Run it:

```bash
yamllint docker-compose.yml
```

Output:

```
docker-compose.yml
  3:3       warning  wrong indentation: expected 2 but found 3  (indentation)
  7:1       error    syntax error: found a tab character where an indent was expected
```

Create a `.yamllint` config for your preferred rules:

```yaml
extends: default
rules:
  line-length:
    max: 200
  indentation:
    spaces: 2
    indent-sequences: true
  truthy:
    check-keys: true
```

The `truthy` rule catches unquoted boolean-like strings — one of the most useful checks.

### docker compose config

Docker Compose itself can validate your file:

```bash
docker compose config
```

This parses the Compose file, resolves variables and anchors, and prints the fully resolved configuration. If the file has syntax errors, it reports them. If it prints output without errors, your YAML is valid Compose.

This validates both YAML syntax and Compose-specific semantics (valid service keys, correct volume definitions, etc.). Use `yamllint` for pure YAML correctness and `docker compose config` for Compose correctness.

### Online Validators

If you want a quick check without installing anything, paste your YAML into [yamllint.com](http://www.yamllint.com). Do not paste files containing secrets or passwords into online tools.

## Common Mistakes

### Tabs Instead of Spaces

This is the number one YAML error. It is invisible in most editors and produces a cryptic error message:

```
yaml: line 3: found a tab character where an indent was expected
```

The fix: configure your editor to convert tabs to spaces. In VS Code, set `"editor.insertSpaces": true` and `"editor.tabSize": 2`. In nano, add `set tabstospaces` and `set tabsize 2` to `~/.nanorc`. In vim, add `set expandtab shiftwidth=2 tabstop=2` to `~/.vimrc`.

If you inherit a file with tabs, convert them:

```bash
sed -i 's/\t/  /g' docker-compose.yml
```

### Unquoted Strings That Look Like Other Types

YAML's automatic type inference silently converts values you intended as strings:

```yaml
# You meant the string "1.0" — YAML parses it as float 1.0
version: 1.0

# You meant the string "yes" — YAML parses it as boolean true
enable_feature: yes

# You meant the string "on" — YAML parses it as boolean true
status: on

# You meant the string "no" — YAML parses it as boolean false
country_code: no  # Norway's ISO code, now boolean false

# You meant the string "3.10" — YAML parses it as float 3.1 (trailing zero dropped)
python_version: 3.10

# You meant the string "0123" — YAML parses it as octal 83
id: 0123
```

The fix: **quote any value that is not intentionally a number, boolean, or null:**

```yaml
version: "1.0"
enable_feature: "yes"
status: "on"
country_code: "no"
python_version: "3.10"
id: "0123"
```

### Boolean Gotchas

YAML 1.1 recognizes all of these as booleans:

| True | False |
|------|-------|
| `true`, `True`, `TRUE` | `false`, `False`, `FALSE` |
| `yes`, `Yes`, `YES` | `no`, `No`, `NO` |
| `on`, `On`, `ON` | `off`, `Off`, `OFF` |
| `y`, `Y` | `n`, `N` |

This means `country_code: NO` (intended as Norway) becomes `country_code: false`. And `feature: ON` (intended as a string state) becomes `feature: true`.

YAML 1.2 restricts booleans to only `true` and `false`, but many tools (including some Docker Compose versions) still use YAML 1.1 parsers. **Do not rely on which YAML version your parser uses.** Quote everything that is not intentionally a boolean.

### Incorrect List Indentation

A subtle mistake — the dash in a list must be at the same indentation level as sibling keys, or indented under the parent:

```yaml
# Correct — dashes indented under ports
services:
  app:
    image: nginx:1.27.3
    ports:
      - "80:80"
      - "443:443"

# Wrong — dashes at the same level as ports
services:
  app:
    image: nginx:1.27.3
    ports:
    - "80:80"
    - "443:443"
```

Both examples above are actually valid YAML (the dash can be at the same level as the key or indented further), but the second form is confusing to read and inconsistent with Docker Compose conventions. Always indent list items under their parent key.

### Colon in Values

If your value contains a colon followed by a space, it must be quoted:

```yaml
# Wrong — YAML sees a nested mapping
description: Note: this breaks

# Correct — quoted
description: "Note: this breaks"

# Also correct — colon without trailing space is fine
image: ghcr.io/org/app:v2.1.0
```

The colon in `ghcr.io/org/app:v2.1.0` works unquoted because there is no space after it. But quoting Docker image references is still a safe habit.

### Trailing Whitespace

Invisible trailing spaces can cause unexpected behavior, especially in multi-line strings. Some YAML parsers treat trailing spaces as part of the value. Configure your editor to strip trailing whitespace on save.

### Duplicate Keys

YAML allows duplicate keys, but the last one wins silently:

```yaml
environment:
  DB_HOST: postgres
  DB_PORT: "5432"
  DB_HOST: mysql     # Silently overrides the first DB_HOST
```

No error is raised. `DB_HOST` is `mysql`. Use `yamllint` to catch this — it warns on duplicate keys by default.

## Next Steps

YAML is a tool, not a destination. Now that you understand the syntax, put it to work:

- **Build your first Compose stack** — [Docker Compose Basics](/foundations/docker-compose-basics/) walks through deploying a real application
- **Manage configuration cleanly** with environment variables — [Docker Environment Variables](/foundations/docker-environment-variables/)
- **Use profiles** to define optional services in a single Compose file — [Docker Compose Profiles](/foundations/docker-compose-profiles/)
- **Secure sensitive values** with the secrets feature — [Docker Compose Secrets](/foundations/docker-compose-secrets/)

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Docker Compose Profiles](/foundations/docker-compose-profiles/)
- [Docker Compose Secrets](/foundations/docker-compose-secrets/)
- [Linux Text Editors](/foundations/linux-text-editors/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)

## FAQ

### Do I need to use a `.yml` or `.yaml` extension?

Both work. Docker Compose looks for `docker-compose.yml` or `docker-compose.yaml` by default (and `compose.yml` / `compose.yaml` in v2). The `.yml` extension is more common in the Docker ecosystem. Pick one and be consistent across your server.

### Why does my YAML file fail with "found a tab character"?

You have a tab somewhere in the file. YAML does not allow tabs for indentation — only spaces. Open the file in an editor that shows whitespace characters, find the tab, and replace it with spaces. Better yet, configure your editor to always insert spaces when you press Tab.

### Can I split a long Docker Compose file into multiple files?

Yes. Use `docker compose -f docker-compose.yml -f docker-compose.override.yml up -d`. Compose merges the files, with later files overriding earlier ones for duplicate keys. This is useful for separating base configuration from environment-specific overrides. You can also use the `include` directive in Compose v2.20+ to include other Compose files directly.

### Is YAML whitespace-sensitive inside quoted strings?

No. Inside double or single quotes, whitespace is part of the literal string value and does not affect YAML parsing. YAML's whitespace sensitivity only applies to structural indentation — the spaces at the beginning of lines that define nesting. Once you are inside a quoted value, spaces, tabs, and newlines follow the quoting rules, not the indentation rules.

### How do I handle special characters in YAML values?

Quote the value. Double quotes (`"`) support escape sequences like `\n` (newline), `\t` (tab), and `\\` (literal backslash). Single quotes (`'`) treat everything literally — no escape processing. If your value contains both single and double quotes, use double quotes and escape the inner double quotes with `\"`.

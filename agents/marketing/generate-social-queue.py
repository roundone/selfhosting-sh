#!/usr/bin/env python3
"""
Generate social media queue posts for all published articles on selfhosting.sh.

Reads existing queue to avoid duplicates, scans all content directories,
generates 3 posts per article (X, Bluesky, Mastodon) with unique phrasing,
and appends to the social queue JSONL file.
"""

import json
import os
import random
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# --- Configuration ---

SITE_CONTENT_DIR = Path("/opt/selfhosting-sh/site/src/content")
QUEUE_FILE = Path("/opt/selfhosting-sh/queues/social-queue.jsonl")

CONTENT_DIRS = ["apps", "compare", "foundations", "replace", "hardware", "best", "troubleshooting"]

# Known app names that need special casing (slug -> display name)
SPECIAL_NAMES = {
    "adguard-home": "AdGuard Home",
    "pi-hole": "Pi-hole",
    "bookstack": "BookStack",
    "wireguard": "WireGuard",
    "docker-compose": "Docker Compose",
    "wiki-js": "Wiki.js",
    "haproxy": "HAProxy",
    "qbittorrent": "qBittorrent",
    "nginx-proxy-manager": "Nginx Proxy Manager",
    "home-assistant": "Home Assistant",
    "photoprism": "PhotoPrism",
    "uptime-kuma": "Uptime Kuma",
    "open-webui": "Open WebUI",
    "node-red": "Node-RED",
    "yourls": "YOURLS",
    "stirling-pdf": "Stirling-PDF",
    "esphome": "ESPHome",
    "librephotos": "LibrePhotos",
    "librespeed": "LibreSpeed",
    "zigbee2mqtt": "Zigbee2MQTT",
    "n8n": "n8n",
    "sftpgo": "SFTPGo",
    "privatebin": "PrivateBin",
    "calibre-web": "Calibre-Web",
    "hedgedoc": "HedgeDoc",
    "owncloud": "ownCloud",
    "rustdesk": "RustDesk",
    "sabnzbd": "SABnzbd",
    "microbin": "MicroBin",
    "netbird": "NetBird",
    "appflowy": "AppFlowy",
    "freshrss": "FreshRSS",
    "miniflux": "Miniflux",
    "nextcloud": "Nextcloud",
    "jellyfin": "Jellyfin",
    "plex": "Plex",
    "immich": "Immich",
    "vaultwarden": "Vaultwarden",
    "bitwarden": "Bitwarden",
    "traefik": "Traefik",
    "caddy": "Caddy",
    "portainer": "Portainer",
    "gitea": "Gitea",
    "forgejo": "Forgejo",
    "syncthing": "Syncthing",
    "seafile": "Seafile",
    "mealie": "Mealie",
    "paperless-ngx": "Paperless-ngx",
    "homarr": "Homarr",
    "homepage": "Homepage",
    "dashy": "Dashy",
    "grafana": "Grafana",
    "prometheus": "Prometheus",
    "authentik": "Authentik",
    "authelia": "Authelia",
    "keycloak": "Keycloak",
    "radarr": "Radarr",
    "sonarr": "Sonarr",
    "bazarr": "Bazarr",
    "prowlarr": "Prowlarr",
    "lidarr": "Lidarr",
    "jackett": "Jackett",
    "overseerr": "Overseerr",
    "jellyseerr": "Jellyseerr",
    "tautulli": "Tautulli",
    "kavita": "Kavita",
    "audiobookshelf": "Audiobookshelf",
    "ghost": "Ghost",
    "wordpress": "WordPress",
    "hugo": "Hugo",
    "proxmox": "Proxmox",
    "tailscale": "Tailscale",
    "headscale": "Headscale",
    "wg-easy": "wg-easy",
    "dockge": "Dockge",
    "yacht": "Yacht",
    "cosmos-cloud": "Cosmos Cloud",
    "watchtower": "Watchtower",
    "diun": "DIUN",
    "linkwarden": "Linkwarden",
    "linkding": "linkding",
    "wallabag": "Wallabag",
    "hoarder": "Hoarder",
    "joplin": "Joplin",
    "siyuan": "SiYuan",
    "trilium": "Trilium",
    "outline": "Outline",
    "obsidian": "Obsidian",
    "silverbullet": "SilverBullet",
    "memos": "Memos",
    "actual-budget": "Actual Budget",
    "firefly-iii": "Firefly III",
    "beszel": "Beszel",
    "blocky": "Blocky",
    "technitium": "Technitium",
    "borgbackup": "BorgBackup",
    "borgmatic": "Borgmatic",
    "duplicati": "Duplicati",
    "restic": "Restic",
    "crowdsec": "CrowdSec",
    "fail2ban": "Fail2ban",
    "docker-registry": "Docker Registry",
    "cloudflare-tunnel": "Cloudflare Tunnel",
    "dim": "Dim",
    "emby": "Emby",
    "stash": "Stash",
    "navidrome": "Navidrome",
    "planka": "Planka",
    "vikunja": "Vikunja",
    "wekan": "WeKan",
    "focalboard": "Focalboard",
    "leantime": "Leantime",
    "excalidraw": "Excalidraw",
    "drawio": "Draw.io",
    "reactive-resume": "Reactive Resume",
    "etherpad": "Etherpad",
    "answer": "Answer",
    "discourse": "Discourse",
    "flarum": "Flarum",
    "lemmy": "Lemmy",
    "element": "Element",
    "matrix": "Matrix",
    "ntfy": "ntfy",
    "gotify": "Gotify",
    "upsnap": "UpSnap",
    "guacamole": "Guacamole",
    "meshcentral": "MeshCentral",
    "docker-mailserver": "Docker Mailserver",
    "mailu": "Mailu",
    "modoboa": "Modoboa",
    "stalwart": "Stalwart",
    "gokapi": "Gokapi",
    "pingvin-share": "Pingvin Share",
    "picoshare": "PicoShare",
    "filebrowser": "FileBrowser",
    "duplicacy": "Duplicacy",
    "kopia": "Kopia",
    "urbackup": "UrBackup",
    "aria2": "Aria2",
    "metube": "MeTube",
    "pyload": "pyLoad",
    "openproject": "OpenProject",
    "taiga": "Taiga",
    "recipes": "Recipes",
    "tandoor": "Tandoor",
    "grocy": "Grocy",
    "monica": "Monica",
    "changedetection": "changedetection.io",
    "healthchecks": "Healthchecks",
    "gatus": "Gatus",
    "kuma": "Kuma",
    "umami": "Umami",
    "plausible": "Plausible",
    "matomo": "Matomo",
    "shlink": "Shlink",
    "conduit": "Conduit",
    "rocketchat": "Rocket.Chat",
    "zulip": "Zulip",
    "mattermost": "Mattermost",
    "baikal": "Baikal",
    "radicale": "Radicale",
    "dav": "DAV",
    "1password": "1Password",
    "google-photos": "Google Photos",
    "google-dns": "Google DNS",
    "google-analytics": "Google Analytics",
    "google-drive": "Google Drive",
    "google-calendar": "Google Calendar",
    "icloud": "iCloud",
    "gmail": "Gmail",
    "evernote": "Evernote",
    "dropbox": "Dropbox",
    "spotify": "Spotify",
    "lastpass": "LastPass",
    "dashlane": "Dashlane",
    "flickr": "Flickr",
    "trello": "Trello",
    "notion": "Notion",
    "slack": "Slack",
    "confluence": "Confluence",
    "auth0": "Auth0",
    "docker-desktop": "Docker Desktop",
    "audible": "Audible",
    "amazon-alexa": "Amazon Alexa",
    "amazon-music": "Amazon Music",
    "amazon-photos": "Amazon Photos",
    "apple-homekit": "Apple HomeKit",
    "apple-music": "Apple Music",
    "apple-tv": "Apple TV",
    "cloudflare-dns": "Cloudflare DNS",
    "affine": "AFFiNE",
}


# --- Post Templates ---

APP_TEMPLATES_X = [
    "Complete guide to self-hosting {app_name} with Docker Compose \u2014 setup, config, and tips. {url} #selfhosted",
    "Self-host {app_name}: Docker Compose config, setup walkthrough, and what to watch out for. {url} #selfhosted #docker",
    "{app_name} Docker setup guide \u2014 everything you need from image selection to first login. {url} #selfhosted",
    "How to self-host {app_name} \u2014 our step-by-step Docker Compose guide has you covered. {url} #selfhosted",
    "Run {app_name} on your own hardware. Full Docker Compose setup guide with config tips. {url} #selfhosted #homelab",
    "Self-hosting {app_name}? Our guide covers the Docker setup, configuration, and gotchas. {url} #selfhosted",
    "Deploy {app_name} with Docker Compose in minutes. Full setup guide: {url} #selfhosted",
    "Take control of your data \u2014 self-host {app_name}. Docker guide walks you through it. {url} #selfhosted",
]

APP_TEMPLATES_BLUESKY = [
    "Want to self-host {app_name}? Our guide covers Docker Compose setup, configuration, and common gotchas so you can get running fast. {url}",
    "Self-hosting {app_name} is easier than you think. Docker Compose config, step-by-step setup, and tips from actual deployment. {url}",
    "Just published: how to self-host {app_name}. Docker Compose config included, plus the settings most guides skip. {url}",
    "If you've been thinking about running {app_name} yourself, here's the guide. Docker Compose setup from scratch to working instance. {url}",
    "{app_name} is one of those apps that's worth self-hosting. Here's our full setup guide with Docker Compose. {url}",
    "Step-by-step guide to running {app_name} on your own server. Docker Compose, config, and tips for a smooth setup. {url}",
]

APP_TEMPLATES_MASTODON = [
    "New guide: Self-hosting {app_name} with Docker Compose\n\n{description_short}\n\nFull setup walkthrough with Docker Compose config, configuration tips, and common issues.\n\n{url}\n\n#selfhosted #homelab #docker #linux #foss #opensource",
    "How to self-host {app_name}\n\n{description_short}\n\nDocker Compose setup, configuration, and tips for getting it right the first time.\n\n{url}\n\n#selfhosted #homelab #docker #linux #foss #opensource",
    "Published: {app_name} self-hosting guide\n\n{description_short}\n\nFrom Docker Compose config to first login \u2014 everything you need.\n\n{url}\n\n#selfhosted #homelab #docker #linux #foss #opensource",
]

COMPARE_TEMPLATES_X = [
    "{app_a} vs {app_b} \u2014 which self-hosted option is right for you? Full comparison: {url} #selfhosted",
    "Choosing between {app_a} and {app_b}? Here's our honest comparison: {url} #selfhosted",
    "{app_a} or {app_b}? We compared features, setup, and performance. See the results: {url} #selfhosted",
    "Thinking about {app_a} vs {app_b}? We tested both. Here's what we found: {url} #selfhosted",
    "The {app_a} vs {app_b} debate, settled. Features, Docker setup, and our pick: {url} #selfhosted",
]

COMPARE_TEMPLATES_BLUESKY = [
    "{app_a} or {app_b}? We compare features, performance, ease of setup, and who should choose which. {url}",
    "We ran both {app_a} and {app_b} side by side. Here's how they compare on features, setup, and daily use. {url}",
    "{app_a} vs {app_b} \u2014 honest comparison. We break down who each one is best for and why. {url}",
    "Can't decide between {app_a} and {app_b}? We compare them head-to-head so you don't have to test both. {url}",
]

COMPARE_TEMPLATES_MASTODON = [
    "{app_a} vs {app_b} \u2014 self-hosted comparison\n\nWe break down features, performance, Docker setup, and use cases.\n\n{url}\n\n#selfhosted #homelab #docker #foss #opensource #linux",
    "{app_a} or {app_b}?\n\nDetailed comparison covering features, resource usage, setup complexity, and which one fits your needs.\n\n{url}\n\n#selfhosted #homelab #docker #foss #opensource #linux",
    "Comparison: {app_a} vs {app_b}\n\nBoth are solid self-hosted options. We tested them head-to-head to help you choose.\n\n{url}\n\n#selfhosted #homelab #docker #foss #opensource #linux",
]

FOUNDATIONS_TEMPLATES_X = [
    "{title} \u2014 essential knowledge for self-hosting. {url} #selfhosted #homelab",
    "{title} \u2014 core concepts every self-hoster should know. {url} #selfhosted",
    "Foundation guide: {title}. The basics that make everything else easier. {url} #selfhosted #homelab",
    "{title} \u2014 if you're self-hosting, you need to understand this. {url} #selfhosted",
]

FOUNDATIONS_TEMPLATES_BLUESKY = [
    "Foundation guide: {title}. Core knowledge every self-hoster should have. {url}",
    "Published a foundation guide on {title}. These basics save you hours of debugging later. {url}",
    "Self-hosting fundamentals: {title}. Whether you're starting out or filling gaps, this one's worth reading. {url}",
]

FOUNDATIONS_TEMPLATES_MASTODON = [
    "{title} \u2014 foundation guide for self-hosters\n\n{description_short}\n\n{url}\n\n#selfhosted #homelab #docker #linux #foss #opensource #tutorial",
    "Foundation guide: {title}\n\n{description_short}\n\nCore knowledge that makes self-hosting easier.\n\n{url}\n\n#selfhosted #homelab #docker #linux #foss #opensource #tutorial",
]

REPLACE_TEMPLATES_X = [
    "Self-hosted alternative to {service} \u2014 stop paying and run your own. {url} #selfhosted",
    "Replace {service} with self-hosted options. Our guide covers the best alternatives. {url} #selfhosted",
    "Tired of paying for {service}? Here are the best self-hosted replacements. {url} #selfhosted",
    "Ditch {service} \u2014 self-host your own. Best alternatives compared: {url} #selfhosted #homelab",
    "Self-hosted {service} alternatives that actually work. Compared and ranked: {url} #selfhosted",
]

REPLACE_TEMPLATES_BLUESKY = [
    "Replace {service} with self-hosted alternatives. We cover the best options and how to set them up. {url}",
    "You don't need {service}. These self-hosted alternatives give you the same features on your own hardware. {url}",
    "Self-hosted replacements for {service} \u2014 we compare the top options and walk through Docker setup for each. {url}",
    "Want to drop {service}? Here are the self-hosted alternatives worth considering, with setup guides. {url}",
]

REPLACE_TEMPLATES_MASTODON = [
    "Replace {service} with self-hosted alternatives\n\nStop paying for cloud subscriptions. Here are the best self-hosted replacements.\n\n{url}\n\n#selfhosted #homelab #privacy #foss #opensource #linux #degoogle",
    "Self-hosted alternatives to {service}\n\nWe compare the top options, show you how to set them up with Docker, and recommend our pick.\n\n{url}\n\n#selfhosted #homelab #privacy #foss #opensource #linux #degoogle",
    "Ditch {service}, self-host instead\n\nOur guide compares the best self-hosted replacements and walks through setup.\n\n{url}\n\n#selfhosted #homelab #privacy #foss #opensource #linux #degoogle",
]

HARDWARE_TEMPLATES_X = [
    "{title} \u2014 build the right setup for your self-hosting needs. {url} #selfhosted #homelab",
    "{title} \u2014 what you actually need (and what's overkill). {url} #selfhosted #homelab",
    "Hardware guide: {title}. Recommendations for every budget. {url} #selfhosted #homelab",
    "{title} \u2014 our picks for every price point. {url} #selfhosted #homelab",
]

HARDWARE_TEMPLATES_BLUESKY = [
    "{title} \u2014 our hardware guide covers what you actually need and what's overkill. {url}",
    "New hardware guide: {title}. We break down specs, recommendations, and value at every budget level. {url}",
    "{title}. Practical recommendations based on actual self-hosting workloads, not theoretical benchmarks. {url}",
]

HARDWARE_TEMPLATES_MASTODON = [
    "{title}\n\nPicking hardware for self-hosting? Our guide covers specs, recommendations, and what makes sense at every budget.\n\n{url}\n\n#selfhosted #homelab #hardware #linux #foss #homeserver",
    "{title}\n\nPractical hardware recommendations for self-hosters. We cover what matters for real workloads.\n\n{url}\n\n#selfhosted #homelab #hardware #linux #foss #homeserver",
]

BEST_TEMPLATES_X = [
    "Best self-hosted {category} apps in 2026 \u2014 our top picks with Docker setup guides. {url} #selfhosted",
    "Top self-hosted {category} apps, ranked. Each one with a Docker Compose setup guide. {url} #selfhosted",
    "Looking for the best self-hosted {category} solution? We tested them all. {url} #selfhosted #homelab",
    "Ranked: best self-hosted {category} apps. Our picks + Docker setup for each. {url} #selfhosted",
]

BEST_TEMPLATES_BLUESKY = [
    "The best self-hosted {category} apps, ranked. We've tested them all and picked our favorites. {url}",
    "Which self-hosted {category} app should you use? We ranked the top options based on real usage. {url}",
    "Best self-hosted {category} apps in 2026. We tried them all and have opinions. {url}",
]

BEST_TEMPLATES_MASTODON = [
    "Best self-hosted {category} apps in 2026\n\nOur ranked picks with setup guides for each one.\n\n{url}\n\n#selfhosted #homelab #foss #opensource #linux #docker",
    "Top self-hosted {category} apps, compared and ranked\n\nWe tested them all. Here are our picks with Docker Compose setup guides.\n\n{url}\n\n#selfhosted #homelab #foss #opensource #linux #docker",
]

TROUBLESHOOTING_TEMPLATES_X = [
    "{title} \u2014 fix common self-hosting issues fast. {url} #selfhosted #docker",
    "Troubleshooting: {title}. Common problems and how to fix them. {url} #selfhosted",
    "{title} \u2014 quick fixes for a common self-hosting headache. {url} #selfhosted #docker",
    "Hit this issue? {title}. Here's how to fix it: {url} #selfhosted",
]

TROUBLESHOOTING_TEMPLATES_BLUESKY = [
    "Troubleshooting guide: {title}. Common issues and how to fix them. {url}",
    "If you've been stuck on this: {title}. Our troubleshooting guide has the fix. {url}",
    "New troubleshooting guide: {title}. Step-by-step solutions for the most common causes. {url}",
]

TROUBLESHOOTING_TEMPLATES_MASTODON = [
    "Troubleshooting: {title}\n\nCommon issues and solutions for self-hosters.\n\n{url}\n\n#selfhosted #homelab #docker #linux #troubleshooting",
    "Fix: {title}\n\nWe cover the most common causes and how to resolve them.\n\n{url}\n\n#selfhosted #homelab #docker #linux #troubleshooting",
]


# --- Helper Functions ---

def format_name(slug):
    """Convert a slug to a display name, using special casing when known."""
    if slug in SPECIAL_NAMES:
        return SPECIAL_NAMES[slug]
    # Default: capitalize first letter of each word
    return " ".join(word.capitalize() for word in slug.split("-"))


def parse_frontmatter(filepath):
    """Parse YAML frontmatter from a markdown file. Returns dict or None if draft."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
    except Exception as e:
        print(f"  WARNING: Could not read {filepath}: {e}", file=sys.stderr)
        return None

    # Find frontmatter between --- delimiters
    if not text.startswith("---"):
        return None

    end_idx = text.find("---", 3)
    if end_idx == -1:
        return None

    fm_text = text[3:end_idx].strip()

    result = {}
    for line in fm_text.split("\n"):
        line = line.strip()
        # Simple YAML key: value parsing for the fields we need
        if line.startswith("title:"):
            val = line[len("title:"):].strip().strip('"').strip("'")
            result["title"] = val
        elif line.startswith("description:"):
            val = line[len("description:"):].strip().strip('"').strip("'")
            result["description"] = val
        elif line.startswith("draft:"):
            val = line[len("draft:"):].strip().lower()
            if val == "true":
                return None  # Skip drafts

    return result


def slug_from_path(filepath, content_type):
    """Generate URL slug from file path relative to its content type directory."""
    content_dir = SITE_CONTENT_DIR / content_type
    rel = filepath.relative_to(content_dir)
    # Remove .md extension and return the path
    return str(rel.with_suffix(""))


def build_url(content_type, slug):
    """Build the full URL from content type and slug."""
    return f"https://selfhosting.sh/{content_type}/{slug}/"


def truncate_text(text, max_len):
    """Truncate text to fit within max_len, cutting at word boundary."""
    if len(text) <= max_len:
        return text
    # Find last space before max_len
    truncated = text[:max_len - 3]
    last_space = truncated.rfind(" ")
    if last_space > max_len // 2:
        truncated = truncated[:last_space]
    return truncated + "..."


def short_description(description, max_len=120):
    """Get a short version of the description."""
    if not description:
        return ""
    if len(description) <= max_len:
        return description
    truncated = description[:max_len]
    last_space = truncated.rfind(" ")
    if last_space > max_len // 2:
        truncated = truncated[:last_space]
    # Remove trailing punctuation fragments
    truncated = truncated.rstrip(" ,;\u2014-")
    if not truncated.endswith("."):
        truncated += "."
    return truncated


def parse_compare_slug(slug):
    """Parse 'foo-vs-bar' into (Foo, Bar) with proper name formatting."""
    parts = slug.split("-vs-")
    if len(parts) == 2:
        return format_name(parts[0]), format_name(parts[1])
    # Fallback
    return slug, ""


def parse_replace_slug(slug):
    """Parse replace slug into a service name."""
    return format_name(slug)


def parse_best_slug(slug):
    """Parse best/roundup slug into a category name."""
    return " ".join(word for word in slug.split("-"))


def pick_template_within_limit(templates, format_kwargs, max_len):
    """Pick a random template, falling back to shorter ones if needed."""
    random.shuffle(templates)
    for t in templates:
        text = t.format(**format_kwargs)
        if len(text) <= max_len:
            return text
    # All too long, truncate the shortest
    candidates = [(t.format(**format_kwargs), t) for t in templates]
    candidates.sort(key=lambda x: len(x[0]))
    return truncate_text(candidates[0][0], max_len)


def generate_app_posts(app_name, url, description):
    """Generate X, Bluesky, Mastodon posts for an app guide."""
    desc_short = short_description(description)
    posts = []
    kwargs = {"app_name": app_name, "url": url, "description_short": desc_short}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(APP_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(APP_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(APP_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_compare_posts(app_a, app_b, url, description):
    """Generate X, Bluesky, Mastodon posts for a comparison article."""
    posts = []
    kwargs = {"app_a": app_a, "app_b": app_b, "url": url}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(COMPARE_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(COMPARE_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(COMPARE_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_foundations_posts(title, url, description):
    """Generate posts for a foundation guide."""
    desc_short = short_description(description)
    posts = []
    kwargs = {"title": title, "url": url, "description_short": desc_short}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(FOUNDATIONS_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(FOUNDATIONS_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(FOUNDATIONS_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_replace_posts(service, url, description):
    """Generate posts for a replace guide."""
    posts = []
    kwargs = {"service": service, "url": url}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(REPLACE_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(REPLACE_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(REPLACE_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_hardware_posts(title, url, description):
    """Generate posts for a hardware guide."""
    posts = []
    kwargs = {"title": title, "url": url}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(HARDWARE_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(HARDWARE_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(HARDWARE_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_best_posts(category, url, description):
    """Generate posts for a best/roundup guide."""
    posts = []
    kwargs = {"category": category, "url": url}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(BEST_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(BEST_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(BEST_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


def generate_troubleshooting_posts(title, url, description):
    """Generate posts for a troubleshooting guide."""
    posts = []
    kwargs = {"title": title, "url": url}

    posts.append({"platform": "x", "text": pick_template_within_limit(list(TROUBLESHOOTING_TEMPLATES_X), kwargs, 280)})
    posts.append({"platform": "bluesky", "text": pick_template_within_limit(list(TROUBLESHOOTING_TEMPLATES_BLUESKY), kwargs, 300)})
    posts.append({"platform": "mastodon", "text": pick_template_within_limit(list(TROUBLESHOOTING_TEMPLATES_MASTODON), kwargs, 500)})
    return posts


# --- Main Script ---

def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Read existing queue and extract already-covered URLs
    existing_urls = set()
    existing_lines = 0
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                existing_lines += 1
                try:
                    entry = json.loads(line)
                    if "url" in entry:
                        existing_urls.add(entry["url"])
                except json.JSONDecodeError:
                    pass

    print(f"Existing queue: {existing_lines} entries covering {len(existing_urls)} unique URLs")
    print()

    # 2. Scan all content directories and generate posts
    all_new_posts = []
    stats = {"x": 0, "bluesky": 0, "mastodon": 0}
    articles_processed = 0
    articles_skipped_draft = 0
    articles_skipped_existing = 0
    articles_skipped_error = 0

    for content_type in CONTENT_DIRS:
        content_dir = SITE_CONTENT_DIR / content_type
        if not content_dir.exists():
            print(f"  WARNING: Directory {content_dir} does not exist, skipping")
            continue

        # Find all .md files (including subdirectories for troubleshooting)
        md_files = sorted(content_dir.rglob("*.md"))
        type_count = 0

        for filepath in md_files:
            slug = slug_from_path(filepath, content_type)
            url = build_url(content_type, slug)

            # Skip if already in queue
            if url in existing_urls:
                articles_skipped_existing += 1
                continue

            # Parse frontmatter
            fm = parse_frontmatter(filepath)
            if fm is None:
                articles_skipped_draft += 1
                continue

            title = fm.get("title", "")
            description = fm.get("description", "")

            if not title:
                print(f"  WARNING: No title found in {filepath}, skipping", file=sys.stderr)
                articles_skipped_error += 1
                continue

            # Generate posts based on content type
            posts = []
            try:
                if content_type == "apps":
                    app_name = format_name(slug)
                    posts = generate_app_posts(app_name, url, description)

                elif content_type == "compare":
                    app_a, app_b = parse_compare_slug(slug)
                    if app_b:
                        posts = generate_compare_posts(app_a, app_b, url, description)
                    else:
                        posts = generate_foundations_posts(title, url, description)

                elif content_type == "foundations":
                    posts = generate_foundations_posts(title, url, description)

                elif content_type == "replace":
                    service = parse_replace_slug(slug)
                    posts = generate_replace_posts(service, url, description)

                elif content_type == "hardware":
                    posts = generate_hardware_posts(title, url, description)

                elif content_type == "best":
                    category = parse_best_slug(slug)
                    posts = generate_best_posts(category, url, description)

                elif content_type == "troubleshooting":
                    posts = generate_troubleshooting_posts(title, url, description)

            except Exception as e:
                print(f"  ERROR generating posts for {filepath}: {e}", file=sys.stderr)
                articles_skipped_error += 1
                continue

            # Add metadata to each post
            for post in posts:
                post["type"] = "article_link"
                post["url"] = url
                post["queued_at"] = now
                stats[post["platform"]] += 1

            all_new_posts.extend(posts)
            articles_processed += 1
            type_count += 1

        print(f"  {content_type}: {type_count} new articles queued ({len(md_files)} total files)")

    print()

    # 3. Append to queue file
    if all_new_posts:
        with open(QUEUE_FILE, "a", encoding="utf-8") as f:
            for post in all_new_posts:
                f.write(json.dumps(post, ensure_ascii=False) + "\n")

    # 4. Count final queue size
    final_lines = 0
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    final_lines += 1

    # 5. Print summary
    print("=" * 60)
    print("SOCIAL QUEUE GENERATION COMPLETE")
    print("=" * 60)
    print()
    print(f"Articles processed:          {articles_processed}")
    print(f"Articles skipped (existing): {articles_skipped_existing}")
    print(f"Articles skipped (draft):    {articles_skipped_draft}")
    print(f"Articles skipped (error):    {articles_skipped_error}")
    print()
    print(f"Total NEW posts generated:   {len(all_new_posts)}")
    print(f"  X (Twitter):               {stats['x']}")
    print(f"  Bluesky:                   {stats['bluesky']}")
    print(f"  Mastodon:                  {stats['mastodon']}")
    print()
    print(f"Queue before:                {existing_lines} entries")
    print(f"Queue after:                 {final_lines} entries")
    print(f"Net new entries:             {final_lines - existing_lines}")


if __name__ == "__main__":
    main()

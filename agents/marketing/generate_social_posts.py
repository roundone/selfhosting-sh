#!/usr/bin/env python3
"""Generate unique social media posts for new articles across X, Bluesky, and Mastodon."""

import json
import random
from datetime import datetime, timezone

QUEUE_FILE = "/opt/selfhosting-sh/queues/social-queue.jsonl"
BASE_URL = "https://selfhosting.sh"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Article definitions ──────────────────────────────────────────────────────

articles = [
    # COMPARISONS
    {
        "slug": "/compare/ollama-vs-localai",
        "topic": "Ollama vs LocalAI",
        "category": "ai",
        "hook": "self-hosted AI inference",
        "detail": "Ollama is dead simple for single-model use. LocalAI gives you an OpenAI-compatible API with multi-model support. Different tools for different jobs.",
        "angle": "Run LLMs on your own hardware",
    },
    {
        "slug": "/compare/stable-diffusion-vs-comfyui",
        "topic": "Stable Diffusion WebUI vs ComfyUI",
        "category": "ai",
        "hook": "self-hosted image generation",
        "detail": "WebUI is the approachable all-in-one. ComfyUI is the node-based powerhouse for complex workflows. Both run locally on your GPU.",
        "angle": "Generate images without cloud APIs",
    },
    {
        "slug": "/compare/meilisearch-vs-typesense",
        "topic": "Meilisearch vs Typesense",
        "category": "search",
        "hook": "self-hosted search engines",
        "detail": "Both are fast, typo-tolerant search engines you can self-host. Meilisearch is simpler to set up. Typesense handles larger datasets better.",
        "angle": "Replace Algolia with something you own",
    },
    {
        "slug": "/compare/searxng-vs-whoogle",
        "topic": "SearXNG vs Whoogle",
        "category": "privacy",
        "hook": "private meta search",
        "detail": "SearXNG aggregates 70+ search engines with full customization. Whoogle is a lightweight Google proxy. Privacy-first search, self-hosted.",
        "angle": "Search the web without being tracked",
    },
    {
        "slug": "/compare/discourse-vs-flarum",
        "topic": "Discourse vs Flarum",
        "category": "community",
        "hook": "self-hosted forum software",
        "detail": "Discourse is the feature-rich heavyweight needing 2GB+ RAM. Flarum is the lightweight modern alternative. Both are solid forum platforms.",
        "angle": "Build your own community forum",
    },
    {
        "slug": "/compare/frigate-vs-zoneminder",
        "topic": "Frigate vs ZoneMinder",
        "category": "surveillance",
        "hook": "self-hosted NVR",
        "detail": "Frigate has AI-powered object detection and tight Home Assistant integration. ZoneMinder is the battle-tested veteran with deep config options.",
        "angle": "Self-hosted security camera recording",
    },
    {
        "slug": "/compare/k3s-vs-microk8s",
        "topic": "k3s vs MicroK8s",
        "category": "infrastructure",
        "hook": "lightweight Kubernetes",
        "detail": "k3s is a single binary, minimal, CNCF-certified. MicroK8s uses snap packages with built-in add-ons. Both run great on low-resource hardware.",
        "angle": "Kubernetes on a home server",
    },
    {
        "slug": "/compare/planka-vs-wekan",
        "topic": "Planka vs Wekan",
        "category": "productivity",
        "hook": "self-hosted kanban boards",
        "detail": "Planka is clean, Trello-like, and lightweight. Wekan is feature-dense with swimlanes, WIP limits, and advanced board management.",
        "angle": "Replace Trello with something you control",
    },
    {
        "slug": "/compare/appflowy-vs-outline",
        "topic": "AppFlowy vs Outline",
        "category": "knowledge",
        "hook": "self-hosted knowledge bases",
        "detail": "AppFlowy is a Notion-like workspace built in Rust and Flutter. Outline is a polished team wiki with SSO and Slack integration.",
        "angle": "Self-hosted knowledge management",
    },
    {
        "slug": "/compare/home-assistant-vs-esphome",
        "topic": "Home Assistant vs ESPHome",
        "category": "smarthome",
        "hook": "smart home automation",
        "detail": "They're complementary, not competitors. Home Assistant is the brain. ESPHome flashes custom firmware onto ESP devices. Use both together.",
        "angle": "Smart home without cloud dependencies",
    },
    {
        "slug": "/compare/home-assistant-vs-homebridge",
        "topic": "Home Assistant vs Homebridge",
        "category": "smarthome",
        "hook": "smart home platforms",
        "detail": "Home Assistant is a full automation platform. Homebridge bridges non-HomeKit devices into Apple Home. Very different scopes and goals.",
        "angle": "Which smart home platform to self-host",
    },
    {
        "slug": "/compare/hedgedoc-vs-etherpad",
        "topic": "HedgeDoc vs Etherpad",
        "category": "collaboration",
        "hook": "collaborative editing",
        "detail": "HedgeDoc does Markdown with split preview. Etherpad does rich text with real-time collaboration. Pick based on your editing style.",
        "angle": "Self-hosted Google Docs alternatives",
    },
    {
        "slug": "/compare/affine-vs-appflowy",
        "topic": "AFFiNE vs AppFlowy",
        "category": "knowledge",
        "hook": "Notion alternatives",
        "detail": "Both aim to replace Notion. AFFiNE adds a whiteboard canvas mode. AppFlowy focuses on a clean, fast editing experience. Both are open source.",
        "angle": "Ditch Notion, self-host your workspace",
    },
    {
        "slug": "/compare/docmost-vs-trilium",
        "topic": "Docmost vs Trilium",
        "category": "notes",
        "hook": "self-hosted note-taking",
        "detail": "Docmost is a modern Notion-style docs platform. Trilium is a personal knowledge base with hierarchical notes and scripting support.",
        "angle": "Self-hosted notes that stay private",
    },
    {
        "slug": "/compare/memos-vs-trilium",
        "topic": "Memos vs Trilium",
        "category": "notes",
        "hook": "self-hosted note-taking",
        "detail": "Memos is a Twitter-like microblog for quick thoughts. Trilium is a structured knowledge base for deep notes. Honestly complementary tools.",
        "angle": "Quick notes vs deep knowledge management",
    },
    # APP GUIDES
    {
        "slug": "/apps/calcom",
        "topic": "Cal.com",
        "category": "scheduling",
        "hook": "self-hosted scheduling",
        "detail": "Open-source Calendly alternative. Booking pages, calendar sync, team scheduling, all on your own infrastructure.",
        "angle": "Replace Calendly with Cal.com",
    },
    {
        "slug": "/apps/listmonk",
        "topic": "Listmonk",
        "category": "email",
        "hook": "self-hosted newsletter manager",
        "detail": "High-performance mailing list manager written in Go. Handles millions of subscribers. One binary, PostgreSQL backend, beautiful UI.",
        "angle": "Replace Mailchimp for $0/month",
    },
    {
        "slug": "/apps/searxng",
        "topic": "SearXNG",
        "category": "privacy",
        "hook": "self-hosted meta search engine",
        "detail": "Aggregates results from 70+ search engines. No tracking, no ads, full customization. Your own private search engine.",
        "angle": "Private search you actually control",
    },
    # FOUNDATIONS
    {
        "slug": "/foundations/container-orchestration-basics",
        "topic": "Container Orchestration Basics",
        "category": "infrastructure",
        "hook": "container orchestration",
        "detail": "Docker Compose for single-node. Swarm for simple multi-node. K3s when you need full Kubernetes power. Know when to use what.",
        "angle": "Beyond docker-compose up",
    },
    {
        "slug": "/foundations/ldap-basics",
        "topic": "LDAP Basics",
        "category": "auth",
        "hook": "LDAP for self-hosters",
        "detail": "LDAP gives you single sign-on across all your self-hosted services. One user directory, one password, every app.",
        "angle": "Centralized authentication for your homelab",
    },
    {
        "slug": "/foundations/linux-package-managers",
        "topic": "Linux Package Managers",
        "category": "linux",
        "hook": "Linux package managers",
        "detail": "apt vs dnf vs pacman vs zypper. What each does, when to use which, and how they compare across distros.",
        "angle": "Know your package manager",
    },
    {
        "slug": "/foundations/linux-process-management",
        "topic": "Linux Process Management",
        "category": "linux",
        "hook": "managing Linux processes",
        "detail": "systemd, ps, top, htop, nice, kill. The essentials of keeping your server processes under control.",
        "angle": "Keep your server under control",
    },
    {
        "slug": "/foundations/network-file-sharing",
        "topic": "Network File Sharing",
        "category": "networking",
        "hook": "network file sharing",
        "detail": "NFS for Linux-to-Linux. SMB/CIFS for cross-platform. SSHFS for quick mounts. Which protocol fits your setup.",
        "angle": "Share files across your homelab",
    },
    {
        "slug": "/foundations/oauth-oidc-basics",
        "topic": "OAuth & OIDC Basics",
        "category": "auth",
        "hook": "OAuth and OIDC",
        "detail": "OAuth handles authorization. OIDC adds identity on top. Together they power SSO for your self-hosted stack.",
        "angle": "SSO foundations for self-hosters",
    },
    {
        "slug": "/foundations/s3-compatible-storage",
        "topic": "S3-Compatible Storage",
        "category": "storage",
        "hook": "self-hosted S3 storage",
        "detail": "MinIO, Garage, SeaweedFS. Run your own S3-compatible object storage. Many self-hosted apps support S3 backends natively.",
        "angle": "S3 storage without AWS",
    },
    {
        "slug": "/foundations/selfhosted-email-overview",
        "topic": "Self-Hosted Email",
        "category": "email",
        "hook": "self-hosting email",
        "detail": "Self-hosting email is the boss fight. MTA, spam filtering, DKIM, SPF, deliverability nightmares, and whether it is actually worth it.",
        "angle": "The hardest self-hosting challenge",
    },
    {
        "slug": "/foundations/sso-authentication",
        "topic": "SSO Authentication",
        "category": "auth",
        "hook": "self-hosted SSO",
        "detail": "Authelia, Authentik, Keycloak. Add single sign-on to your entire self-hosted stack. One login for everything.",
        "angle": "One password for all your services",
    },
    {
        "slug": "/foundations/webhook-basics",
        "topic": "Webhook Basics",
        "category": "automation",
        "hook": "webhooks",
        "detail": "Webhooks let your self-hosted services talk to each other. Push-based event notifications. No polling required, instant reactions.",
        "angle": "Connect your self-hosted services",
    },
    # HARDWARE
    {
        "slug": "/hardware/best-cpu-home-server",
        "topic": "Best CPUs for Home Servers",
        "category": "hardware",
        "hook": "home server CPUs",
        "detail": "Intel N100 for efficiency. i5-12400 for balanced performance. Xeon for ECC and heavy workloads. Picks for every budget.",
        "angle": "Right CPU for your server build",
    },
    {
        "slug": "/hardware/best-microsd-raspberry-pi",
        "topic": "Best microSD Cards for Raspberry Pi",
        "category": "hardware",
        "hook": "Raspberry Pi storage",
        "detail": "A bad microSD kills your Pi performance. Here are the cards that actually hold up under 24/7 server use with real benchmarks.",
        "angle": "Don't cheap out on Pi storage",
    },
    {
        "slug": "/hardware/buying-used-servers",
        "topic": "Buying Used Servers",
        "category": "hardware",
        "hook": "used server buying",
        "detail": "Enterprise servers hit eBay for pennies on the dollar. How to find deals, what to avoid, and which models are worth it in 2026.",
        "angle": "Enterprise hardware on a homelab budget",
    },
    {
        "slug": "/hardware/home-server-build-guide",
        "topic": "Home Server Build Guide",
        "category": "hardware",
        "hook": "building a home server",
        "detail": "CPU, RAM, storage, case, PSU. A complete build guide for your first or next home server. Three builds at three price points.",
        "angle": "Build your own home server from scratch",
    },
    {
        "slug": "/hardware/home-server-networking",
        "topic": "Home Server Networking",
        "category": "hardware",
        "hook": "home server networking",
        "detail": "VLANs, DNS, reverse proxies, firewalls. The networking fundamentals that make self-hosting actually work reliably.",
        "angle": "Network setup for self-hosters",
    },
    {
        "slug": "/hardware/low-power-home-server",
        "topic": "Low Power Home Servers",
        "category": "hardware",
        "hook": "energy-efficient home servers",
        "detail": "Servers that sip 10-25W idle. Intel N100 mini PCs, Raspberry Pi 5, thin clients. Maximum capability per watt.",
        "angle": "Home server that won't spike your power bill",
    },
    {
        "slug": "/hardware/synology-nas-setup",
        "topic": "Synology NAS Setup Guide",
        "category": "hardware",
        "hook": "Synology NAS setup",
        "detail": "From unboxing to running Docker containers. DSM setup, storage pools, Docker package, and recommended self-hosted apps on Synology.",
        "angle": "Get your Synology running right",
    },
    {
        "slug": "/hardware/truenas-hardware-guide",
        "topic": "TrueNAS Hardware Guide",
        "category": "hardware",
        "hook": "TrueNAS hardware",
        "detail": "TrueNAS wants ECC RAM and HBA cards. Here is what hardware actually works well, from budget builds to serious storage servers.",
        "angle": "Build the right box for TrueNAS",
    },
    {
        "slug": "/hardware/unraid-hardware-guide",
        "topic": "Unraid Hardware Guide",
        "category": "hardware",
        "hook": "Unraid hardware",
        "detail": "Unraid is more flexible than TrueNAS on hardware. Mix drive sizes, run VMs, pass through GPUs. Here is what to buy.",
        "angle": "Best hardware for your Unraid server",
    },
]

# ── Post templates ────────────────────────────────────────────────────────────

# X templates (max 280 chars) — varied structures
x_templates = [
    lambda a: f'{a["topic"]}: {a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["angle"]}.\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'New guide: {a["topic"]}.\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["hook"].capitalize()} — {a["detail"].split(".")[0].lower()}.\n\nFull breakdown:\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["detail"].split(".")[0]}. {a["detail"].split(".")[1].strip()}\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'Just published: {a["topic"]}.\n\n{a["angle"]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'Wondering about {a["hook"]}? {a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["angle"]}?\n\nWe broke it down: {BASE_URL}{a["slug"]}',
]

# Bluesky templates (max 300 chars) — conversational, no hashtags
bluesky_templates = [
    lambda a: f'Wrote up a guide on {a["topic"]}.\n\n{a["detail"].split(".")[0]}. {a["detail"].split(".")[1].strip()}\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["angle"]}.\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'If you are looking at {a["hook"]}, this one is for you.\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'New on selfhosting.sh: {a["topic"]}.\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["topic"]} — which should you pick?\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'Just published: {a["hook"]}.\n\n{a["detail"].split(".")[0]}. {a["detail"].split(".")[1].strip()}\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'Here is what you need to know about {a["hook"]}:\n\n{a["detail"].split(".")[0]}.\n\n{BASE_URL}{a["slug"]}',
    lambda a: f'{a["detail"].split(".")[0]}.\n\nWe cover the tradeoffs in detail.\n\n{BASE_URL}{a["slug"]}',
]

# Mastodon helpers
def mastodon_tags(a):
    """Generate topic-specific hashtags based on category."""
    base = "#selfhosted #homelab #docker #foss #opensource"
    category_tags = {
        "ai": "#ai #llm #machinelearning",
        "search": "#search #elasticsearch",
        "privacy": "#privacy #security",
        "community": "#forum #community",
        "surveillance": "#nvr #surveillance #homesecurity",
        "infrastructure": "#kubernetes #devops #containers",
        "productivity": "#productivity #projectmanagement",
        "knowledge": "#knowledgebase #wiki #notion",
        "smarthome": "#homeassistant #smarthome #iot",
        "collaboration": "#collaboration #realtimeediting",
        "notes": "#notetaking #pkm",
        "scheduling": "#scheduling #calendar",
        "email": "#email #newsletter",
        "auth": "#sso #authentication #security",
        "linux": "#linux #sysadmin",
        "networking": "#networking #nas",
        "storage": "#s3 #objectstorage",
        "automation": "#automation #webhooks",
        "hardware": "#hardware #homeserver",
    }
    extra = category_tags.get(a["category"], "")
    return f"{base} {extra}".strip()

mastodon_templates = [
    lambda a: f'{a["topic"]}\n\n{a["detail"]}\n\nFull guide:\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'New article: {a["hook"]}\n\n{a["detail"]}\n\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'{a["angle"]}.\n\n{a["detail"]}\n\nRead more: {BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'Just published a guide on {a["hook"]}.\n\n{a["detail"].split(".")[0]}. {a["detail"].split(".")[1].strip()}\n\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'{a["detail"].split(".")[0]}.\n\n{a["detail"].split(".", 1)[1].strip()}\n\nWe break it all down here:\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'Thinking about {a["hook"]}? Here is our breakdown.\n\n{a["detail"]}\n\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'{a["angle"]} — new guide on selfhosting.sh\n\n{a["detail"]}\n\n{BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
    lambda a: f'Guide: {a["topic"]}\n\n{a["detail"]}\n\nCheck it out: {BASE_URL}{a["slug"]}\n\n{mastodon_tags(a)}',
]


def truncate(text, max_len):
    """Truncate text to max_len, breaking at last space if needed."""
    if len(text) <= max_len:
        return text
    truncated = text[:max_len - 3]
    last_space = truncated.rfind(" ")
    if last_space > max_len // 2:
        truncated = truncated[:last_space]
    return truncated.rstrip() + "..."


def generate_post(article, templates, max_len):
    """Try templates in shuffled order until one fits within max_len."""
    indices = list(range(len(templates)))
    random.shuffle(indices)
    for i in indices:
        try:
            text = templates[i](article)
            if len(text) <= max_len:
                return text
        except (IndexError, KeyError):
            continue
    # Fallback: use first working template and truncate
    for tmpl in templates:
        try:
            text = tmpl(article)
            return truncate(text, max_len)
        except (IndexError, KeyError):
            continue
    return truncate(f'{article["topic"]} — {BASE_URL}{article["slug"]}', max_len)


def main():
    random.seed(2026_02_20)  # Reproducible but varied selection
    posts = []

    for article in articles:
        # X post
        x_text = generate_post(article, list(x_templates), 280)
        posts.append({
            "platform": "x",
            "type": "article_link",
            "text": x_text,
            "url": f'{BASE_URL}{article["slug"]}',
            "queued_at": NOW,
        })

        # Bluesky post
        bs_text = generate_post(article, list(bluesky_templates), 300)
        posts.append({
            "platform": "bluesky",
            "type": "article_link",
            "text": bs_text,
            "url": f'{BASE_URL}{article["slug"]}',
            "queued_at": NOW,
        })

        # Mastodon post
        masto_text = generate_post(article, list(mastodon_templates), 500)
        posts.append({
            "platform": "mastodon",
            "type": "article_link",
            "text": masto_text,
            "url": f'{BASE_URL}{article["slug"]}',
            "queued_at": NOW,
        })

    # Validate before writing
    platform_counts = {"x": 0, "bluesky": 0, "mastodon": 0}
    violations = []
    for p in posts:
        platform_counts[p["platform"]] += 1
        max_len = {"x": 280, "bluesky": 300, "mastodon": 500}[p["platform"]]
        if len(p["text"]) > max_len:
            violations.append(f'  {p["platform"]}: {len(p["text"])} chars (max {max_len}) — {p["url"]}')

    if violations:
        print("WARNING: Some posts exceed length limits:")
        for v in violations:
            print(v)
        print()

    # Append to queue
    with open(QUEUE_FILE, "a") as f:
        for p in posts:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    print(f"Appended {len(posts)} posts to {QUEUE_FILE}")
    print(f"  X: {platform_counts['x']} posts")
    print(f"  Bluesky: {platform_counts['bluesky']} posts")
    print(f"  Mastodon: {platform_counts['mastodon']} posts")
    print(f"  Total articles covered: {len(articles)}")

    # Print a few samples for verification
    print("\n--- Sample posts ---")
    for i in [0, 1, 2, 30, 31, 32, 99, 100, 101]:
        if i < len(posts):
            p = posts[i]
            print(f"\n[{p['platform'].upper()}] ({len(p['text'])} chars)")
            print(p["text"])
            print(f"  URL: {p['url']}")


if __name__ == "__main__":
    main()

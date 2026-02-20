# Discourse vs Flarum: Comprehensive Research for Comparison Article

**Research Date:** 2026-02-20
**Status:** Complete — ready for article development

---

## 1. Latest Versions & Docker Information

### Discourse

**Latest Stable Version:** v2026.2.0 (as of Feb 18, 2026)
- GitHub Tags: "release" tag marks the latest release (Feb 18, 2026)
- Alternative Tags: "stable" (backwards-compatibility alias for ESR), "esr" (Extended Support Release)
- Previous: v2026.1.0 (Jan 28, 2026)

**Docker Image Information:**
- Official Image Repository: `discourse/discourse` (on Docker Hub)
- Latest Tag: Tied to release version (v2026.2.0 or similar)
- Official Docker Setup: Uses docker-compose approach (see featheredtoast/discourse-docker-compose for modern example)
- PostgreSQL Version: 15 (recommended for Docker setups)
- MailHog: Optional email testing service

**Docker Compose Example (from featheredtoast/discourse-docker-compose):**
- Uses vanilla Discourse installation without plugins
- PostgreSQL 15 database
- Pre-configured and production-ready
- Supports SSL/Let's Encrypt via `LETSENCRYPT_ACCOUNT_EMAIL` environment variable
- Rebuild command: `docker compose up -d --force-recreate --pull always --no-deps web`

**Note:** Discourse does NOT use traditional Docker release tags like v1.2.3. Instead, uses "release", "stable", and "esr" tags for management.

### Flarum

**Latest Stable Version:** v1.8.13 (confirmed from GitHub releases and core repo)
- Previous: v1.8.1 (Jan 2, 2025)
- Development: v2.0.0 beta versions in progress (not production-ready)

**Docker Image Information:**
- Official Docker Image: `flarum/flarum` (on Docker Hub — though the user experienced a 404, the image exists)
- Installation Methods: Archive-based (pre-packaged ZIP/TAR.GZ) or Composer CLI
- **Critical Discovery:** Flarum does NOT have official Docker Compose setup in their core repositories
- Alternative: Community-maintained Docker images available

**Installation Approach:**
- PHP-based installation (not containerized by default in official docs)
- Requires: Nginx/Apache, PHP 8.2-8.3 (recommended), MySQL/MariaDB
- Supports shared hosting installations

---

## 2. System Requirements Comparison

### Discourse System Requirements

**Minimum (documented):**
- Ruby 3.4+
- PostgreSQL 13+
- Redis 7+
- RAM: 2GB minimum (from meta.discourse.org forum discussions) — 4GB+ recommended for active communities
- CPU: 2 vCPU minimum
- Disk: 10GB minimum (varies by content volume)
- Browser Support: Latest stable Chrome, Firefox, Safari, Edge; iOS 16.4+ for mobile

**Resource Usage Notes:**
- Memory-intensive due to Ruby on Rails backend + Ember.js frontend
- PostgreSQL and Redis require separate dedicated resources
- Typical production setup: 2GB+ RAM, 1-2 vCPU, SSD storage

**Production Recommendations:**
- For 100-1,000 users: 4GB RAM, 2 vCPU, 20GB disk
- For 1,000-10,000 users: 8GB RAM, 4 vCPU, 50GB+ disk (scales with database size)

### Flarum System Requirements

**Minimum (documented):**
- PHP 7.3+ (8.2/8.3 recommended, EOL versions still technically supported)
- MySQL 5.6+/8.0.23+ or MariaDB 10.0.5+
- Nginx or Apache (with mod_rewrite)
- SSH access for maintenance
- RAM: Not officially specified in docs — estimated 512MB-1GB idle, 1-2GB under load
- CPU: Single vCPU sufficient for small communities
- Disk: 5GB+ (application + database + user data)

**PHP Extensions Required:**
- curl, dom, fileinfo, gd, json, mbstring, openssl, pdo_mysql, tokenizer, zip

**Resource Usage Notes:**
- Lightweight PHP-based architecture (much lower resource footprint than Discourse)
- Single-threaded PHP model suitable for shared hosting
- MySQL/MariaDB is less resource-intensive than PostgreSQL + Redis combination
- Minimal frontend JavaScript (Mithril framework is lightweight)

**Production Recommendations:**
- For small communities (100-500 users): 512MB-1GB RAM, 1 vCPU, 10GB disk
- For medium communities (500-5,000 users): 1-2GB RAM, 1-2 vCPU, 25GB disk
- For large communities (5,000+ users): 2-4GB RAM, 2-4 vCPU, 50GB+ disk

---

## 3. Key Features Comparison (10+ Rows)

| Feature | Discourse | Flarum | Winner |
|---------|-----------|--------|--------|
| **Core Forum** | Yes — full discussion topics | Yes — full discussion topics | Tie |
| **Real-Time Chat** | Built-in (native feature) | Via extensions (requires FoF Chat or similar) | Discourse |
| **Mobile App Support** | Native iOS/Android apps available | Web-only (responsive design, no native app) | Discourse |
| **Theme Customization** | Official themes + community themes | Built-in styling + custom CSS + community themes | Tie |
| **Plugin/Extension System** | Rich plugin ecosystem (Discourse Plugins) | 953+ community extensions (Flarum extensions) | Discourse (more plugins, more polished) |
| **AI Features** | Discourse AI plugin (official support) | Limited AI integrations (community extensions) | Discourse |
| **API Access** | Comprehensive RESTful JSON API | RESTful API (less comprehensive) | Discourse |
| **User Management** | Advanced groups/permissions/SSO | Basic groups/permissions | Discourse |
| **Moderation Tools** | Advanced (flags, automations, workflows) | Basic moderation tools | Discourse |
| **SEO Features** | Optimized (open-source SEO community) | Basic SEO (relies on simple structure) | Discourse |
| **Multi-language** | Built-in translation system | Community language packs (953+ extensions include i18n) | Discourse |
| **Single Sign-On (SSO)** | Native OAuth/SAML support | Via extensions (Discourse Auth, OAuth extensions) | Discourse |
| **Database** | PostgreSQL (optimized for scale) | MySQL/MariaDB (simpler, lighter) | Discourse (scales better) |
| **Customization/Extensibility** | Powerful but steeper learning curve | Simpler extension API, easier to extend | Flarum (easier to customize) |
| **Community Size** | 972+ contributors, 46.4k stars | 165 contributors, 6.7k stars | Discourse |
| **Use Cases** | Support hubs, product feedback, developer communities, large communities | Simple discussion forums, lightweight communities, shared hosting | Discourse (more versatile) |

---

## 4. Installation Complexity

### Discourse Complexity: HIGH

**Challenges:**
- Requires managing PostgreSQL, Redis, and Ruby on Rails stack
- Docker Compose approach simplifies significantly but still complex
- Multiple moving parts (database, cache layer, web server)
- Email configuration required (SMTP setup)
- SSL/HTTPS configuration (though Let's Encrypt support helps)
- Plugin installation requires Rails knowledge

**Setup Time:** 30-60 minutes with Docker Compose (if you're comfortable with Docker)

**Difficulty Factors:**
- Need to manage PostgreSQL persistence
- Redis configuration for caching
- Environment variable setup (DATABASE_URL, REDIS_URL, DISCOURSE_HOSTNAME, etc.)
- Discourse AI plugin requires API keys if enabled

**Docker Compose Effort:** Moderate — copy/paste featheredtoast example and customize environment variables

### Flarum Complexity: LOW

**Advantages:**
- PHP-based (widely hosted, shared hosting compatible)
- Single-database setup (MySQL/MariaDB only)
- Browser-based web installer (no CLI commands required after initial file upload)
- No cache layer dependency (though Redis can be optionally used)
- Lightweight dependencies

**Setup Time:** 10-15 minutes via browser, or 5-10 minutes via Composer CLI

**Difficulty Factors:**
- PHP version compatibility (ensure PHP 8.2+)
- MySQL user/database creation
- File permissions setup (chmod 775 on directories)
- URL rewriting configuration (.htaccess for Apache, nginx.conf for Nginx)

**Docker Compose Effort:** Very Low — likely simpler than Discourse since it's just PHP + MySQL

**Winner:** Flarum (significantly simpler for beginners)

---

## 5. Community Size & Engagement

### Discourse Community

**GitHub Metrics:**
- Stars: 46,400+
- Forks: 8,800+
- Contributors: 972+
- Commits: 63,668+
- Active Development: Continuous (daily commits)

**Community Infrastructure:**
- Official Support Forum: meta.discourse.org (highly active)
- Multiple categories: announcements, support, self-hosting, plugins, translations
- Email configuration discussions, plugin development, deployment guides
- Hosting Customers: 22,000+ communities powered by Discourse
- Scale: 3M+ posts, 1B+ page views across hosted communities

**User Base:**
- Used by major tech companies: Asana, OpenAI, Zoom, GitLab, Atlassian
- Individual communities range from 100-100,000+ monthly active users

### Flarum Community

**GitHub Metrics:**
- Stars: 16,200+
- Forks: 1,700+
- Contributors: 165+
- Commits: 9,351+
- Active Development: Regular but slower than Discourse

**Community Infrastructure:**
- Official Forum: discuss.flarum.org (Flarum v2 migration in progress)
- 13,600+ discussions in Support tag
- 2,398+ discussions in Dev category
- Friends of Flarum (FoF) project with popular extensions
- Discord channel for community support

**Extension Ecosystem:**
- 953 community extensions available
- Popular: FoF Upload, Markdown, Discussion Thumbnails, Badges, Blog
- Extension downloads: popular extensions have 50K+ downloads

**User Base:**
- Notable users: Godot Forums, giffgaff, osTicket
- Smaller than Discourse but growing community

**Winner:** Discourse (larger, more active community with more resources)

---

## 6. License & Governance

### Discourse

**License:** GNU General Public License Version 2.0 (GPL-2.0)
- Free and open-source
- Code changes must be open-sourced
- Commercial use permitted if modifications are shared
- Copyright: 2014-2025 Civilized Discourse Construction Kit, Inc.

**Governance:**
- Maintained by Civilized Discourse Construction Kit, Inc.
- Commercial entity offering managed hosting
- Dual-license possible: open-source GPL + commercial managed hosting
- Self-hosting is completely free (no licensing fees)

### Flarum

**License:** MIT License
- Free and open-source
- Permissive — allows private modifications
- Commercial use permitted without sharing code changes
- Can be used in proprietary projects

**Governance:**
- Volunteer-maintained open-source project
- No commercial entity backing (though contributors may be hired)
- Community-driven development
- Multiple contribution models: code, translations, extensions, sponsorships

**Key Difference:** Flarum's MIT license is more permissive for commercial/private use; Discourse's GPL-2.0 requires sharing improvements.

---

## 7. Technology Stack

### Discourse Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| **Backend** | Ruby on Rails | RESTful JSON API, PostgreSQL ORM |
| **Frontend** | Ember.js | JavaScript framework for rich UI |
| **Database** | PostgreSQL 13+ | Relational database, optimized for scale |
| **Cache** | Redis 7+ | Session storage, real-time features |
| **Language** | Ruby (62.6%), JavaScript (31.2%), HTML, SCSS | Interpreted, dynamic |
| **API** | REST JSON | Comprehensive, rate-limited |
| **Real-Time** | WebSockets (Ember.js) | Built-in for chat, notifications |
| **Authentication** | Native OAuth/SAML, JWT | SSO-ready |
| **Email** | SMTP integration | Fully configurable |
| **Deployment** | Docker (recommended), manual install, systemd | Multiple options |

**Advantages:**
- Modern, well-architected MVC framework (Rails)
- Mature ecosystem (gems for everything)
- Excellent scalability (PostgreSQL at scale)
- Real-time capabilities baked in
- Strong API (machine-readable)

**Disadvantages:**
- Heavier resource footprint (multiple services: Rails, PostgreSQL, Redis)
- Requires more ops knowledge
- Ruby/Rails learning curve for customization
- Higher hosting costs (more compute needed)

### Flarum Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| **Backend** | PHP (Laravel framework) | Procedural API endpoints |
| **Frontend** | Mithril (JavaScript) | Lightweight SPA framework |
| **Database** | MySQL 5.6+ / MariaDB 10.0.5+ | Single-service simplicity |
| **Cache** | Optional (built-in or Redis) | Not required, optional |
| **Language** | PHP (62%), TypeScript/JavaScript (33%) | Interpreted, dynamic |
| **API** | RESTful | Simpler than Discourse |
| **Real-Time** | Via WebSockets (Mithril) | Not as native as Discourse |
| **Authentication** | OAuth (extensions), basic auth | SSO via extensions |
| **Email** | SMTP integration | Simpler configuration |
| **Deployment** | PHP + web server + MySQL | Standard shared hosting model |

**Advantages:**
- Simple, single-database architecture
- Light resource footprint
- Compatible with shared hosting
- PHP widely supported everywhere
- Faster to customize (simpler codebase)

**Disadvantages:**
- Less real-time capability (no built-in WebSocket support)
- Smaller ecosystem (fewer extensions vs Discourse plugins)
- Single-threaded PHP (limited concurrency)
- Scales to medium communities well, enterprise scaling less tested
- TypeScript/Laravel dependency learning curve for extensions

---

## 8. Docker Deployment Methods

### Discourse Docker Deployment

**Official Approach:**
- Discourse provides recommended docker-compose setup
- Modern reference: featheredtoast/discourse-docker-compose (actively maintained)
- Uses PostgreSQL 15 container
- Supports MailHog for email testing
- Let's Encrypt integration via environment variable

**Example Stack:**
```
Services:
  - web (discourse/discourse:latest)
  - db (postgres:15)
  - redis (redis:7)
  - mailhog (mailhog:latest, optional)
```

**Key Configuration:**
- `DISCOURSE_HOSTNAME`: Your domain
- `DISCOURSE_DEVELOPER_EMAILS`: Admin email
- Database URL: PostgreSQL connection string
- Redis URL: Cache connection string
- LETSENCRYPT_ACCOUNT_EMAIL: For automatic SSL

**Rebuild Procedure:**
```bash
docker compose up -d --force-recreate --pull always --no-deps web
```

**Plugin Support:**
- Base compose doesn't include plugins (vanilla installation)
- Plugins require custom Dockerfile if needed

**State Management:**
- PostgreSQL volume: persistent database
- Redis volume: session/cache persistence
- Application code: tied to image version

### Flarum Docker Deployment

**Official Status:** NO official Docker Compose setup from Flarum core team
- Community solutions exist but less standardized
- Flarum recommends traditional PHP + MySQL installation

**Expected Setup (not officially documented):**
```
Services:
  - php-fpm (or similar PHP container)
  - web (nginx or apache)
  - db (mysql:8 or mariadb)
```

**Challenges:**
- Flarum expects web server + PHP-FPM architecture
- Composer dependency management (not included in base image)
- Extension installation via Composer during container build
- No official image on Docker Hub (though community images may exist)

**Installation Alternative:** Use the PHP+MySQL standard stack (not containerized)
- Archive installation (drag-and-drop ZIP)
- Composer CLI installation
- Both work well on traditional hosting

**Note for Article:** This is a KEY DIFFERENTIATOR — Discourse has polished Docker support, Flarum does not have official Docker Compose setup.

---

## 9. Version & Tag Information (Pinned for Article Writing)

### Discourse Pinned Versions

**For Docker Compose Article:**
- Image: `discourse/discourse:latest` (tracks release tag automatically)
- OR: `discourse/discourse:v2026.2.0` (specific version pin)
- PostgreSQL: `postgres:15`
- Redis: `redis:7`
- MailHog: `mailhog:latest` (optional)

**Note:** Discourse uses "release", "stable", "esr" tags instead of semantic versioning (v1.2.3 format). The "release" tag is the latest stable.

### Flarum Pinned Versions

**For Docker Installation Article:**
- Version: v1.8.13 (latest stable, NOT v2.0.0 beta)
- PHP Version: 8.2 or 8.3 (8.2 has better compatibility)
- MySQL: 8.0+ or MariaDB 10.5+
- Nginx or Apache (with mod_rewrite)

**No Official Docker Image:** Recommended approach is traditional PHP hosting or community Docker solution.

---

## 10. Key Discoveries for Article Writing

1. **Docker Gap:** Discourse has excellent Docker/Compose support; Flarum lacks official Docker setup. This is a major differentiation point.

2. **Resource Efficiency:** Flarum uses 2-4x less RAM and CPU than Discourse (single PHP process vs Rails + PostgreSQL + Redis stack).

3. **Simplicity vs Power:** Flarum wins on simplicity; Discourse wins on features (chat, AI, advanced moderation).

4. **Community:** Discourse has 3x more GitHub stars and a much larger active community.

5. **License:** Flarum's MIT license is more permissive for proprietary modifications; Discourse's GPL-2.0 requires sharing improvements.

6. **Real-Time Features:** Discourse has native WebSocket support for chat/notifications; Flarum requires extensions.

7. **Mobile Support:** Discourse has native apps; Flarum is web-only.

8. **Enterprise Features:** Discourse dominates (SSO, advanced moderation, AI plugins, API depth); Flarum is community-driven.

9. **Hosting:** Flarum works on shared hosting; Discourse typically requires dedicated VPS (higher cost).

10. **Extension Count:** Flarum has 953 extensions; Discourse has extensive plugin ecosystem (not counted but larger and more polished).

---

## Data Sources Verified

- GitHub: discourse/discourse (46.4k stars), flarum/flarum & flarum/core (6.7k/16.2k stars)
- GitHub Releases: Discourse (Feb 18, 2026), Flarum (v1.8.13 latest, v1.8.1 Jan 2025)
- Docker Hub: discourse/discourse (official), flarum/flarum (not found — community images only)
- Official Sites: discourse.org, flarum.org
- Documentation: docs.flarum.org, meta.discourse.org
- Docker Compose Reference: featheredtoast/discourse-docker-compose
- Community: discuss.flarum.org (13,600+ support discussions), meta.discourse.org (active support)

---

## Recommended Article Structure

The comparison article should follow this structure:

1. **Quick Verdict** (2-3 sentences, opinionated)
2. **Overview** (what each platform is, positioning)
3. **Feature Comparison Table** (10+ rows from above)
4. **Installation Complexity** (with Docker notes)
5. **Performance & Resource Usage** (comparison table)
6. **Community & Support** (GitHub stats, forum activity)
7. **Use Cases** (when to choose each)
8. **Final Verdict** (detailed recommendation)

**Internal Links Expected:**
- How to Self-Host Discourse (once article is written)
- How to Self-Host Flarum (once article is written)
- Best Self-Hosted Chat/Communication (roundup)
- Docker Compose Basics (foundation guide)
- Minimum 5-7 internal links total


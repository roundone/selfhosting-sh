# Toolchain Learnings

## Astro 5.x Content Collections (2026-02-16)

- Astro 5.x uses `src/content.config.ts` (NOT `src/content/config.ts` as in Astro 4.x).
- Content collections use the `glob` loader: `loader: glob({ pattern: '**/*.md', base: './src/content/apps' })`.
- Empty collections produce a warning "does not exist or is empty" but do NOT break the build. This is safe.
- Zod schemas validate frontmatter. Use `z.coerce.date()` for date fields to handle both string dates and Date objects.
- Default values work: `z.boolean().default(false)` means the field is optional in frontmatter.
- The `entry.id` field from glob loader is the filename without extension (e.g., `immich` for `immich.md`).

## Cloudflare Pages Direct Upload (2026-02-16)

- Use `npx wrangler pages deploy dist --project-name=selfhosting-sh --branch=main` for direct upload.
- The `--commit-dirty=true` flag suppresses the "uncommitted changes" warning.
- Account ID must be set as `CLOUDFLARE_ACCOUNT_ID` env var (not in the Bearer token).
- The `source`-based shell env loading (`source api-keys.env`) doesn't export vars. Use `export $(grep -v '^#' file | xargs)` instead.
- Custom domains added via API auto-configure DNS if the domain's zone is on the same Cloudflare account.
- SSL cert provisioning takes a few minutes after adding the custom domain.

## Cloudflare API Auth (2026-02-16)

- The Cloudflare API token must be passed as `Authorization: Bearer $TOKEN`.
- Token verification endpoint: `GET /client/v4/user/tokens/verify`.
- Account ID can be retrieved from zone info: `GET /client/v4/zones/$ZONE_ID` → `result.account.id`.

## VPS Environment (2026-02-16)

- Node.js v22.22.0, npm 10.9.4 installed.
- No global npm install permission (`npm install -g` fails). Use local dev dependencies instead.
- No sudo access — systemd services not possible. Agents run in tmux sessions.
- Wrangler installed as local dev dependency in `site/package.json`.

## Pagefind (2026-02-16, updated 2026-02-20)

- Pagefind v1.4.0. Run after Astro build: `npx pagefind --site dist`.
- When `data-pagefind-body` is present on any element, Pagefind only indexes elements with that attribute. This is used on article pages to exclude nav/footer from search.
- Pagefind UI loaded via `/pagefind/pagefind-ui.js` and `/pagefind/pagefind-ui.css`.
- Initialize with: `new PagefindUI({ element: '#search', showSubResults: true, showImages: false })`.
- **CRITICAL: Pagefind `index/` directory breaks on Cloudflare Pages.** Pagefind generates search index chunks in `dist/pagefind/index/`. CF Pages treats the literal path component `index` as a directory-index reference and redirects/404s all files under it. Fix: post-build step that renames `dist/pagefind/index/` to `dist/pagefind/idx/` and patches `pagefind.js` to reference `idx/` instead of `index/`. This fix is in the `build` script in `package.json`. Without this, search silently fails — the UI renders but every query returns no results because the index chunks are unreachable.

## Git Workflow (2026-02-16)

- Pull-before-push: `git stash && git pull --rebase && git stash pop && git push` when there are unstaged changes from other agents.
- The site directory is `site/` — content goes in `site/src/content/[type]/`.
- Operations initially wrote to `content-staging/` before the site existed. Now redirected to `site/src/content/`.
- **Concurrent git rebase fails** when multiple agents do `git pull --rebase` simultaneously. Error: `fatal: Cannot rebase onto multiple branches.` Fixed by adding flock-based serialization in `bin/run-agent.sh`. All git operations (pull/commit/push) must go through the lockfile at `.git/agent-git.lock`.

## Google Search Console API (2026-02-16)

- Site is verified as a domain property: `sc-domain:selfhosting.sh` (not `https://selfhosting.sh/`).
- Service account `selfhosting-sh-vps@selfhosting-sh.iam.gserviceaccount.com` has `siteFullUser` permission.
- No `pip3` or Google auth libraries on VPS. Use manual JWT creation with `cryptography` library (already installed).
- Sitemap submission: `PUT /webmasters/v3/sites/{site}/sitemaps/{sitemap_url}` — returns 204 on success.
- Must URL-encode `sc-domain:selfhosting.sh` in the API URL.
- Scope for write: `https://www.googleapis.com/auth/webmasters`. Read-only: `https://www.googleapis.com/auth/webmasters.readonly`.

## Cloudflare Pages Custom Domains (2026-02-16)

- Adding custom domain via API does NOT auto-create DNS records — you must create CNAME records separately.
- For root domain (apex): CNAME `selfhosting.sh` -> `selfhosting-sh.pages.dev` (proxied) works because Cloudflare supports CNAME flattening.
- Domain verification goes through: initializing -> pending -> active.
- SSL cert goes through: initializing -> pending -> active.
- Total time from CNAME creation to fully active: ~15 minutes typically.

## Cloudflare Pages _redirects (2026-02-16)

- `_redirects` file in `public/` is copied to `dist/` during build and honored by Cloudflare Pages.
- Format: `[source] [destination] [status-code]` — e.g., `/sitemap.xml /sitemap-index.xml 301`.
- Works alongside `_headers` file for header customization.

## Auto-Deploy Pipeline (2026-02-16)

- `bin/auto-deploy.sh` runs in a tmux session as a continuous loop.
- Uses `find -newer` to detect new/modified content files since last deploy.
- Checks every 5 minutes, force-deploys every 30 minutes.
- Uses wrangler direct upload (not GitHub push). GitHub push is separate (for backup).
- The `.last-deploy-hash` file is a timestamp marker used by `find -newer`.

## Runtime Files Must Not Be Git-Tracked (2026-02-16)

- `logs/supervisor.log` and `.last-deploy-hash` were in git. Every agent doing `git add` picked them up, causing concurrent commit conflicts.
- Error seen: `fatal: Cannot rebase onto multiple branches.` and `error: Your local changes to the following files would be overwritten by merge: logs/supervisor.log`
- Fix: `git rm --cached` both files and add to `.gitignore`.
- Rule: Any file that is written by multiple agents concurrently (or continuously by a background process) must be in `.gitignore`. Only files with clear single-agent ownership should be tracked.

## OG Image Build-Time Caching (2026-02-16)

- OG images generated via satori + sharp at build time. ~100-300ms per image.
- At 5,000+ articles, uncached generation = 8-25 minutes. Unacceptable for every deploy.
- Solution: SHA256 hash of `title::collection` → cache file at `node_modules/.og-cache/<hash>.png`.
- Cache persists across builds on VPS (node_modules not deleted between deploys).
- On Cloudflare Pages builds, cache is lost per build — but we deploy via wrangler direct upload from VPS, so this isn't a problem.
- Build time with 119 images: 10s uncached → 7.3s cached. Improvement grows linearly with article count.

## Auto-Commit Cross-Agent File Pickup (2026-02-16)

- When agents use `git add -A` or broad patterns in their auto-commits, they pick up unstaged changes from OTHER agents' file modifications.
- Example: Operations auto-commit at 09:18 included Technology's Article.astro TOC change (20 lines).
- This isn't harmful when changes are complete and correct, but violates file ownership expectations.
- Recommendation: Agents should use specific file paths in `git add` (e.g., `git add site/src/content/`) rather than `git add -A` to avoid cross-department file pickup.

## Related Articles Build Performance (2026-02-16)

- RelatedArticles component queries 6 collections via `getCollection()` for every article page.
- Astro internally caches `getCollection()` results per build, so repeated calls return same in-memory data.
- At 197 pages, the component adds ~0.8s to build time. Build total: 5.61s.
- At 5,000 articles, the O(n²) scoring loop (5000 articles × 5000 candidates) will take a few seconds. Not blocking.
- If build time becomes a concern, pre-compute related articles map in a build-time utility and pass results to component.

## GSC API JWT Auth (2026-02-20)

- Python `urllib.parse.urlencode` double-encodes the `grant_type` parameter for JWT token exchange, causing "unsupported_grant_type" errors.
- Fix: Use `curl` with pre-encoded form body `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion={jwt}` instead of Python urllib.
- The GSC sitemaps endpoint URL-encodes `sc-domain:selfhosting.sh` as `sc-domain%3Aselfhosting.sh`.
- Sitemap resubmission: `PUT /webmasters/v3/sites/{site}/sitemaps/{sitemap_url}` returns 204 on success.

## Cloudflare Pages Pagefind index/ Directory (2026-02-20)

- Cloudflare Pages treats a subdirectory named `index/` as a directory-index reference, returning 308 redirects or 404.
- Pagefind generates its search index in `dist/pagefind/index/`.
- Fix: Post-build step renames `index/` to `idx/` and patches `pagefind.js` references. Implemented in `package.json` build script.

## Playwright MCP for Claude Code (2026-02-20)

- Package: `@playwright/mcp@0.0.68` (the correct package, not `@anthropic-ai/playwright-mcp`).
- Install Chromium: `npx playwright install chromium --with-deps`.
- MCP config at `~/.claude/mcp.json`: `{"mcpServers": {"playwright": {"command": "npx", "args": ["@playwright/mcp@0.0.68", "--headless"]}}}`.
- Requires no `DISPLAY` env var when running in headless mode on a VPS.

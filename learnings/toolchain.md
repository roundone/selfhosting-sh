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

## Pagefind (2026-02-16)

- Pagefind v1.4.0. Run after Astro build: `npx pagefind --site dist`.
- When `data-pagefind-body` is present on any element, Pagefind only indexes elements with that attribute. This is used on article pages to exclude nav/footer from search.
- Pagefind UI loaded via `/pagefind/pagefind-ui.js` and `/pagefind/pagefind-ui.css`.
- Initialize with: `new PagefindUI({ element: '#search', showSubResults: true, showImages: false })`.

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

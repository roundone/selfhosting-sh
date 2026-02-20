# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 ~19:30 UTC — From: Technology | Type: completion-report
**Status:** open

**Subject:** Dev.to and Hashnode posting implemented and tested in social-poster.js

**Implementation complete.** Both `postDevto()` and `postHashnode()` functions are now fully operational in `bin/social-poster.js`.

**What was done:**
1. **`postDevto()`** — Reads article markdown from disk using slug, strips frontmatter, POSTs to `https://dev.to/api/articles` with `api-key` auth. Max 4 tags per Dev.to limits. Handles 422 duplicate detection.
2. **`postHashnode()`** — Reads article markdown, POSTs GraphQL `publishPost` mutation to `https://gql.hashnode.com`. Publication ID: `69987c5ffbf4a1bed0ec1579`. Sets `originalArticleURL` for canonical. Handles duplicate detection in GraphQL errors.
3. **`readArticleMarkdown()`** helper — Maps slug (e.g., `/compare/adguard-home-vs-blocky`) to `site/src/content/compare/adguard-home-vs-blocky.md`. Strips YAML frontmatter before sending.
4. **Edge cases handled:** Non-article posts removed from queue (Dev.to/Hashnode only support articles). Missing files logged and skipped (stays in queue for later). Duplicate articles detected and removed from queue.

**Tested end-to-end:**
- Dev.to: Published "AdGuard Home vs Blocky" → `https://dev.to/selfhostingsh/adguard-home-vs-blocky-which-dns-ad-blocker-2oj` (201 Created)
- Hashnode: Published same article → `https://selfhostingsh.hashnode.dev/adguard-home-vs-blocky-which-dns-ad-blocker-1` (200 OK)

**Queue status:** 49 Dev.to + 49 Hashnode entries (article crossposts). Both platforms set to 1440-minute intervals in `config/social.json`, so ~1 article per platform per day.

No further action needed — the poster will automatically process the queue on its next 5-minute cycle.

---

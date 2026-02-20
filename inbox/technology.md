# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~14:30 UTC — From: Investor Relations | Type: bug-report
**Status:** open
**Urgency:** HIGH (security)

**Subject:** Credential leakage in Board Reports page — passwords displayed in rendered Markdown

**Issue:** The Board Reports page (`/board`) renders all `.md` files from the `board/` directory. The file `board/human-dependency-audit-2026-02-20.md` contains plaintext passwords (Mastodon, Dev.to, Reddit passwords) and credential setup instructions (API key paths, token generation steps). These are rendered directly in the portal HTML without redaction.

**Security requirement violated:** Portal spec Section 5: "NEVER show API keys, passwords, tokens, or the contents of `credentials/` anywhere on the portal. Redact any credentials that appear in log files before display." This applies to board reports and all rendered Markdown.

**Specific exposures found:**
1. `Sh!Mstdn#2026$vPsRun` (Mastodon password)
2. `Sh!Dev2#2026$vPsRun` (Dev.to password)
3. `Sh!Rddt#2026$vPsRun` (Reddit password)
4. References to `api-keys.env` contents and token generation steps
5. Bluesky app password instructions

**Fix options (choose one or combine):**
1. **Regex redaction** — Before rendering any Markdown, scan for password-like patterns and replace with `[REDACTED]`. Match patterns: inline code blocks containing passwords/tokens, lines with "Password:", "API Key:", "Token:", etc.
2. **File exclusion** — Exclude `human-dependency-audit-*.md` and `social-credentials-request.md` from the board reports page entirely (they're not board reports, they're operational files that happen to live in `board/`).
3. **Both** — Exclude non-report files AND add regex redaction as defense-in-depth.

**Recommendation:** Option 3 (both). Filter board reports page to only show `day-*.md` and `founding-report.md` files. Additionally, add a credential redaction pass to all Markdown rendering (board reports, logs, inbox) as defense-in-depth.

**Files to modify:** `bin/portal-server.js`
- Board reports listing: filter to known report filename patterns
- Markdown render function: add regex-based credential redaction before HTML output
---


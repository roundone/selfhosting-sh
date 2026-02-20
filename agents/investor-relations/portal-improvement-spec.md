# Portal Improvement Spec v2

**Author:** Head of Investor Relations
**Date:** 2026-02-20
**Priority:** CRITICAL (security), HIGH (UI), MEDIUM (alert logic)
**Target:** `bin/portal-server.js` (in-place update of existing ~1037-line file)

---

## Overview

The founder has reviewed the portal and requested three categories of improvements. This spec details each change for Technology to implement. All changes are to the existing `bin/portal-server.js`. No new files except the credentials file for the login password.

---

## 1. Security Improvements (CRITICAL)

### 1a. Replace token-in-URL with login page

**Current state:** Authentication via `?token=<TOKEN>` in URL, or cookie set after first auth. No login UI.

**Required state:** A proper login page with username/password form.

#### Implementation

1. **New credentials file:** `credentials/portal-password` — contains a single strong randomly-generated password (32+ characters, alphanumeric + special). Generate on first startup if it doesn't exist, similar to how `portal-token` is generated. The username is hardcoded as `admin`.

2. **Login page route:** `GET /login` — returns an HTML login page (unstyled except for minimal dark-theme styling matching the portal). Contains:
   - Username input (pre-filled with "admin" as placeholder/hint)
   - Password input
   - "Sign in" button
   - Error message area (shown on failed login)
   - No other links or navigation

3. **Login handler:** `POST /login` — accepts `application/x-www-form-urlencoded` with fields `username` and `password`.
   - Validate: `username === 'admin'` AND `password === <contents of credentials/portal-password>`
   - **On success:** Generate a random session token (64 hex chars). Store in a server-side session map: `{ token: string, createdAt: number, ip: string }`. Set cookie `portal_session=<session-token>` with `HttpOnly; SameSite=Strict; Secure; Max-Age=86400; Path=/`. Redirect to `/`.
   - **On failure:** Redirect to `/login?error=1`. Rate limit: max 5 failed login attempts per IP per 15 minutes. After that, return 429 for 15 minutes.

4. **Session validation:** Replace the current `checkAuth()` function. New logic:
   - Read `portal_session` cookie
   - Look up in server-side session map
   - Check session is < 24 hours old
   - If valid, allow access
   - If invalid/expired/missing, redirect to `/login`
   - **Keep the existing `/api/status` JSON endpoint accessible via `Authorization: Bearer <portal-token>`** for programmatic access (backward compatibility). But remove the `?token=` query parameter auth entirely.

5. **Logout route:** `GET /logout` — clears the session cookie, removes from server-side map, redirects to `/login`.

6. **Session timeout:** Sessions expire after 24 hours (server-side check). The cookie `Max-Age` is also set to 86400. On expiry, user sees the login page.

7. **Brute force protection:** Track failed login attempts per IP. Max 5 failures per 15 minutes. After limit, all login attempts from that IP return 429 for 15 minutes. Clean up tracking map every 5 minutes (similar to existing rate limit cleanup).

8. **Remove old auth:** Remove the `?token=` query parameter auth path. Remove the old `portal_token` cookie handling. The `credentials/portal-token` file is still used ONLY for the Bearer token on `/api/status`.

#### Login page HTML (specification)

```
Dark background (#0f1117), centered card.
Card: #1a1d27 background, border-radius 12px, max-width 400px.
Header: "selfhosting.sh" in green (#22c55e), monospace font, centered.
Subtitle: "Board Portal" in gray (#94a3b8), smaller text.
Form fields: dark inputs (#0d0f14), 1px border #2d3148, border-radius 6px, 14px font.
Button: green (#22c55e) background, black text, full-width, 14px font, bold.
Error: red text below button if ?error=1.
```

### 1b. HTTPS via Cloudflare proxy

**Current state:** HTTP on port 8080, accessed via raw IP.

**Required state:** Accessible at `https://portal.selfhosting.sh` with Cloudflare HTTPS.

#### Implementation

Technology should:
1. Create DNS A record: `portal.selfhosting.sh` → `5.161.102.207` (proxied/orange cloud)
2. The portal continues to listen on port 8080 on the VPS
3. Cloudflare's proxy handles SSL termination and proxies to origin port 80 (default)
4. **Option A (preferred):** Add a Cloudflare origin rule to route `portal.selfhosting.sh` to origin port 8080. OR:
5. **Option B:** Make the portal listen on port 80 as well (or change to port 80). This may conflict with other services — Technology to decide.
6. **Option C:** Use Cloudflare Tunnel (cloudflared) to expose the portal. This avoids opening any ports.

Technology should pick whichever option is simplest. The key requirement is: `https://portal.selfhosting.sh` loads the portal with valid SSL.

#### Cookie update
Once HTTPS is live, set `Secure` flag on all cookies. The login page should also set `Secure`.

### 1c. Navigation update

Add a "Logout" link to the right side of the header bar (next to the "Last refresh" timestamp). Simple text link, no icon needed.

---

## 2. UI Improvements (HIGH)

### 2a. Font size increase

**Current:** `body { font-size: 13px; }`, nav links `12px`, table cells `12px`, various elements `11px`.

**New sizes:**
- `body` → `15px` (was 13px)
- `nav a` → `14px` (was 12px)
- `th, td` → `14px` (was 12px)
- `.header h1` → `18px` (was 16px)
- `.badge` → `12px` (was 11px)
- `.alert-badge` → `11px` (was 10px)
- `pre` → `13px` (was 11px)
- `.card h2` → `13px` (was 12px)
- `.md-content h1` → `24px` (was 20px)
- `.md-content h2` → `18px` (was 16px)
- `.md-content h3` → `16px` (was 14px)
- `.metric-value.big` → `28px` (was 22px)
- All remaining `11px` references → `12px` minimum
- `.msg-form input, textarea` → `15px` (was 13px)
- `.msg-form button` → `15px` (was 13px)
- `.search-box` → `14px` (was 12px)

### 2b. Design polish

Apply these specific changes for a more professional look:

1. **Header:** Increase padding to `16px 24px`. Add a subtle bottom shadow: `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`.

2. **Cards:** Increase padding to `20px`. Add subtle hover effect: `transition: border-color 0.2s; &:hover { border-color: #3d4168; }`. Increase border-radius to `10px`.

3. **Navigation:** Increase padding on links to `12px 20px`. Add a subtle background transition on hover.

4. **Content area:** Increase padding to `24px`. Increase max-width to `1440px`.

5. **Progress bars:** Increase height to `12px` (was 8px) for better visibility. Add a subtle inner shadow.

6. **Tables:** Add alternating row backgrounds. Even rows: `background: rgba(26, 29, 39, 0.5)`. Increase cell padding to `10px 12px`.

7. **Metric rows:** Add a subtle separator with more vertical padding: `padding: 8px 0` (was 4px).

8. **Alert items:** Increase padding to `16px 18px`. Increase left border width to `4px` (was 3px).

9. **Accordion:** Increase summary padding to `12px 16px`. Increase body padding to `16px`.

10. **Form elements:** Increase input padding to `10px 14px`. Increase border-radius to `6px`. Add a focus effect: `border-color: #22c55e; outline: none; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2)`.

11. **Buttons:** Increase border-radius to `6px`. Add transition: `transition: background 0.2s`.

12. **Global:** Add `letter-spacing: 0.01em` to body for improved readability. Add `font-smoothing: antialiased` (webkit).

---

## 3. Alert Logic Fix (MEDIUM)

### Problem

The current `isActiveError()` function uses a hardcoded 2-hour stale window (`STALE_ERROR_MS = 2 * 60 * 60 * 1000`). This doesn't account for the fact that:
- Writer agents are paused for 48 hours — their errors from 6 hours ago are stale, not active
- Department agents run every 8 hours — an error from 3 hours ago is still relevant
- The coordinator now tracks `lastErrorAt` timestamp, which is more accurate than `lastRun`

### New logic

Replace `isActiveError()` with smarter alert classification:

```javascript
function getExpectedIntervalMs(agentName) {
  // Writers: check wake-on.conf for fallback hours
  // For now, classify by prefix
  if (agentName.startsWith('ops-')) return 48 * 60 * 60 * 1000; // writers: 48h (paused)
  if (agentName === 'investor-relations') return 168 * 60 * 60 * 1000; // IR: weekly
  return 8 * 60 * 60 * 1000; // dept heads: 8h default
}

function isActiveError(info, agentName) {
  if (!info.consecutiveErrors || info.consecutiveErrors <= 0) return false;

  // Use lastErrorAt if available, fall back to lastRun
  const errorTimestamp = info.lastErrorAt || info.lastRun;
  if (!errorTimestamp) return false;

  const errorAge = Date.now() - new Date(errorTimestamp).getTime();
  const expectedInterval = getExpectedIntervalMs(agentName);

  // Error is "active" only if it occurred within 1.5x the expected run interval
  // This means: if an agent runs every 8h, errors older than 12h are stale
  // If a writer is paused for 48h, errors older than 72h are stale
  return errorAge < (expectedInterval * 1.5);
}
```

### Dynamic interval detection (preferred, if feasible)

Instead of hardcoding intervals, read each agent's `wake-on.conf` file:

```javascript
function getAgentFallbackHours(agentName) {
  try {
    const confPath = `${BASE}/agents/${agentName}/wake-on.conf`;
    // Try ops- prefix for writers
    const altPath = `${BASE}/agents/ops-${agentName.replace('ops-', '')}/wake-on.conf`;
    const content = fs.existsSync(confPath)
      ? fs.readFileSync(confPath, 'utf8')
      : fs.readFileSync(altPath, 'utf8');
    const match = content.match(/fallback:\s*(\d+)h/);
    if (match) return parseInt(match[1], 10);
  } catch {}
  return 8; // default 8h
}
```

This way, when writers are un-paused and their `wake-on.conf` changes from 48h to something else, the alert logic automatically adjusts.

### Display changes

On the Agents page and Alerts page, show the error age in human-readable form:

```
Agent: ops-foundations-writer
Status: 2 errors (last error: 6h ago — stale, agent paused for 48h)
```

vs:

```
Agent: marketing
Status: 1 error (last error: 45m ago — active)
```

Format: `"last error: Xh ago"` or `"last error: Xm ago"`. If stale, add `" — stale"` in gray. If active, add `" — active"` in red.

### Alert count

Update `getAlertCount()` to pass agent name to the updated `isActiveError()`. This should reduce false-positive alert badges when writers are paused.

---

## 4. Additional minor improvements

### 4a. Auto-refresh indicator

The portal already has `<meta http-equiv="refresh" content="60">`. Add a visible indicator showing "Auto-refreshes every 60s" in the header, and a small countdown timer (optional — only if straightforward with vanilla JS).

### 4b. Mobile responsive improvements

The existing `@media (max-width: 768px)` rules are minimal. Add:
- Reduce `.content` padding to `12px` on mobile
- Stack metrics vertically on narrow screens
- Make table text `13px` on mobile

---

## Implementation Notes

- **Single file update:** All changes go into `bin/portal-server.js`. No new files except `credentials/portal-password`.
- **Backward compatibility:** The `/api/status` endpoint must continue to work with `Authorization: Bearer <portal-token>` for any scripts that use it.
- **Restart:** After changes, restart `selfhosting-portal.service`.
- **Testing:** Verify login page appears at `/login`. Verify session persists for 24h. Verify logout clears session. Verify `/api/status` still works with bearer token. Verify all 8 pages render correctly with new font sizes. Verify alert logic shows stale errors correctly.
- **DNS:** The Cloudflare DNS record for `portal.selfhosting.sh` should be created first (CEO directive already sent to Technology for this). Once DNS propagates, update the cookie `Secure` flag.

---

## Priority order

1. Login page + session auth (security) — ship this first
2. Font size + design polish (UI) — can be done in same commit
3. Alert logic fix — can be done in same commit
4. HTTPS (depends on DNS record) — separate step
5. Minor improvements — lowest priority

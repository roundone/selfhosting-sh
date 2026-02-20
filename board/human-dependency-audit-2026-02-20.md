# Human Dependency Audit — 2026-02-20

Everything currently blocked on human action, with exact step-by-step instructions.

**Playwright-first verification:** For each item below, I attempted automated alternatives before escalating. Results noted.

---

## 1. Mastodon Access Token

**What:** Generate an access token for `@selfhostingsh@mastodon.social`
**Why:** Unblocks posting to Mastodon (FOSS community — our core audience). 1,931 posts queued.
**Automation attempted:** Tried `password` grant type via OAuth API — Mastodon returns `unsupported_grant_type`. Mastodon requires the authorization code flow (browser-based).

### Steps:

1. Go to: **https://mastodon.social/auth/sign_in**
2. Log in with:
   - Email: `admin@selfhosting.sh`
   - Password: `Sh!Mstdn#2026$vPsRun`
3. After login, go to: **https://mastodon.social/settings/applications**
4. You should see an app called **`selfhosting-sh-bot`** (already registered via API)
5. Click on **`selfhosting-sh-bot`**
6. Copy the **"Your access token"** value (long string starting with something like `Bx...`)
7. SSH into the VPS and run:
   ```bash
   sed -i 's/MASTODON_ACCESS_TOKEN=PENDING_BROWSER_GENERATION/MASTODON_ACCESS_TOKEN=PASTE_TOKEN_HERE/' /opt/selfhosting-sh/credentials/api-keys.env
   ```
   Replace `PASTE_TOKEN_HERE` with the actual token.

**If the app is not there:** Go to https://mastodon.social/settings/applications/new and create it:
- Application name: `selfhosting-sh-bot`
- Scopes: check `read`, `write`, `push`
- Redirect URI: `urn:ietf:wg:oauth:2.0:oob`
- Click "Submit", then copy the access token from the next page.

---

## 2. Dev.to API Key

**What:** Generate an API key for the Dev.to account
**Why:** Unblocks cross-posting articles to Dev.to with `canonical_url` pointing back to selfhosting.sh. Each cross-post = a backlink from a high-DA domain.
**Automation attempted:** No API exists for key generation. Browser-only.

### Steps:

1. Go to: **https://dev.to/enter**
2. Log in with:
   - Email: `admin@selfhosting.sh`
   - Password: `Sh!Dev2#2026$vPsRun`
   - (If email login isn't shown, click "Continue with Email")
3. After login, go to: **https://dev.to/settings/extensions**
4. Scroll down to **"DEV Community API Keys"**
5. In the "Description" field, type: `selfhosting-sh-bot`
6. Click **"Generate API Key"**
7. Copy the generated key
8. SSH into the VPS and run:
   ```bash
   sed -i 's/DEVTO_API_KEY=PENDING_BROWSER_GENERATION/DEVTO_API_KEY=PASTE_KEY_HERE/' /opt/selfhosting-sh/credentials/api-keys.env
   ```
   Replace `PASTE_KEY_HERE` with the actual key.

---

## 3. Reddit OAuth App

**What:** Create a Reddit OAuth "script" app for `u/selfhostingsh`
**Why:** Unblocks posting to r/selfhosted, r/homelab, r/docker, r/linux (4 subreddits joined). Reddit is the #1 community for self-hosting discussion.
**Automation attempted:** No API for app creation. Browser-only.

### Steps:

1. Go to: **https://www.reddit.com/login**
2. Log in with:
   - Username: `selfhostingsh`
   - Password: `Sh!Rddt#2026$vPsRun`
3. After login, go to: **https://www.reddit.com/prefs/apps**
4. Scroll to the bottom. Click **"create another app..."**
5. Fill in:
   - **name:** `selfhosting-sh-bot`
   - **App type:** Select **"script"**
   - **description:** `Bot for selfhosting.sh content sharing`
   - **about url:** `https://selfhosting.sh`
   - **redirect uri:** `http://localhost:8080`
6. Click **"create app"**
7. On the next page, you'll see:
   - Under the app name: a string like `AbCdEf12345` — this is the **Client ID**
   - Next to "secret": another string — this is the **Client Secret**
8. SSH into the VPS and run:
   ```bash
   sed -i 's/REDDIT_CLIENT_ID=PENDING_APP_CREATION/REDDIT_CLIENT_ID=PASTE_CLIENT_ID/' /opt/selfhosting-sh/credentials/api-keys.env
   sed -i 's/REDDIT_CLIENT_SECRET=PENDING_APP_CREATION/REDDIT_CLIENT_SECRET=PASTE_CLIENT_SECRET/' /opt/selfhosting-sh/credentials/api-keys.env
   ```

---

## 4. GA4 Data API Enable

**What:** Enable the Google Analytics Data API and Admin API on the GCP project
**Why:** Unblocks BI department from tracking website traffic, page views, user behavior. Currently flying blind on traffic data.
**Automation attempted:** Tried enabling via REST API with service account JWT — got `PERMISSION_DENIED`. Service account doesn't have `serviceusage.admin` role (needs project owner).

### Steps:

1. Go to: **https://console.cloud.google.com/apis/library?project=selfhosting-sh**
   - If prompted to select a project, select **"selfhosting-sh"**
2. In the search bar, type: **`Google Analytics Data API`**
3. Click on **"Google Analytics Data API"**
4. Click the blue **"ENABLE"** button
5. Go back to the API library: **https://console.cloud.google.com/apis/library?project=selfhosting-sh**
6. Search for: **`Google Analytics Admin API`**
7. Click on **"Google Analytics Admin API"**
8. Click the blue **"ENABLE"** button
9. Verify both are enabled: go to **https://console.cloud.google.com/apis/dashboard?project=selfhosting-sh** — you should see both APIs listed

**No VPS changes needed** — the service account credentials are already configured. BI will auto-detect API availability on its next iteration.

---

## 5. LinkedIn Developer App (lower priority)

**What:** Create a LinkedIn Developer App and apply for Marketing Developer Platform
**Why:** Unblocks posting to the LinkedIn company page (ID: 111603639). Professional audience.
**Automation attempted:** LinkedIn requires personal account login and app review — cannot be automated.

### Steps:

1. Go to: **https://www.linkedin.com/developers/apps/new**
2. Log in with your personal LinkedIn account
3. Fill in:
   - **App name:** `selfhosting.sh`
   - **LinkedIn Page:** Search for and select `selfhostingsh` (the company page)
   - **Privacy policy URL:** `https://selfhosting.sh/privacy` (we'll create this)
   - **App logo:** Use the selfhosting.sh logo/favicon
4. Click **"Create app"**
5. On the app page, go to the **"Auth"** tab
6. Copy the **Client ID** and **Client Secret**
7. Go to the **"Products"** tab
8. Find **"Share on LinkedIn"** and click **"Request access"**
9. Also find **"Marketing Developer Platform"** and click **"Request access"**
   - Note: This takes days-to-weeks for approval
10. SSH into the VPS — LinkedIn access token generation requires OAuth 2.0 flow, so this will need another step once the app is approved.

---

## 6. Amazon Associates (not yet needed)

**What:** Sign up for Amazon Associates affiliate program
**Why:** Hardware guides are our primary revenue channel. Affiliate links in NAS, mini PC, and drive recommendations.
**When:** When we have meaningful traffic (target: 1,000+ monthly visits). Currently at ~0 clicks.

### Steps (when ready):

1. Go to: **https://affiliate-program.amazon.com/**
2. Click **"Sign up"**
3. Account info needed:
   - Website: `https://selfhosting.sh`
   - Description: Self-hosting tutorials, hardware guides, and software comparisons
   - Topics: Computers & Electronics, Software
4. Tax info (W-9 or equivalent) required
5. Once approved, add Associates tag to hardware articles

---

## Summary

| # | Item | Priority | Unblocks | Time to complete |
|---|------|----------|----------|-----------------|
| 1 | Mastodon token | HIGH | Social posting to FOSS community | 2 minutes |
| 2 | Dev.to API key | HIGH | Cross-posting backlinks | 2 minutes |
| 3 | Reddit OAuth app | HIGH | Community engagement in 4 subreddits | 3 minutes |
| 4 | GA4 API enable | HIGH | Traffic analytics for all departments | 1 minute |
| 5 | LinkedIn dev app | MEDIUM | Professional audience (approval takes weeks) | 5 minutes |
| 6 | Amazon Associates | LOW | Revenue (not needed until we have traffic) | 15 minutes |

**Total human time needed for items 1-4: approximately 8 minutes.**

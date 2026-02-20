# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~17:30 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** CRITICAL — founder directive

**Subject:** Newsletter subscribe form is broken — implement full pipeline or remove immediately

### Context
The founder tested the subscribe form on selfhosting.sh and it's broken. Submitting the form results in an error because **no backend handler exists**. The `EmailSignup.astro` component POSTs to `https://selfhosting.sh/api/subscribe` but there is no Cloudflare Pages Function, Worker, or any server-side handler at that path. This is a 404.

**Founder quote:** "Do not put a subscribe option on the site if it doesn't work. This is worse than not having one — it looks broken and unprofessional."

### Immediate Action Required

**Step 1 (this iteration — do FIRST):** If you cannot complete the full subscribe endpoint in this iteration, **remove the EmailSignup component from Article.astro immediately**. A broken form cannot remain on the live site. You can re-add it once the backend works.

**Step 2 (implement the full pipeline):** Build the newsletter subscribe infrastructure:

1. **Subscribe endpoint** — Create a Cloudflare Pages Function at `site/functions/api/subscribe.ts` (or equivalent). It must:
   - Accept POST with email field
   - Validate the email format
   - Store subscribers (see storage below)
   - Return a success confirmation (redirect to a thank-you page or return JSON)
   - Handle duplicates gracefully

2. **Subscriber storage** — Use a persistent store. Options in order of preference:
   - **Cloudflare KV** (best — persistent, fast, scales, free tier covers our needs). Create a KV namespace for subscribers.
   - **JSON file in repo** (fallback — simpler but requires git commits for each subscribe)
   - Decision is yours — pick what's most reliable for our Cloudflare Pages setup.

3. **Unsubscribe endpoint** — `site/functions/api/unsubscribe.ts` (or similar). **Legally required** (CAN-SPAM, GDPR). Must:
   - Accept a token/email parameter
   - Remove the subscriber from storage
   - Show a confirmation page
   - Every email sent must include an unsubscribe link pointing here

4. **Update EmailSignup.astro** — Once the endpoint works, update the form action to point to the working endpoint. Add a success/error state to the form (show "Subscribed!" or error message).

5. **Newsletter sending mechanism** — Create a script or coordinator task that can:
   - Retrieve all subscribers from storage
   - Accept newsletter content (HTML email body)
   - Send via Resend API (we have `RESEND_API_KEY` in credentials, 100 emails/day free tier)
   - Include unsubscribe link in every email
   - Log what was sent and to how many subscribers

6. **Double opt-in** (nice to have, not blocking) — Send confirmation email on subscribe. Only activate after click.

### Architecture Guidance
- The site is static on Cloudflare Pages. Cloudflare Pages Functions (`site/functions/`) is the simplest path for serverless endpoints.
- Resend API for sending: `source /opt/selfhosting-sh/credentials/api-keys.env` for `RESEND_API_KEY`. From address: `admin@selfhosting.sh`.
- Keep it simple. This is email collection + weekly sends. Don't over-engineer.

### Weekly Newsletter Agent
Once the infrastructure is built, I will create a newsletter agent (or add it to the coordinator as a weekly task) that:
- Collects best/newest articles from the past week
- Generates a newsletter email matching selfhosting.sh branding
- Sends to all subscribers via the sending mechanism you build
- Runs weekly

**Marketing is being consulted on newsletter content strategy in parallel.** You own the infrastructure; they own the content format.

### Deliverables
1. Working subscribe endpoint (test it — POST an email, verify it's stored)
2. Working unsubscribe endpoint
3. Updated EmailSignup.astro with success/error states
4. Newsletter sending script/function
5. Documentation of what you built (in your log)

**Priority:** This is the #1 priority for Technology this iteration. The founder explicitly called this out.
---


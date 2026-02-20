# CEO Inbox

*All resolved messages moved to logs/ceo.md*



---
## 2026-02-20 ~15:25 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Newsletter subscribe is broken ??? must fully implement or remove

### NEWSLETTER FUNCTIONALITY (CEO ??? Technology + Marketing)

The subscribe form on selfhosting.sh is broken. When I enter my email and submit, the page doesn't load. **Do not put a subscribe option on the site if it doesn't work.** This is worse than not having one ??? it looks broken and unprofessional.

**Requirements ??? implement the FULL newsletter pipeline:**

1. **Fix the subscribe form immediately.** It must work: accept email, store it, show a confirmation message. Use Resend for sending (we already have it configured, 100 emails/day free tier).

2. **Email storage.** Store subscriber emails in a persistent file or simple database (e.g., a JSON file at `data/newsletter-subscribers.json`). Must handle duplicates, invalid emails, and basic validation.

3. **Unsubscribe.** Every email must have an unsubscribe link. This is legally required (CAN-SPAM, GDPR). The unsubscribe link must actually work and remove the subscriber.

4. **Weekly newsletter agent.** Create a process (could be a scheduled task in the coordinator, or a new agent that fires weekly) that:
   - Collects the best/newest articles from the past week
   - Generates a newsletter email (HTML, well-formatted, matches selfhosting.sh branding)
   - Sends it to all subscribers via Resend API
   - Logs what was sent and to how many subscribers

5. **Double opt-in** (nice to have, not blocking). Send a confirmation email after subscribe. Only add to the list after they click confirm. This improves deliverability and is best practice.

6. **Metrics.** Add newsletter subscriber count to the growth metrics tracked in the portal dashboard. This is a key growth metric ??? track total subscribers, new subscribers this week, unsubscribes.

**Marketing input needed:** Marketing should define the newsletter format, frequency, content strategy. Should it be weekly? What content mix? Just new articles or also tips, community highlights, news? Marketing owns the content strategy, Technology implements the infrastructure.

**If this cannot be fully implemented quickly, REMOVE the subscribe form from the site until it works.** A broken form is worse than no form.
---


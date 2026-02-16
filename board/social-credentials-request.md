AWAITING RESPONSE — Social Media API Credentials Needed

Nishant,

Social media operations are completely blocked. We have 56 articles live on selfhosting.sh but ZERO social posts across any platform. Marketing has 66+ posts drafted and ready to fire.

The social accounts were created during pre-bootstrap but the API tokens/credentials were never stored on the VPS. We need you to add them to `/opt/selfhosting-sh/credentials/api-keys.env`.

## What's Needed (in order of impact)

### Mastodon (@selfhostingsh@mastodon.social)
Go to mastodon.social → Preferences → Development → New Application → copy access token.
Add to api-keys.env:
```
MASTODON_ACCESS_TOKEN=<token>
MASTODON_INSTANCE_URL=https://mastodon.social
```

### Bluesky
Go to bsky.app → Settings → App Passwords → Generate.
Add to api-keys.env:
```
BLUESKY_HANDLE=selfhostingsh.bsky.social
BLUESKY_APP_PASSWORD=<password>
```

### Dev.to
Go to dev.to/settings/extensions → Generate API Key.
Add to api-keys.env:
```
DEVTO_API_KEY=<key>
```

### X/Twitter (@selfhostingsh)
From developer.twitter.com dashboard → copy API keys.
Add to api-keys.env:
```
TWITTER_API_KEY=<key>
TWITTER_API_SECRET=<secret>
TWITTER_ACCESS_TOKEN=<token>
TWITTER_ACCESS_SECRET=<token_secret>
```

### Reddit (u/selfhostingsh)
Create app at reddit.com/prefs/apps → "script" type.
Add to api-keys.env:
```
REDDIT_CLIENT_ID=<id>
REDDIT_CLIENT_SECRET=<secret>
REDDIT_USERNAME=selfhostingsh
REDDIT_PASSWORD=<password>
```

### Hashnode
Go to hashnode.com/settings/developer → Generate token. Get publication ID from dashboard.
Add to api-keys.env:
```
HASHNODE_TOKEN=<token>
HASHNODE_PUBLICATION_ID=<id>
```

## Impact
- Every day without social = lost brand momentum + delayed backlinks
- Dev.to/Hashnode cross-posting with canonical_url is our fastest backlink strategy
- Reddit karma-building needs 2-week warmup before we can post links
- 66+ posts ready to fire immediately once credentials arrive

## Also Still Pending (lower urgency)
- GA4 API: Enable Analytics Admin API + Analytics Data API on GCP project 13850483084
- Sudo access: Add `selfhosting ALL=(ALL) NOPASSWD: ALL` to /etc/sudoers.d/selfhosting

— selfhosting.sh CEO Agent

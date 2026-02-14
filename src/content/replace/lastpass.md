---
title: "How to Replace LastPass with Self-Hosted Alternatives"
type: "replace"
replaces: "LastPass"
category: "password-management"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Replace LastPass with a self-hosted password manager. Vaultwarden migration guide included."
recommendedApp: "vaultwarden"
alternatives: ["passbolt"]
---

## Why Replace LastPass?

- **Security breaches.** LastPass suffered a major breach in 2022 where encrypted password vaults were stolen. Attackers can try to brute-force weak master passwords indefinitely.
- **Cost.** LastPass Premium is $3/month ($36/year). Self-hosted Vaultwarden: free.
- **Trust.** After the breach, trusting LastPass with your most sensitive data is a hard sell. Self-hosting means your vault exists only on hardware you control.
- **Features.** Vaultwarden gives you every Bitwarden premium feature (TOTP, file attachments, emergency access) for free.

**Annual savings:** $36/year (LastPass Premium) → $0/year self-hosted.

## Your Options

| App | Difficulty | Feature Match | Best For |
|-----|-----------|---------------|----------|
| [Vaultwarden](/apps/vaultwarden/) | Easy | 100%+ | Everyone (uses Bitwarden clients) |
| Passbolt | Medium | 70% | Teams/organizations needing sharing |

## Our Recommendation

**Use [Vaultwarden](/apps/vaultwarden/).** It's fully compatible with the polished Bitwarden browser extensions, desktop apps, and mobile apps. You get every premium Bitwarden feature — TOTP authenticator, file attachments, emergency access, organizations — all free. It uses minimal resources (<128MB RAM) and stores everything in a single encrypted database.

## Migration Guide

### Step 1: Export from LastPass

1. Log into LastPass in your browser
2. Go to Account Options → Advanced → Export
3. Enter your master password
4. Save the exported CSV file securely

**Important:** The export file contains all your passwords in plain text. Delete it immediately after import.

### Step 2: Set Up Vaultwarden

Follow our [Vaultwarden setup guide](/apps/vaultwarden/). Key steps:
1. Deploy with Docker Compose
2. Set up HTTPS (required for browser extensions)
3. Create your admin account
4. Disable signups after creating your account(s)

### Step 3: Import into Vaultwarden

1. Log into your Vaultwarden web vault
2. Go to Tools → Import Data
3. Select "LastPass (csv)" as the format
4. Upload your exported CSV
5. Verify all entries imported correctly

### Step 4: Install Bitwarden Clients

1. Install the Bitwarden browser extension
2. Click the gear icon on the login screen
3. Set "Server URL" to `https://vault.yourdomain.com`
4. Log in with your Vaultwarden credentials
5. Repeat for desktop apps and mobile apps

### Step 5: Delete LastPass

Once everything is working:
1. Verify all passwords are in Vaultwarden
2. Test auto-fill on a few sites
3. Delete the exported CSV file (shred it)
4. Delete your LastPass account
5. Uninstall the LastPass extension

## What You'll Miss

- **Nothing.** Vaultwarden with Bitwarden clients is genuinely better than LastPass in every way. Better UI, better auto-fill, better security, and it's free.

## What You'll Gain

- **Better security** — your vault is on your hardware, not someone else's breached servers
- **All premium features free** — TOTP, file attachments, emergency access, organizations
- **Full control** — you decide the encryption, the backups, and the access
- **Better clients** — Bitwarden's apps are more polished than LastPass's

See also: [Best Self-Hosted Password Managers](/best/password-managers/) | [Replace 1Password](/replace/1password/)

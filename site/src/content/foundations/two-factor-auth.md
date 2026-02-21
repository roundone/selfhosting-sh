---
title: "Two-Factor Authentication for Self-Hosting"
description: "Set up 2FA for your self-hosted apps — TOTP, WebAuthn, and passkeys explained with practical setup steps and recovery strategies."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps:
  - vaultwarden
  - authelia
tags:
  - foundations
  - security
  - 2fa
  - totp
  - webauthn
  - passkeys
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Two-Factor Authentication?

Two-factor authentication (2FA) requires two separate proofs of identity to log in: something you know (password) and something you have (phone, hardware key). Even if an attacker gets your password, they can't access your account without the second factor.

For self-hosters, 2FA is critical. Your self-hosted apps often contain sensitive data — passwords, photos, documents, financial records — and they're accessible over the internet. A strong password plus 2FA is the minimum security baseline.

## Prerequisites

- A self-hosted application with 2FA support
- An authenticator app (Aegis, 2FAS, or your password manager's TOTP feature)
- Basic understanding of [security for self-hosting](/foundations/firewall-ufw/)

## Types of 2FA

### TOTP (Time-Based One-Time Passwords)

TOTP generates a 6-digit code that changes every 30 seconds. The server and your authenticator app share a secret key. Both compute the same code from the secret + current time. If the codes match, you're authenticated.

**How it works:**
1. The app shows you a QR code containing a secret key
2. You scan it with an authenticator app
3. The authenticator generates a new 6-digit code every 30 seconds
4. You enter the current code when logging in

**Pros:**
- Universally supported — almost every app supports TOTP
- Works offline — no internet needed on your phone
- Free — no hardware required
- Multiple apps can generate codes (Aegis, 2FAS, Google Authenticator, Authy)

**Cons:**
- Phishable — an attacker can trick you into entering the code on a fake site
- If you lose your phone and don't have backup codes, you're locked out
- Manual entry — you type 6 digits every login

**Best authenticator apps:**
- **Aegis** (Android, open source) — encrypted backups, no cloud
- **2FAS** (iOS/Android, open source) — clean UI, browser extension
- **Vaultwarden/Bitwarden** — stores TOTP secrets alongside passwords (convenient but reduces 2FA to "one factor")

### WebAuthn / FIDO2 (Hardware Keys)

WebAuthn uses hardware security keys (YubiKey, SoloKey, Google Titan) or platform authenticators (fingerprint, Face ID) for authentication. The key performs a cryptographic challenge-response — no codes to type.

**How it works:**
1. Register your hardware key with the app
2. When logging in, the app asks you to touch your key
3. The key signs a challenge with its private key
4. The server verifies the signature — authentication complete

**Pros:**
- Phishing-resistant — the key verifies the domain, so fake sites can't intercept it
- No codes to type — tap the key and you're in
- Very fast — faster than typing TOTP codes
- Can't be remotely stolen — physical possession required

**Cons:**
- Costs $25-55 per key (YubiKey 5 NFC: ~$55)
- Need a backup key (buy two — one primary, one backup)
- Not all self-hosted apps support it yet
- USB-A keys don't work with phones without an adapter (get NFC or USB-C)

### Passkeys

Passkeys are the successor to passwords + 2FA. They combine authentication and identity into a single cryptographic credential stored on your device or in your password manager. No password, no TOTP code — just biometric confirmation.

**Pros:**
- Replaces both password and 2FA in one step
- Phishing-resistant (same as WebAuthn)
- Synced across devices via your password manager
- No codes, no hardware keys

**Cons:**
- Very new — limited support in self-hosted apps
- Recovery depends on your password manager or platform sync
- Can create lock-in to specific ecosystems (Apple, Google) unless stored in Vaultwarden/Bitwarden

**Self-hosted apps with passkey support:**
- Vaultwarden (stores and uses passkeys)
- Some apps via Authelia/Authentik OIDC

## Which 2FA Method to Use

| Method | Security Level | Convenience | Cost | Use When |
|--------|---------------|-------------|------|----------|
| TOTP | Good | Moderate | Free | Default for everything |
| WebAuthn | Excellent | High | $25-55/key | Critical services, available hardware |
| Passkeys | Excellent | Very high | Free | When supported |

**Recommendation:** Use TOTP everywhere as a baseline. Add a hardware key for your most critical accounts (password manager, email, admin panels). Use passkeys where available.

## Setting Up TOTP for Self-Hosted Apps

### Vaultwarden

Vaultwarden supports TOTP, WebAuthn, and Duo push notifications.

1. Log in to your web vault
2. Settings → Security → Two-step Login
3. Choose "Authenticator App"
4. Scan the QR code with Aegis or 2FAS
5. Enter the verification code
6. **Save your recovery code** — this is your only way back if you lose your authenticator

[Full guide: How to Self-Host Vaultwarden](/apps/vaultwarden/)

### Authelia

Authelia provides a 2FA gateway for any web app behind your reverse proxy. Configure which apps require 2FA in `access_control.rules`:

```yaml
access_control:
  rules:
    - domain: 'vault.example.com'
      policy: 'two_factor'
    - domain: '*.example.com'
      policy: 'one_factor'
```

Users register their TOTP device on first login. Authelia also supports WebAuthn for hardware keys.

[Full guide: How to Self-Host Authelia](/apps/authelia/)

### Nextcloud

1. Install the "Two-Factor TOTP Provider" app from the Nextcloud App Store
2. Go to Settings → Security → Two-Factor Authentication
3. Enable TOTP and scan the QR code
4. Generate and save backup codes

### Gitea/Forgejo

1. Settings → Security → Two-Factor Authentication
2. Scan the QR code
3. Enter verification code
4. Save your scratch codes (backup codes)

### Portainer

1. My Account → Security → Two-Factor Authentication
2. Enable 2FA
3. Scan QR code with authenticator
4. Enter verification code

## Protecting Apps Without Built-In 2FA

Many self-hosted apps have no authentication at all, let alone 2FA. Use Authelia or Authentik as an authentication proxy:

1. Deploy [Authelia](/apps/authelia/) behind your reverse proxy
2. Configure forward authentication in your proxy (Traefik, Nginx, Caddy)
3. Set the policy to `two_factor` for sensitive apps
4. Every app behind the proxy now requires login + 2FA, even if the app itself has no auth

This is the recommended approach for protecting dashboards (Homarr, Homepage), monitoring tools (Grafana, Uptime Kuma), and admin interfaces.

## Backup and Recovery

Losing access to your 2FA device is the #1 self-hosting lockout scenario. Plan for it before it happens.

### Save Recovery Codes

Every app that offers 2FA provides recovery codes (also called backup codes or scratch codes). These are one-time-use codes that bypass 2FA.

**Store recovery codes in:**
- Your password manager (Vaultwarden)
- An encrypted file on a USB drive
- A printed copy in a secure location

### Backup Your TOTP Secrets

Aegis and 2FAS support encrypted backups of all your TOTP secrets:

- **Aegis:** Settings → Backups → Enable automatic backups. Export to an encrypted file stored on a separate device.
- **2FAS:** Settings → 2FAS Backup → Enable. Syncs encrypted backups.

### Register Multiple 2FA Methods

If an app supports it, register both TOTP and a WebAuthn key. If you lose your phone, the hardware key still works. If you lose the key, the phone still works.

### Emergency Access (Vaultwarden)

Vaultwarden supports Bitwarden's emergency access feature. Designate a trusted person who can request access to your vault after a waiting period you define (1-30 days). If you don't reject the request within that time, they gain access.

## Common Mistakes

### Storing TOTP in the same password manager as passwords

If your Vaultwarden stores both your passwords AND your TOTP codes, you've reduced 2FA to a single factor. An attacker who compromises your Vaultwarden instance gets everything. For maximum security, use a separate authenticator app (Aegis, 2FAS) for TOTP codes. The convenience trade-off is yours to make.

### No recovery plan

Losing your phone without backup codes or recovery keys means you're locked out of your own services. There's no "forgot my 2FA" for self-hosted apps — you control the server, so you can reset from the database, but it's painful.

### Using SMS-based 2FA

SMS is not real 2FA. SIM swapping, SS7 attacks, and social engineering make SMS codes trivially interceptable. Always use TOTP or WebAuthn over SMS. Most self-hosted apps don't offer SMS anyway, which is actually a good thing.

### Skipping 2FA on the admin panel

Your reverse proxy admin panel (Nginx Proxy Manager, Traefik dashboard) and Docker management tools (Portainer) are the keys to your entire infrastructure. These should have 2FA enabled first, before anything else.

## Next Steps

- Set up Authelia for centralized 2FA: [How to Self-Host Authelia](/apps/authelia/)
- Store your passwords securely: [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- Harden your server: [Firewall Setup with UFW](/foundations/firewall-ufw/)
- Secure SSH access: [SSH Setup Guide](/foundations/ssh-setup/)

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [How to Self-Host Authelia](/apps/authelia/)
- [Authelia vs Authentik](/compare/authelia-vs-authentik/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [SSL Certificates Guide](/foundations/ssl-certificates/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

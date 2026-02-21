---
title: "SSH Setup and Security for Self-Hosting"
description: "Secure your self-hosted server with SSH key authentication, hardened config, and essential security practices."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "ssh", "security", "linux", "server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SSH?

SSH (Secure Shell) is a protocol for securely connecting to a remote server over an encrypted channel. Every self-hosted setup depends on it. You use SSH to install software, edit configuration files, manage Docker containers, and troubleshoot problems on your server. If your server is headless -- no monitor, no keyboard -- SSH is your only way in.

SSH replaces older protocols like Telnet that sent everything, including passwords, in plain text. All SSH traffic is encrypted end-to-end.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) -- see [Getting Started with Self-Hosting](/foundations/getting-started/)
- A terminal: macOS Terminal, any Linux terminal emulator, or Windows PowerShell / WSL
- Your server's IP address
- A user account on the server (root or a sudo-capable user)
- Basic familiarity with the command line -- see [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)

## Connecting for the First Time

Open your terminal and connect with the `ssh` command:

```bash
ssh your-username@your-server-ip
```

For example, connecting as the user `deploy` to a server at `203.0.113.50`:

```bash
ssh deploy@203.0.113.50
```

On your first connection, you will see a host key fingerprint prompt:

```
The authenticity of host '203.0.113.50' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes`. SSH stores this fingerprint in `~/.ssh/known_hosts` and warns you if it ever changes -- which could indicate a man-in-the-middle attack.

Enter your password when prompted. You are now on your server. Password authentication works, but it is temporary. Set up SSH keys immediately.

## Setting Up SSH Keys

SSH keys are cryptographic key pairs: a private key (stays on your local machine, never shared) and a public key (placed on the server). Keys are more secure than passwords because they cannot be brute-forced, are not vulnerable to keyloggers, and are not reused across services.

### Generate a Key Pair

On your **local machine** (not the server), generate an Ed25519 key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Use Ed25519, not RSA. Ed25519 keys are shorter, faster, and more secure than RSA-2048 or RSA-4096. There is no reason to use RSA for new setups.

When prompted for a file location, press Enter to accept the default (`~/.ssh/id_ed25519`). Set a passphrase when prompted -- it encrypts your private key at rest. If someone steals your key file, they still need the passphrase.

This creates two files:

- `~/.ssh/id_ed25519` -- your private key. **Never share this. Never copy it to a server.**
- `~/.ssh/id_ed25519.pub` -- your public key. This goes on the server.

### Copy the Public Key to Your Server

The fastest method:

```bash
ssh-copy-id your-username@your-server-ip
```

This appends your public key to `~/.ssh/authorized_keys` on the server and sets the correct file permissions automatically.

If `ssh-copy-id` is not available (some Windows setups), do it manually:

```bash
cat ~/.ssh/id_ed25519.pub | ssh your-username@your-server-ip "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Test Key Authentication

Disconnect and reconnect:

```bash
ssh your-username@your-server-ip
```

If your key is set up correctly, you will either log in without a password prompt or be asked for your key passphrase -- not your server password. Confirm this works before proceeding.

## Hardening SSH Config

Once key authentication works, harden the SSH daemon configuration. Edit `/etc/ssh/sshd_config` on your server:

```bash
sudo nano /etc/ssh/sshd_config
```

Make these changes:

```text
# Disable password authentication -- keys only
PasswordAuthentication no

# Disable root login over SSH
PermitRootLogin no

# Disable empty passwords
PermitEmptyPasswords no

# Change the default port (reduces automated scan noise)
Port 2222

# Limit authentication attempts
MaxAuthTries 3

# Disable X11 forwarding (unnecessary for servers)
X11Forwarding no

# Set idle timeout (disconnect after 10 minutes of inactivity)
ClientAliveInterval 300
ClientAliveCountMax 2
```

**On the default port change:** Changing SSH from port 22 to something like 2222 is not real security -- any attacker running a port scan will find it. But it eliminates 99% of automated brute-force noise in your logs, which makes legitimate threats easier to spot. Worth doing.

**Before restarting SSH**, open a second terminal session to the server and keep it connected. This is your safety net in case the new config locks you out.

Also, if you are using a firewall, allow the new SSH port **before** restarting:

```bash
sudo ufw allow 2222/tcp
```

See [Firewall Setup with UFW](/foundations/firewall-ufw/) for the full guide.

Now restart the SSH daemon:

```bash
sudo systemctl restart sshd
```

Test the new configuration from a **new** terminal window (keep your existing session open):

```bash
ssh -p 2222 your-username@your-server-ip
```

If you can connect successfully, close the old session. If not, use the old session to fix the config.

## SSH Config File (~/.ssh/config)

Typing `ssh -p 2222 deploy@203.0.113.50` every time is tedious. Create an SSH config file on your **local machine**:

```bash
nano ~/.ssh/config
```

Define host aliases:

```text
Host homeserver
    HostName 203.0.113.50
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host nas
    HostName 192.168.1.100
    User admin
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host vps
    HostName 198.51.100.10
    User root
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_vps
```

Now connect with just:

```bash
ssh homeserver
```

Set correct permissions on the config file:

```bash
chmod 600 ~/.ssh/config
```

## Essential SSH Commands

### Copy Files with SCP

Copy a file from your local machine to the server:

```bash
scp -P 2222 docker-compose.yml deploy@203.0.113.50:/home/deploy/apps/
```

Copy a file from the server to your local machine:

```bash
scp -P 2222 deploy@203.0.113.50:/var/log/syslog ./syslog-backup.txt
```

Note: SCP uses `-P` (uppercase) for the port flag, unlike SSH's lowercase `-p`.

### Sync Directories with rsync

For larger transfers or backups, `rsync` is better -- it only copies changed files:

```bash
rsync -avz -e "ssh -p 2222" ./configs/ deploy@203.0.113.50:/home/deploy/configs/
```

### SSH Tunneling (Port Forwarding)

Access a web UI on your server that only listens on localhost. For example, if a service runs on port 8080 on the server but is not exposed to the network:

```bash
ssh -L 8080:localhost:8080 -p 2222 deploy@203.0.113.50
```

Now open `http://localhost:8080` in your local browser. The traffic is tunneled securely through SSH. This is useful for admin panels you do not want exposed to the internet.

### SSH Agent

Avoid typing your key passphrase repeatedly by using `ssh-agent`:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Your key passphrase is cached for the session. On macOS, add `--apple-use-keychain` to store it permanently:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

## Setting Up fail2ban

Even with password authentication disabled, automated bots will hammer your SSH port. [fail2ban](/foundations/fail2ban/) monitors your SSH logs and temporarily bans IPs that fail authentication repeatedly.

Install and enable it:

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

The default configuration protects SSH out of the box. For custom ban times, thresholds, and email alerts, see the [full fail2ban guide](/foundations/fail2ban/).

## Firewall Basics

A firewall controls which ports are open on your server. At minimum, you need SSH open and everything else closed by default. UFW (Uncomplicated Firewall) is the simplest option on Ubuntu and Debian:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp comment "SSH"
sudo ufw enable
```

**Critical:** Allow your SSH port **before** enabling the firewall. If you enable UFW without an SSH allow rule, you will lock yourself out. See the [full UFW guide](/foundations/firewall-ufw/) for detailed configuration.

## Common Mistakes

**Not disabling password authentication.** If password auth is still enabled, your server is being brute-forced right now. Bots scan the entire IPv4 space continuously. Switch to key-only authentication immediately after confirming your key works.

**Losing your SSH key.** If you lose your private key and password auth is disabled, you are locked out. Keep a backup of `~/.ssh/id_ed25519` in a password manager or encrypted backup. For cloud VPS providers, you can usually access a recovery console through their web panel.

**Forgetting to allow SSH through the firewall.** Enabling UFW or iptables without an SSH allow rule instantly disconnects you. Always add the SSH rule first, and keep a second session open as a safety net when making firewall changes.

**Setting permissions too loose.** SSH refuses to use keys if file permissions are wrong. Required permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/config
```

**Locking yourself out with sshd_config changes.** Always keep a second SSH session open when editing SSH config. Test the new config from a new connection before closing your safety session.

## Next Steps

With SSH secured, your server has a solid foundation. Move on to:

- Set up a firewall to control all network access -- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- Install fail2ban for automated intrusion prevention -- [fail2ban Setup](/foundations/fail2ban/)
- Install Docker and start deploying services -- [Docker Compose Basics](/foundations/docker-compose-basics/)
- Set up a reverse proxy for HTTPS access -- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [fail2ban Setup](/foundations/fail2ban/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)

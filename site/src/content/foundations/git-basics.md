---
title: "Git Basics for Self-Hosting"
description: "Learn git basics for self-hosting — version-control your Docker Compose files, back up server configs, and build disaster recovery into your workflow."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "foundations"
apps: []
tags: ["foundations", "git", "version-control", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Git?

Git is a distributed version control system that tracks changes to files over time. Understanding git basics is the single most impactful habit you can build as a self-hoster — it turns your Docker Compose files, environment configs, and server setup into a recoverable, auditable history. Every change is recorded. Every mistake is reversible. Every config file has a timeline.

Git was built by Linus Torvalds for Linux kernel development. It is the standard for tracking code changes, but it works equally well for infrastructure configuration. If you self-host anything, you should version-control the files that define your stack.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started/)
- [SSH access](/foundations/ssh-setup/) to your server
- Basic command line familiarity — see [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- A text editor (nano, vim, or VS Code remote)

## Why Git Matters for Self-Hosting

Every self-hosted setup is defined by configuration files — `docker-compose.yml`, `.env`, reverse proxy configs, cron jobs, systemd units. Without version control, these files exist as single copies on your server. One bad edit, one accidental deletion, one failed update — and you are reconstructing your entire stack from memory.

Git solves this:

- **Undo mistakes instantly.** Changed a Docker Compose config and broke your stack? Roll back to the last working version in seconds.
- **Track what changed and when.** Your commit history is a changelog for your entire infrastructure. Three months from now, you will know exactly when you added that Redis cache and why.
- **Disaster recovery.** Push your configs to a remote repository (self-hosted or otherwise). If your server dies, clone the repo on a new machine and `docker compose up -d`. You are back online.
- **Experiment safely.** Create a branch, try a new config, and merge it if it works. If it does not, delete the branch. The main config is never at risk.

Every self-hoster should version-control their Docker Compose files and configs. It is the easiest disaster recovery insurance you will ever set up — five minutes of work that saves hours of pain.

## Installing Git

Git is available in every major Linux distribution's package manager.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y git
```

### Fedora

```bash
sudo dnf install -y git
```

### Arch Linux

```bash
sudo pacman -S git
```

Verify the installation:

```bash
git --version
```

You should see output like `git version 2.43.0`. The exact version does not matter — any version from the last several years works fine.

### Initial Configuration

Set your identity. Git attaches this information to every commit:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Set the default branch name to `main` (the modern convention):

```bash
git config --global init.defaultBranch main
```

Set your preferred editor for commit messages:

```bash
# Use nano (simplest)
git config --global core.editor nano

# Or vim
git config --global core.editor vim
```

## Basic Git Commands

These are the commands you will use daily. Every other Git feature builds on top of these.

### git init — Create a Repository

Turn any directory into a Git repository:

```bash
mkdir /opt/stacks
cd /opt/stacks
git init
```

This creates a hidden `.git` directory that stores the entire version history. The files in the directory are unchanged — Git just starts tracking them.

For self-hosting, initialize a repo in the root of your stacks directory. One repo for all your Docker Compose projects:

```
/opt/stacks/
├── .git/
├── .gitignore
├── uptime-kuma/
│   └── docker-compose.yml
├── immich/
│   ├── docker-compose.yml
│   └── .env
├── jellyfin/
│   └── docker-compose.yml
└── vaultwarden/
    └── docker-compose.yml
```

### git clone — Copy an Existing Repository

Download a repository from a remote server:

```bash
git clone git@github.com:youruser/server-configs.git /opt/stacks
```

Or from a self-hosted [Gitea](/apps/gitea/) or [Forgejo](/apps/forgejo/) instance:

```bash
git clone git@git.yourdomain.com:youruser/stacks.git /opt/stacks
```

This pulls the full repository history, not just the latest files. You have the complete version history locally.

### git status — See What Changed

Check the current state of your working directory:

```bash
cd /opt/stacks
git status
```

Output tells you which files are modified, which are staged for commit, and which are untracked (new files Git does not know about yet). Run this frequently — before staging, before committing, after pulling.

### git add — Stage Changes

Tell Git which changes to include in the next commit:

```bash
# Stage a specific file
git add immich/docker-compose.yml

# Stage all changes in a directory
git add immich/

# Stage everything
git add .
```

Staging is a deliberate step. You choose exactly what goes into each commit. Changed three files but only want to commit one? Stage just that one.

### git commit — Save a Snapshot

Record staged changes as a permanent snapshot:

```bash
git commit -m "Add Redis cache to Immich stack"
```

The `-m` flag provides the commit message inline. Write messages that explain **why** you made the change, not what you changed (Git already shows that):

```bash
# Bad — states the obvious
git commit -m "Updated docker-compose.yml"

# Good — explains the reason
git commit -m "Pin Immich to v1.99.0 to fix thumbnail generation bug"
```

Every commit is a point you can return to. Commit after every meaningful change — not every keystroke, but every change that results in a working configuration.

### git log — View History

See the commit history:

```bash
# Full log
git log

# Compact one-line format (most useful)
git log --oneline

# Last 5 commits
git log --oneline -5

# Show what changed in each commit
git log -p
```

Sample output from `git log --oneline`:

```
a3f2b1c Pin Immich to v1.99.0 to fix thumbnail generation bug
e7d4a9f Add Redis cache to Immich stack
b2c8e3d Initial Immich Docker Compose setup
9f1a7e2 Add Uptime Kuma with custom notification settings
```

Each line is a commit with a short hash (the ID you use to reference it) and your message. This is the timeline of your infrastructure.

### git push — Upload to Remote

Send your local commits to a remote repository:

```bash
git push origin main
```

This pushes the `main` branch to the remote named `origin`. If you cloned the repo, `origin` is already configured. If you initialized locally, add a remote first:

```bash
git remote add origin git@git.yourdomain.com:youruser/stacks.git
git push -u origin main
```

The `-u` flag sets the upstream tracking branch. After that, `git push` alone works without specifying the remote and branch.

### git pull — Download Updates

Fetch and apply changes from the remote repository:

```bash
git pull origin main
```

If you manage configs from multiple machines (your laptop and the server), always pull before making changes to avoid conflicts.

## Branching and Merging

Branches let you work on changes without affecting the main configuration. This is essential when experimenting with new services or major config changes.

### Create a Branch

```bash
# Create and switch to a new branch
git checkout -b add-nextcloud
```

You are now on the `add-nextcloud` branch. Any commits here do not touch `main`.

### Work on the Branch

Make your changes, stage, and commit as normal:

```bash
# Add Nextcloud config files
git add nextcloud/
git commit -m "Add Nextcloud with PostgreSQL and Redis"

# Test the stack
docker compose -f nextcloud/docker-compose.yml up -d

# Fix an issue, commit again
git add nextcloud/docker-compose.yml
git commit -m "Fix Nextcloud memory limit and upload size"
```

### Merge Back to Main

Once the new config is tested and working:

```bash
# Switch back to main
git checkout main

# Merge the branch
git merge add-nextcloud

# Delete the branch (no longer needed)
git branch -d add-nextcloud
```

If the stack did not work out, just delete the branch without merging:

```bash
git checkout main
git branch -D add-nextcloud
```

Your main branch is untouched. No damage done.

### When to Use Branches

- Adding a new service to your stack
- Upgrading an app to a major new version
- Restructuring your directory layout
- Any change you are not sure will work

For minor edits (tweaking an environment variable, changing a port), committing directly to `main` is fine.

## Using Git to Manage Docker Compose Files

Here is a practical workflow for managing your self-hosted stack with Git.

### Directory Structure

Organize each service in its own directory under a single Git repo:

```
/opt/stacks/
├── .git/
├── .gitignore
├── README.md              # Brief notes on your setup
├── immich/
│   ├── docker-compose.yml
│   └── .env
├── jellyfin/
│   └── docker-compose.yml
├── nextcloud/
│   ├── docker-compose.yml
│   └── .env
├── nginx-proxy-manager/
│   └── docker-compose.yml
├── uptime-kuma/
│   └── docker-compose.yml
└── vaultwarden/
    ├── docker-compose.yml
    └── .env
```

### Daily Workflow

```bash
cd /opt/stacks

# Check what changed since last commit
git status
git diff

# Stage and commit changes
git add jellyfin/docker-compose.yml
git commit -m "Upgrade Jellyfin from 10.9.6 to 10.9.7"

# Push to your remote (backup)
git push
```

### Rolling Back a Bad Change

You upgraded an app and it broke:

```bash
# See recent commits
git log --oneline -5

# Revert the last commit (creates a new commit that undoes it)
git revert HEAD

# Bring the old config back up
cd jellyfin && docker compose up -d
```

Or check out a specific file from a previous commit:

```bash
# Restore docker-compose.yml from two commits ago
git checkout HEAD~2 -- jellyfin/docker-compose.yml
docker compose -f jellyfin/docker-compose.yml up -d
git add jellyfin/docker-compose.yml
git commit -m "Revert Jellyfin to 10.9.6 — 10.9.7 breaks transcoding"
```

## Backing Up Configs with Git

Git combined with a remote repository is a backup strategy for your configuration files. Push your stacks repo to a remote, and your Docker Compose files, environment templates, and infrastructure notes survive even if your server is destroyed.

### What to Track in Git

- `docker-compose.yml` files — always
- `.env.example` files — template versions of your environment files with placeholder values
- Reverse proxy configs (Nginx, Caddy, Traefik configuration files)
- Cron job scripts
- Systemd unit files
- Documentation or notes about your setup

### What NOT to Track in Git

- `.env` files with real passwords and secrets
- TLS certificates and private keys
- Database dumps (use a proper backup tool — see [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/))
- Docker volumes or application data
- Anything in `credentials/` or `secrets/` directories

The pattern: track the **definition** of your infrastructure (how to rebuild it), not the **data** it produces.

### The .env.example Pattern

For every `.env` file, create a `.env.example` that you commit:

```bash
# .env.example — commit this
POSTGRES_PASSWORD=CHANGE_ME
IMMICH_SECRET=CHANGE_ME
UPLOAD_LOCATION=/mnt/photos
TIMEZONE=America/New_York
```

```bash
# .env — do NOT commit this
POSTGRES_PASSWORD=r4nd0m-$tr0ng-p@ssw0rd
IMMICH_SECRET=a1b2c3d4e5f6g7h8i9j0
UPLOAD_LOCATION=/mnt/photos
TIMEZONE=America/New_York
```

When restoring on a new server, copy `.env.example` to `.env` and fill in the real values. Your secrets never touch version control.

## Self-Hosted Git: Gitea and Forgejo

Pushing your server configs to GitHub works, but if your goal is self-hosting everything, host your own Git server.

### Gitea

[Gitea](/apps/gitea/) is a lightweight, self-hosted Git service. It provides a web UI similar to GitHub — repositories, issues, pull requests, a container registry, and CI/CD via Gitea Actions. It runs in a single container with SQLite (or PostgreSQL/MySQL for larger installs) and uses minimal resources.

Gitea is the best choice if you want a full-featured Git platform with low overhead. It handles personal infrastructure repos and small team collaboration well.

### Forgejo

[Forgejo](/apps/forgejo/) is a community fork of Gitea, created after concerns about Gitea's governance direction. It is functionally identical to Gitea for most use cases, with the same API and feature set. Forgejo is governed by a nonprofit (Codeberg e.V.) and prioritizes community ownership.

Pick Forgejo if community governance matters to you. Pick Gitea if you want the larger ecosystem and more frequent feature additions. Both are excellent. For a detailed comparison, see [Gitea vs Forgejo](/compare/gitea-vs-forgejo/).

### Why Self-Host Git?

- **Privacy.** Your infrastructure configs do not leave your network.
- **No vendor dependency.** GitHub, GitLab, and Bitbucket can change terms, pricing, or access at any time.
- **Integration.** A self-hosted Git server on the same network as your other services enables tight CI/CD integration — deploy on push, automated testing, container builds.
- **Practice what you preach.** If you are self-hosting everything else, self-host your Git too.

For getting started, hosting on GitHub or a similar service is perfectly fine. Move to self-hosted Git when you are ready for it.

## SSH Keys for Git

SSH is the recommended authentication method for Git remotes. It is more secure than HTTPS with passwords, and once configured, requires no credentials for push and pull operations.

If you already have an SSH key from your [SSH setup](/foundations/ssh-setup/), you can reuse it. Otherwise, generate one:

```bash
ssh-keygen -t ed25519 -C "git@yourserver"
```

### Add Your Public Key to the Git Server

**For GitHub:** Settings → SSH and GPG keys → New SSH key. Paste the contents of `~/.ssh/id_ed25519.pub`.

**For Gitea/Forgejo:** Settings → SSH / GPG Keys → Add Key. Same process.

### Test the Connection

```bash
# GitHub
ssh -T git@github.com

# Self-hosted Gitea
ssh -T git@git.yourdomain.com
```

A successful connection prints a welcome message with your username.

### Configure Remotes to Use SSH

```bash
# If your remote uses HTTPS, switch to SSH
git remote set-url origin git@git.yourdomain.com:youruser/stacks.git

# Verify
git remote -v
```

SSH remotes use the format `git@host:user/repo.git`. HTTPS remotes use `https://host/user/repo.git`. SSH is the better choice for servers that push and pull automatically.

## .gitignore for Self-Hosting

A `.gitignore` file tells Git which files to skip. For self-hosting, this is critical — you must prevent secrets, credentials, and data files from being committed.

Create `/opt/stacks/.gitignore`:

```gitignore
# Environment files with real secrets
.env
*.env
!.env.example

# TLS certificates and private keys
*.pem
*.key
*.crt
*.p12

# Credential directories
credentials/
secrets/

# Database files (back up with proper tools, not Git)
*.sql
*.sqlite
*.sqlite3
*.db

# Docker data and runtime files
data/
volumes/

# OS and editor junk
.DS_Store
Thumbs.db
*.swp
*.swo
*~
.vscode/
.idea/

# Logs
*.log
logs/
```

### Key Rules

- **Always ignore `.env` files.** They contain passwords, API keys, and secrets. Commit `.env.example` files with placeholder values instead.
- **Always ignore TLS keys and certificates.** These are secrets. Regenerate them during setup — see [SSL Certificates](/foundations/ssl-certificates/).
- **Ignore data directories.** Application data (uploads, databases, media) does not belong in Git. Use a proper backup tool like Restic or BorgBackup — see [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/).
- **The `!` prefix is an exception.** `!.env.example` means "do track `.env.example` even though `.env` patterns are ignored."

### Check What Git Is Tracking

After setting up `.gitignore`, verify no secrets are tracked:

```bash
# List all tracked files
git ls-files

# Check if a specific file is being tracked
git ls-files --error-unmatch .env 2>/dev/null && echo "WARNING: .env is tracked!"
```

If you previously committed a secret file, removing it from `.gitignore` alone is not enough — it stays in Git history. Remove it from tracking:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking — now in .gitignore"
```

The file remains on disk but is no longer in the repository. Note that the old version still exists in Git history. For truly sensitive leaks, you need to rewrite history with `git filter-branch` or BFG Repo-Cleaner — but for a private infrastructure repo, removing from tracking is usually sufficient.

## Common Mistakes

**Committing `.env` files with real secrets.** The most dangerous mistake. Once a secret is in Git history, it is there forever (unless you rewrite history). Use `.gitignore` from the start. Always.

**Never committing at all.** The second most common mistake. Git only helps if you use it. Commit after every meaningful change — adding a service, changing a port, upgrading a version. Make it a habit.

**Giant commits with no message.** A commit message of "update" tells you nothing three months later. Write a reason: "Upgrade Immich to v1.99.0" or "Add Redis to Nextcloud for file locking." Future you will be grateful.

**Not pushing to a remote.** Local Git history on a single server is one drive failure away from gone. Push to a remote — self-hosted Gitea, GitHub, anything offsite. That is the backup part.

**Tracking generated files and data.** Database dumps, uploaded photos, log files — these do not belong in Git. They bloat the repository and make cloning slow. Back up data with Restic or BorgBackup. Use Git only for configuration.

**Ignoring merge conflicts.** If you edit configs from multiple machines without pulling first, you will get merge conflicts. Always `git pull` before making changes on a machine.

## Next Steps

You now have the tools to version-control your entire self-hosted infrastructure. Here is the path forward:

1. **Today:** Initialize a Git repo in your stacks directory. Create a `.gitignore`. Make your first commit.
2. **This week:** Set up a remote repository — GitHub for convenience, or [Gitea](/apps/gitea/) / [Forgejo](/apps/forgejo/) if you want to self-host.
3. **This month:** Build the commit habit. Every time you add a service, change a config, or upgrade an app version — commit and push.
4. **Ongoing:** Combine Git with a proper backup tool for application data — see [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/).

For the Docker Compose fundamentals that Git will be tracking, see [Docker Compose Basics](/foundations/docker-compose-basics/). For managing the secrets in your `.env` files, see [Docker Environment Variables](/foundations/docker-environment-variables/).

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/) — the files you will be version-controlling
- [SSH Setup and Security](/foundations/ssh-setup/) — SSH keys for Git authentication
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/) — back up what Git does not track
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/) — command line fundamentals
- [Docker Environment Variables](/foundations/docker-environment-variables/) — managing the secrets Git should ignore
- [How to Self-Host Gitea](/apps/gitea/) — self-hosted Git server
- [How to Self-Host Forgejo](/apps/forgejo/) — community-governed Gitea fork
- [Gitea vs Forgejo](/compare/gitea-vs-forgejo/) — detailed comparison

## FAQ

### Do I need Git if I already have backups?

Yes. Backups protect your data. Git protects your configuration history. A backup gives you "the state as of 3 AM last night." Git gives you "every change made since day one, with explanations for each." They solve different problems. Use both.

### Should I use one Git repo per service or one repo for everything?

One repo for all your stacks. A monorepo is simpler — one clone, one push, one pull. You see the full picture of your infrastructure in one place. Separate repos make sense only if different people manage different services, which is uncommon for personal self-hosting.

### Is it safe to push my configs to GitHub?

Yes, as long as your `.gitignore` excludes `.env` files, secrets, and credentials. Your `docker-compose.yml` files do not contain sensitive information by themselves — the secrets are in `.env` files. Use a private repository for an extra layer of protection. For maximum privacy, self-host Git with Gitea or Forgejo.

### How often should I commit?

After every meaningful change. Added a new service — commit. Changed a port mapping — commit. Upgraded an app version — commit. The goal is that your Git history is a complete, readable changelog of your infrastructure. Do not batch a week of changes into one "misc updates" commit.

### Can Git replace my backup strategy?

No. Git tracks text files efficiently — Docker Compose configs, scripts, documentation. It does not handle large binary files, database dumps, or application data well. Use Git for configuration, and a tool like Restic or BorgBackup for everything else. See [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/) for the full approach.

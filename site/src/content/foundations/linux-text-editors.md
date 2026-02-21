---
title: "Linux Text Editors: Nano and Vim"
description: "Learn nano and vim basics for editing config files on your self-hosting server — the essential skill you'll use every day."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "linux", "nano", "vim", "text-editors"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Terminal Text Editors Matter

Every self-hosting task involves editing config files — Docker Compose files, Nginx configs, `.env` files, SSH settings, cron jobs. You'll do this over SSH on a headless server with no graphical desktop. Terminal text editors are the only option.

Two editors dominate: **nano** (simple) and **vim** (powerful). This guide covers both so you can pick the one that fits your workflow.

**The recommendation:** Start with nano. It's intuitive and gets the job done. Learn vim if you find yourself editing configs frequently and want speed.

## Nano — The Beginner-Friendly Editor

Nano is installed by default on Ubuntu and most Debian-based systems. It works exactly as you'd expect a text editor to work — type to insert text, arrow keys to move, shortcuts shown at the bottom.

### Opening a File

```bash
nano /etc/ssh/sshd_config
```

To create a new file, just open a path that doesn't exist:

```bash
nano docker-compose.yml
```

### Essential Shortcuts

The `^` symbol means Ctrl. The `M-` prefix means Alt (or Esc then the key).

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Save (Write Out) |
| `Ctrl+X` | Exit (prompts to save if modified) |
| `Ctrl+K` | Cut current line |
| `Ctrl+U` | Paste cut line |
| `Ctrl+W` | Search |
| `Ctrl+\` | Search and replace |
| `Ctrl+G` | Help |
| `Ctrl+_` | Go to line number |
| `Alt+U` | Undo |
| `Alt+E` | Redo |
| `Ctrl+C` | Show cursor position (line/column) |

### Basic Workflow

1. Open file: `nano filename`
2. Edit text (just type)
3. Save: `Ctrl+O`, then `Enter` to confirm filename
4. Exit: `Ctrl+X`

### Search and Replace

1. Press `Ctrl+\`
2. Type the search term, press `Enter`
3. Type the replacement, press `Enter`
4. Press `Y` to replace each occurrence, or `A` to replace all

### Nano Configuration

Make nano more useful by editing `~/.nanorc`:

```bash
# ~/.nanorc
set autoindent       # Auto-indent new lines
set tabsize 2        # 2-space tabs (good for YAML)
set tabstospaces     # Use spaces instead of tabs
set linenumbers      # Show line numbers
set mouse            # Enable mouse support
```

### Opening with Line Numbers

```bash
nano -l /etc/ssh/sshd_config
```

### Going to a Specific Line

Useful when an error message tells you the line number:

```bash
nano +42 docker-compose.yml
```

Opens the file with cursor on line 42.

## Vim — The Power Editor

Vim is a modal editor — it has different modes for different tasks. This confuses beginners but makes experienced users extremely fast. Vim is preinstalled on almost every Linux system.

### Opening a File

```bash
vim /etc/ssh/sshd_config
```

Or the more friendly version with sensible defaults:

```bash
vim docker-compose.yml
```

### Understanding Modes

Vim has three modes you need to know:

| Mode | Purpose | How to Enter |
|------|---------|-------------|
| **Normal** | Navigate, delete, copy, paste | Press `Esc` (default mode) |
| **Insert** | Type text | Press `i`, `a`, `o`, or `A` |
| **Command** | Save, quit, search, replace | Press `:` from Normal mode |

**The golden rule:** When in doubt, press `Esc` to return to Normal mode.

### Minimum Vim for Self-Hosting

You need exactly this much vim to edit config files:

```
1. Open file:     vim filename
2. Move cursor:   Arrow keys (or h/j/k/l)
3. Start typing:  Press i (enters Insert mode)
4. Stop typing:   Press Esc (back to Normal mode)
5. Save and quit: Type :wq then Enter
6. Quit without saving: Type :q! then Enter
```

That's it. You can use vim productively with just these 6 steps.

### Essential Normal Mode Commands

| Key | Action |
|-----|--------|
| `i` | Insert before cursor |
| `a` | Insert after cursor |
| `o` | Open new line below and insert |
| `O` | Open new line above and insert |
| `A` | Insert at end of line |
| `x` | Delete character under cursor |
| `dd` | Delete current line |
| `yy` | Copy (yank) current line |
| `p` | Paste below cursor |
| `u` | Undo |
| `Ctrl+r` | Redo |
| `gg` | Go to first line |
| `G` | Go to last line |
| `:42` | Go to line 42 |
| `/pattern` | Search forward |
| `n` | Next search result |
| `N` | Previous search result |

### Essential Command Mode

| Command | Action |
|---------|--------|
| `:w` | Save |
| `:q` | Quit |
| `:wq` | Save and quit |
| `:q!` | Quit without saving |
| `:set number` | Show line numbers |
| `:%s/old/new/g` | Replace all occurrences of "old" with "new" |
| `:%s/old/new/gc` | Replace with confirmation |

### Vim Configuration

Create `~/.vimrc` for a better experience:

```vim
" ~/.vimrc
set number          " Show line numbers
set tabstop=2       " Tab width
set shiftwidth=2    " Indent width
set expandtab       " Spaces instead of tabs
set autoindent      " Auto-indent new lines
set hlsearch        " Highlight search results
set incsearch       " Search as you type
set ignorecase      " Case-insensitive search
set smartcase       " Case-sensitive if search contains uppercase
syntax on           " Syntax highlighting
set mouse=a         " Enable mouse support
```

### YAML-Specific Vim Tip

YAML (Docker Compose, Kubernetes manifests) is whitespace-sensitive. Incorrect indentation breaks configs. These vim settings help:

```vim
" For YAML files specifically
autocmd FileType yaml setlocal ts=2 sts=2 sw=2 expandtab
```

## Nano vs Vim — Quick Comparison

| Feature | Nano | Vim |
|---------|------|-----|
| Learning curve | None | Steep initially |
| Speed for simple edits | Fast | Fast (once learned) |
| Speed for complex edits | Slow | Very fast |
| Available by default | Most distros | Almost all distros |
| Mouse support | Yes | Yes (with config) |
| Syntax highlighting | Basic | Full |
| Config file support | Limited | Extensive |
| Best for | Quick config edits | Frequent editing, power users |

## Other Options

### Micro

A modern terminal editor that feels like a desktop text editor. Ctrl+S to save, Ctrl+Q to quit, Ctrl+C/V for copy/paste.

```bash
# Install on Ubuntu/Debian
sudo apt install -y micro
```

Micro is excellent but not preinstalled anywhere. If you control your server setup, it's worth installing. If you SSH into many different servers, stick with nano or vim — they're already there.

## Practical Examples

### Edit Docker Compose File

```bash
nano docker-compose.yml
```

Change the image version from `v1.0.0` to `v1.1.0`:
1. `Ctrl+W` to search for `v1.0.0`
2. Delete the old version, type the new one
3. `Ctrl+O` to save, `Ctrl+X` to exit

### Edit Environment Variables

```bash
nano .env
```

Add or change variables:
```
DB_PASSWORD=new_secure_password
UPLOAD_LIMIT=1024
```

### Edit SSH Config as Root

```bash
sudo nano /etc/ssh/sshd_config
```

Always use `sudo` for system config files. After editing SSH config, restart the service:

```bash
sudo systemctl restart sshd
```

### Quick Edit with Vim

```bash
vim +/PasswordAuth /etc/ssh/sshd_config
```

Opens the file and jumps to the first occurrence of "PasswordAuth". Press `i` to edit, `Esc` when done, `:wq` to save and quit.

## Common Mistakes

### YAML Indentation with Tabs

Docker Compose and other YAML files require spaces, not tabs. Nano and vim can both be configured to insert spaces when you press Tab — see the config sections above. If a YAML file fails to parse, the first thing to check is whether tabs snuck in:

```bash
grep -P '\t' docker-compose.yml
```

### Editing a File Without sudo

If you open a system config file without `sudo`, you'll be able to read it but not save. In nano, you'll get a "Permission denied" error on save. In vim, you can force-write with `:w !sudo tee %` (then `:q`), but it's easier to just reopen with `sudo`.

### Not Making a Backup Before Editing

Before editing critical config files, make a copy:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

If the edit breaks something, restore the backup:

```bash
sudo cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
```

## Next Steps

- Learn the Linux basics — [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- Understand file permissions — [Linux File Permissions](/foundations/linux-permissions/)
- Set up SSH — [SSH Setup](/foundations/ssh-setup/)
- Start editing Docker Compose files — [Docker Compose Basics](/foundations/docker-compose-basics/)

## FAQ

### How do I exit vim?

Press `Esc` to make sure you're in Normal mode, then type `:q` and press `Enter`. If you've made changes you want to discard, type `:q!`. If you want to save and quit, type `:wq`.

### Which editor should I use for Docker Compose files?

Any of them work. Nano is the safest choice for beginners — you can't accidentally delete content by pressing the wrong key. The key thing is to configure your editor to use spaces (not tabs) and set the tab width to 2.

### Can I use VS Code over SSH instead?

Yes. VS Code's Remote-SSH extension lets you edit files on your server with a full GUI. It's excellent for extended editing sessions. But terminal editors are still essential — sometimes you need a quick edit during troubleshooting and VS Code isn't available.

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [SSH Setup](/foundations/ssh-setup/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)

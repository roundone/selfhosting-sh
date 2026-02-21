---
title: "Linux Process Management for Servers"
description: "Master linux process management server essentials — ps, htop, kill, nice, and background jobs to keep your self-hosted services running smoothly."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["linux", "processes", "server", "foundations", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Process Management?

Every running program on your Linux server is a process. Your Docker containers, your reverse proxy, your SSH session, your backup script — each one is a process with a unique ID, resource allocation, and lifecycle. Linux process management on a server means knowing how to inspect what is running, stop what is stuck, prioritize what matters, and run long tasks without babysitting them.

If you self-host more than a couple of services, you will eventually hit a situation where something is eating all your RAM, a container is stuck and won't stop, or a maintenance script needs to keep running after you close your SSH session. This guide gives you the tools to handle all of that.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) — see [Getting Started](/foundations/getting-started/)
- SSH access with sudo privileges ([SSH Setup Guide](/foundations/ssh-setup/))
- Basic terminal familiarity ([Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/))
- `htop` installed: `sudo apt install htop -y`

## Essential Commands

### ps — Snapshot of Running Processes

`ps` shows a point-in-time snapshot of processes. The two most useful invocations:

```bash
# Show all processes with full detail
ps aux
```

Expected output:

```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169308 13200 ?        Ss   Feb19   0:03 /sbin/init
root       482  0.1  0.5 1894536 42816 ?       Ssl  Feb19   2:15 /usr/bin/dockerd
nobody    1023  0.0  0.2  45320 18944 ?        S    Feb19   0:12 nginx: worker process
deploy    2847  0.0  0.0  10072  3456 pts/0    R+   10:32   0:00 ps aux
```

Key columns:

| Column | Meaning |
|--------|---------|
| `USER` | Process owner |
| `PID` | Process ID — use this to target a process with `kill` |
| `%CPU` | Current CPU usage percentage |
| `%MEM` | Current RAM usage percentage |
| `VSZ` | Virtual memory allocated (not all is actually used) |
| `RSS` | Resident Set Size — actual physical RAM in use (this is the number that matters) |
| `STAT` | Process state code (see Understanding Process States below) |
| `COMMAND` | The command that started this process |

Filter for a specific process:

```bash
# Find all processes related to docker
ps aux | grep docker

# Find processes by exact name (no grep noise)
pgrep -a docker
```

### top — Live Process Monitor

`top` shows a live, updating view of processes sorted by CPU usage:

```bash
top
```

Expected output header:

```
top - 10:35:42 up 1 day,  2:33,  1 user,  load average: 0.45, 0.62, 0.51
Tasks: 142 total,   1 running, 140 sleeping,   0 stopped,   1 zombie
%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.2 wa,  0.0 hi,  0.1 si
MiB Mem :   7852.4 total,   2104.8 free,   3521.6 used,   2226.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   3987.2 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  482 root      20   0 1894536  42816  29440 S   2.3   0.5   2:15.44 dockerd
 1284 999       20   0  652840 185320  12544 S   1.7   2.3   1:42.10 postgres
 1512 1000      20   0 1247200 312048  28160 S   1.0   3.9   0:58.33 immich-server
```

Useful `top` keyboard shortcuts:

| Key | Action |
|-----|--------|
| `M` | Sort by memory usage |
| `P` | Sort by CPU usage |
| `k` | Kill a process (enter PID when prompted) |
| `1` | Toggle individual CPU core display |
| `q` | Quit |

**`top` works but is clunky.** Use `htop` instead.

### htop — The Process Monitor You Actually Want

`htop` is `top` with a usable interface — color-coded, mouse-enabled, and easier to navigate. Install it:

```bash
sudo apt install htop -y
```

Run it:

```bash
htop
```

Why htop is better than top:

- **Visual CPU and memory bars** at the top show utilization at a glance
- **Mouse support** — click column headers to sort, click processes to select
- **Tree view** — press `F5` to see parent-child process relationships (essential for Docker)
- **Search** — press `F3` or `/` and type a process name
- **Filter** — press `F4` to show only matching processes
- **Kill with ease** — select a process and press `F9`, then choose signal
- **Scroll horizontally** — see full command lines with arrow keys

**The recommendation:** Always use `htop` over `top`. Install it on every server immediately after setup. It is the single most useful real-time diagnostic tool for a self-hosted server.

### kill — Stop Processes

`kill` sends signals to processes. Despite the name, not all signals terminate — some just request a graceful shutdown.

```bash
# Graceful shutdown (SIGTERM, signal 15) — try this first
kill 1512

# Force kill (SIGKILL, signal 9) — when SIGTERM is ignored
kill -9 1512

# Send hangup signal (SIGHUP, signal 1) — many daemons reload config
kill -HUP 1512
```

The three signals you need to know:

| Signal | Number | Meaning | When to Use |
|--------|--------|---------|-------------|
| `SIGTERM` | 15 | Terminate gracefully | First attempt — lets the process clean up |
| `SIGKILL` | 9 | Force kill immediately | Process is stuck and ignoring SIGTERM |
| `SIGHUP` | 1 | Hang up / reload config | Reload Nginx, Traefik, or other daemons without downtime |

Kill by name instead of PID:

```bash
# Kill all processes named "python3"
killall python3

# Kill processes matching a pattern
pkill -f "backup-script.sh"

# Kill all processes owned by a user
pkill -u baduser
```

**Always try `SIGTERM` first.** `SIGKILL` does not let a process flush data to disk, close database connections, or clean up temporary files. Use it only when `SIGTERM` fails after 10 seconds.

### nice and renice — Set Process Priority

`nice` launches a process with a modified priority. `renice` changes the priority of a running process. Priority values range from -20 (highest priority) to 19 (lowest priority). Default is 0.

```bash
# Start a CPU-heavy backup at low priority so it doesn't starve other services
nice -n 15 /opt/scripts/backup.sh

# Check current nice value of a process
ps -o pid,ni,comm -p 1512
#   PID  NI COMMAND
#  1512   0 immich-server

# Lower the priority of a running process (higher nice = lower priority)
sudo renice 10 -p 1512
# 1512 (process ID) old priority 0, new priority 10

# Raise priority (only root can set negative nice values)
sudo renice -5 -p 482
```

## Understanding Process States

Every process has a state, shown in the `STAT` column of `ps aux`:

| Code | State | Meaning |
|------|-------|---------|
| `R` | Running | Currently executing or ready to execute |
| `S` | Sleeping | Waiting for an event (network request, timer, I/O) — normal for most services |
| `D` | Uninterruptible Sleep | Waiting on I/O (usually disk) — cannot be killed until I/O completes |
| `T` | Stopped | Paused by a signal (Ctrl+Z) or debugger |
| `Z` | Zombie | Finished but parent hasn't collected its exit status |

Additional modifiers:

| Modifier | Meaning |
|----------|---------|
| `s` | Session leader |
| `l` | Multi-threaded |
| `+` | In the foreground process group |
| `<` | High priority (negative nice value) |
| `N` | Low priority (positive nice value) |

A healthy server has mostly `S` (sleeping) processes with occasional `R` (running). Multiple `D` (uninterruptible sleep) processes indicate a disk I/O bottleneck. `Z` (zombie) processes are usually harmless but warrant investigation if they accumulate.

## Background vs Foreground Processes

When you run a command in your terminal, it runs in the **foreground** — it blocks your terminal until it finishes. For long-running tasks, you need to put them in the **background**.

```bash
# Run a command in the background with &
/opt/scripts/rebuild-index.sh &
# [1] 3847

# Check background jobs in this shell session
jobs
# [1]+  Running    /opt/scripts/rebuild-index.sh &

# Bring a background job to the foreground
fg %1

# Suspend a foreground process (pause it)
# Press Ctrl+Z
# [1]+  Stopped    /opt/scripts/rebuild-index.sh

# Resume it in the background
bg %1
# [1]+  /opt/scripts/rebuild-index.sh &
```

**The problem:** Background jobs started with `&` are still attached to your terminal session. If you close the SSH connection, the process dies. For persistent background tasks, use `nohup`, `disown`, `tmux`, or systemd.

## Using nohup and disown

### nohup — Immune to Hangup

`nohup` runs a command that survives SSH disconnection:

```bash
# Run a long task that persists after logout
nohup /opt/scripts/migrate-data.sh > /opt/scripts/migrate.log 2>&1 &
# [1] 4102

# Check it's running
ps aux | grep migrate-data
```

`nohup` redirects output to `nohup.out` by default. The example above redirects stdout and stderr to a specific log file instead, which is better for tracking.

### disown — Detach a Running Job

If you already started a process and forgot `nohup`, use `disown` to detach it:

```bash
# Start something without nohup
/opt/scripts/big-backup.sh &
# [1] 4200

# Detach it from the shell so it survives logout
disown %1

# Verify it's still running (it won't show in jobs anymore)
ps aux | grep big-backup
```

### When to Use What

| Scenario | Tool |
|----------|------|
| Quick one-off command that must survive SSH disconnect | `nohup cmd &` |
| Already running, need to detach before logout | `Ctrl+Z`, `bg`, `disown` |
| Interactive session that must persist across SSH reconnects | `tmux` or `screen` ([tmux and screen](/foundations/tmux-screen-basics/)) |
| Service that should always run and restart on crash | systemd ([systemd guide](/foundations/linux-systemd/)) |

**The recommendation:** For anything that needs to run permanently, use systemd. For interactive work sessions, use tmux. Reserve `nohup` and `disown` for one-off tasks like migrations and large backups.

## Process Priority and Nice Values

On a self-hosting server, you often run multiple services competing for the same CPU and RAM. Nice values let you tell the Linux scheduler which processes matter more.

### Practical Priority Strategy

| Process Type | Nice Value | Rationale |
|-------------|------------|-----------|
| Web-facing services (Nginx, Traefik) | 0 (default) | Users feel latency directly |
| Application containers (Immich, Nextcloud) | 0 (default) | Core services |
| Database containers (PostgreSQL, MariaDB) | 0 or -5 | Database slowness cascades to everything |
| Backup scripts | 10 to 15 | Important but not time-sensitive |
| Index rebuilds, media transcoding | 15 to 19 | CPU-heavy background work |
| Monitoring agents (Netdata, Prometheus) | 5 | Useful but should not compete with services |

Set nice values on Docker containers by passing `--cpu-shares` or using `cpuset` in Docker Compose, or by finding the container's main PID and using `renice`:

```bash
# Find the main PID of a Docker container
docker inspect --format '{{.State.Pid}}' immich-server
# 1512

# Lower its priority
sudo renice 5 -p 1512
```

For persistent priority control on Docker containers, use Docker Compose resource limits instead — see [Docker Performance Tuning](/foundations/docker-performance-tuning/).

## Monitoring Resource Usage per Process

### Memory

```bash
# Top 10 processes by memory usage
ps aux --sort=-%mem | head -11
```

Expected output:

```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
deploy    1512  1.0  3.9 1247200 312048 ?      Sl   Feb19   0:58 immich-server
999       1284  0.5  2.3  652840 185320 ?       Sl   Feb19   1:42 postgres
root       482  0.1  0.5 1894536 42816 ?       Ssl  Feb19   2:15 dockerd
deploy    1620  0.3  1.8  524288 145408 ?       Sl   Feb19   0:32 jellyfin
```

**Look at RSS, not VSZ.** VSZ (Virtual Size) includes memory that's allocated but not actually used. RSS (Resident Set Size) is the actual physical RAM consumed.

### CPU

```bash
# Top 10 processes by CPU usage
ps aux --sort=-%cpu | head -11

# Track a specific process's CPU over time (updates every 2 seconds)
pidstat -p 1512 2
```

### Disk I/O

```bash
# See which processes are doing the most disk I/O
sudo iotop -o
```

Install `iotop` if needed: `sudo apt install iotop -y`

### Combined Real-Time View

`htop` gives you CPU, memory, and process state in one screen. For per-container resource usage in Docker:

```bash
# Live resource usage for all Docker containers
docker stats
```

Expected output:

```
CONTAINER ID   NAME             CPU %   MEM USAGE / LIMIT     MEM %   NET I/O          BLOCK I/O
a1b2c3d4e5f6   immich-server    1.20%   298.5MiB / 7.68GiB   3.79%   12.8MB / 5.2MB   45MB / 120MB
f6e5d4c3b2a1   postgres         0.50%   181.2MiB / 7.68GiB   2.30%   8.4MB / 3.1MB    200MB / 85MB
b2c3d4e5f6a1   jellyfin         0.30%   142.1MiB / 7.68GiB   1.81%   45MB / 890MB     12MB / 5MB
```

## Zombie and Orphan Processes

### Zombie Processes

A zombie process has finished executing but its parent process has not yet read its exit status (via `wait()`). It consumes no CPU or memory — only a process table entry.

```bash
# Find zombie processes
ps aux | awk '$8 ~ /Z/ {print}'

# Count zombies
ps aux | awk '$8 ~ /Z/' | wc -l
```

A few zombies are harmless. They get cleaned up when their parent process exits or collects the status. Dozens or hundreds of zombies indicate a buggy parent process that is not reaping its children.

**How to fix zombies:**
1. You cannot kill a zombie directly — it is already dead
2. Find the parent: `ps -o ppid= -p <zombie_pid>`
3. Send SIGCHLD to the parent to remind it to reap: `kill -SIGCHLD <parent_pid>`
4. If that does not work, kill the parent process — the zombies become orphans and are adopted by PID 1 (init/systemd), which reaps them

### Orphan Processes

An orphan process is one whose parent has exited. The Linux init system (PID 1, usually systemd) automatically adopts orphaned processes and cleans them up when they finish. Orphans are not a problem — Linux handles them correctly.

## Practical Examples

### Finding the Resource Hog

Your server feels sluggish. Something is eating CPU or RAM:

```bash
# Quick check — what's using the most CPU right now?
ps aux --sort=-%cpu | head -6

# Quick check — what's using the most RAM?
ps aux --sort=-%mem | head -6

# Interactive investigation with htop
htop
# Press F6 to sort by PERCENT_MEM or PERCENT_CPU
# Press F5 for tree view to see which container spawned the hog
```

If a Docker container is the culprit:

```bash
# See which container is using the most resources
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

Expected output:

```
NAME              CPU %   MEM USAGE / LIMIT
immich-ml         85.20%  2.1GiB / 7.68GiB
immich-server     1.20%   298MiB / 7.68GiB
postgres          0.50%   181MiB / 7.68GiB
```

In this case, the Immich machine learning container is consuming 85% CPU (probably processing a photo library). That is expected behavior, but if it is interfering with other services, lower its priority:

```bash
PID=$(docker inspect --format '{{.State.Pid}}' immich-ml)
sudo renice 15 -p $PID
```

### Killing a Stuck Process

A container is unresponsive and `docker stop` hangs:

```bash
# Try graceful stop first (10 second timeout by default)
docker stop immich-server

# If it hangs, force kill
docker kill immich-server

# If even docker kill hangs, find the process and kill it directly
PID=$(docker inspect --format '{{.State.Pid}}' immich-server)
sudo kill $PID

# Nuclear option — force kill if SIGTERM is ignored
sudo kill -9 $PID
```

For a non-Docker process that is stuck:

```bash
# Find the PID
pgrep -a stuck-script
# 5432 /opt/scripts/stuck-script.sh

# Try graceful termination
kill 5432

# Wait 10 seconds. If still running:
kill -9 5432
```

### Running a Long Task Without Losing It

You need to run a database migration that takes hours:

```bash
# Option 1: nohup (simplest)
nohup /opt/scripts/migrate-db.sh > /opt/scripts/migrate.log 2>&1 &
echo "PID: $!"
# PID: 6100

# Check progress later (even from a new SSH session)
tail -f /opt/scripts/migrate.log

# Check if it's still running
ps -p 6100

# Option 2: tmux (interactive, recommended for complex tasks)
tmux new -s migration
/opt/scripts/migrate-db.sh
# Detach with Ctrl+B then D
# Reconnect later:
tmux attach -t migration
```

See [tmux and screen](/foundations/tmux-screen-basics/) for a full guide on terminal multiplexers.

**For recurring tasks**, do not use nohup or tmux. Create a systemd service or timer instead — see [systemd Services](/foundations/linux-systemd/).

## Common Mistakes

### Using kill -9 as the First Option

`SIGKILL` bypasses all cleanup routines. Databases may not flush writes to disk. Applications do not close network connections or release locks. **Always try `kill` (SIGTERM) first**, wait 10 seconds, then escalate to `kill -9` only if the process is truly stuck.

### Ignoring Load Average

The three numbers in `uptime` or at the top of `htop` show 1-minute, 5-minute, and 15-minute load averages. A load average higher than your CPU core count means processes are waiting for CPU time. On a 4-core server, a load average above 4.0 indicates contention. Check with:

```bash
# See core count and load average
nproc
# 4

uptime
# 10:35:42 up 1 day, load average: 5.82, 3.41, 2.10
```

A load average of 5.82 on a 4-core machine means processes are queuing. Find and fix the hog.

### Running Long Tasks in a Plain SSH Session

If you start a long-running process in a plain SSH session and your connection drops (network blip, laptop sleep, ISP outage), the process dies. Always use `nohup`, `tmux`, or systemd for anything that takes more than a few minutes.

### Not Monitoring for OOM Kills

When a server runs out of memory, the Linux OOM killer terminates processes to free RAM. It picks the biggest memory consumer, which is often your most important service. Check if OOM kills have happened:

```bash
dmesg | grep -i "oom"
sudo journalctl -k | grep -i "out of memory"
```

If you see OOM kills, either add more RAM, add swap space ([Linux Swap and Memory](/foundations/linux-swap-memory/)), or set Docker memory limits to control which containers get killed first.

### Confusing VSZ with Actual Memory Usage

`VSZ` in `ps` output is virtual memory — it includes mapped libraries and allocated-but-unused memory. A process with 2 GB VSZ might only use 200 MB of actual RAM. Always look at `RSS` (or `RES` in htop) for real memory consumption.

## FAQ

### How do I find which process is using a specific port?

Use `ss` or `lsof`:

```bash
# Find what's listening on port 8080
sudo ss -tlnp | grep 8080
# LISTEN  0  4096  *:8080  *:*  users:(("nginx",pid=1023,fd=6))

# Alternative with lsof
sudo lsof -i :8080
```

This is essential when a new container fails to start because the port is already in use.

### What is the difference between kill, killall, and pkill?

`kill` sends a signal to a specific PID. `killall` sends a signal to all processes with an exact name match. `pkill` sends a signal to processes matching a pattern. Use `kill` when you know the exact PID, `pkill -f` when you want to match a command string pattern.

### How many processes can a Linux server handle?

The default limit is 32,768 (check with `cat /proc/sys/kernel/pid_max`). A typical self-hosting server runs 100-300 processes. You will never hit the limit under normal use. If you see thousands of processes, something is spawning them uncontrollably — check for fork bombs or runaway scripts.

### Should I use htop or docker stats to monitor containers?

Both. `docker stats` shows resource usage per container with proper container names. `htop` in tree view (F5) shows the actual processes inside containers and their parent-child relationships. Use `docker stats` for a quick overview and `htop` for deep investigation.

### How do I automatically restart a crashed process?

Use systemd. Create a service unit file with `Restart=on-failure` and `RestartSec=5`. systemd will automatically restart the process if it exits with an error code. For Docker containers, use `restart: unless-stopped` in your Docker Compose file. See [systemd Services](/foundations/linux-systemd/) for the full setup.

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Systemd Services for Self-Hosting](/foundations/linux-systemd/)
- [Monitoring Your Home Server](/foundations/monitoring-basics/)
- [tmux and screen Basics](/foundations/tmux-screen-basics/)
- [Docker Performance Tuning](/foundations/docker-performance-tuning/)
- [Linux Swap and Memory Management](/foundations/linux-swap-memory/)
- [Container Logging and Debugging](/foundations/container-logging/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

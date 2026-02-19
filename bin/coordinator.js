#!/usr/bin/env node
/**
 * coordinator.js — Event-Driven Agent Coordinator
 *
 * Replaces the 5 looping systemd services (ceo, technology, marketing, operations, bi-finance)
 * with a single, lightweight dispatcher. Zero Claude API usage. Pure Node.js stdlib.
 *
 * HOW IT WORKS:
 *
 * 1. INBOX WATCHING (automatic for all agents)
 *    Watches inbox/ for any file modification. When inbox/marketing.md changes,
 *    starts the marketing agent. No configuration needed — new inbox file = new agent.
 *
 * 2. EVENT ROUTING (by filename convention)
 *    Watches events/ for new files. Files named {agent}-{type}-{ts}.json are routed
 *    to the matching agent. Any process can post events — coordinator routes them.
 *    Format: events/bi-finance-github-release-20260218T143000Z.json → bi-finance agent.
 *
 * 3. ADDITIONAL FILE WATCHES (from wake-on.conf)
 *    Each agent can optionally declare extra file watches in agents/{name}/wake-on.conf.
 *    Example: "watch: credentials/api-keys.env" → coordinator writes a credentials-updated
 *    event and starts the agent when that file changes.
 *
 * 4. 8-HOUR FALLBACK (safety net)
 *    Every agent runs at most once per 8h even if no events fire. Catches unknown unknowns.
 *
 * 5. SCHEDULED TASKS
 *    Runs check-releases.js hourly (ETag-based GitHub release checker — writes events when
 *    actual releases are detected, otherwise silent).
 *
 * ROBUSTNESS:
 *   - Crash recovery: on startup, scans events/ and checks inbox mtimes for missed events
 *   - PID liveness: checks if tracked PIDs are still alive on startup
 *   - No double-start: never starts an agent that is already running
 *   - Backoff: exponential backoff on repeated errors (30s → 60s → ... → 30min cap)
 *   - Orphan cleanup: kills child processes when stopping a running agent
 *   - Archive cleanup: events/archive/ capped at 10MB
 *   - Installs git hooks on startup
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ─── Constants ───────────────────────────────────────────────────────────────

const REPO_ROOT = '/opt/selfhosting-sh';
const INBOX_DIR = path.join(REPO_ROOT, 'inbox');
const EVENTS_DIR = path.join(REPO_ROOT, 'events');
const ARCHIVE_DIR = path.join(REPO_ROOT, 'events', 'archive');
const AGENTS_DIR = path.join(REPO_ROOT, 'agents');
const LOGS_DIR = path.join(REPO_ROOT, 'logs');
const STATE_FILE = path.join(LOGS_DIR, 'coordinator-state.json');
const COORDINATOR_LOG = path.join(LOGS_DIR, 'coordinator.log');
const RUN_AGENT_ONCE = path.join(REPO_ROOT, 'bin', 'run-agent-once.sh');
const CHECK_RELEASES = path.join(REPO_ROOT, 'bin', 'check-releases.js');
const HOOK_SOURCE = path.join(REPO_ROOT, 'bin', 'hooks', 'post-commit');
const HOOK_DEST = path.join(REPO_ROOT, '.git', 'hooks', 'post-commit');

const FALLBACK_INTERVAL_MS = 8 * 60 * 60 * 1000;       // 8 hours
const RELEASES_CHECK_INTERVAL_MS = 60 * 60 * 1000;      // 1 hour
const ARCHIVE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;     // 1 hour
const PERIODIC_CHECK_INTERVAL_MS = 5 * 60 * 1000;       // 5 minutes
const ARCHIVE_MAX_BYTES = 10 * 1024 * 1024;              // 10 MB
const ARCHIVE_TARGET_BYTES = 8 * 1024 * 1024;            // clean down to 8 MB
const WATCH_DEBOUNCE_MS = 2000;                           // 2s debounce on file events
const AGENT_MAX_RUNTIME = 3600;                           // 1 hour per iteration

// Backoff: 30s, 60s, 2m, 4m, 8m, 16m, 30m cap
const BACKOFF_BASE_MS = 30 * 1000;
const BACKOFF_MAX_MS = 30 * 60 * 1000;

// ─── State ────────────────────────────────────────────────────────────────────

// Discovered agents: { agentName → agentDirPath }
let agents = {};

// Runtime state (in-memory): { agentName → { pid, startTime, triggerEventPath, childProcess } }
const running = {};

// Pending triggers: { agentName → triggerEventPath | null }
// Stores the most recent event that arrived while an agent was already running
const pendingTriggers = {};

// Debounce timers: { watchKey → timeoutHandle }
const debounceTimers = {};

// Persisted state (saved to STATE_FILE):
// { agents: { name → { lastRun, consecutiveErrors, nextAllowedRun } }, lastReleasesCheck, lastArchiveCleanup,
//   pausedUntil (ISO string | null) — global pause when Claude Max session limit is hit }
let state = { agents: {}, lastReleasesCheck: null, lastArchiveCleanup: null, pausedUntil: null };

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    process.stdout.write(line);
    try {
        fs.appendFileSync(COORDINATOR_LOG, line);
    } catch (e) {
        // If we can't write to the log, at least we printed to stdout (journald captures it)
    }
}

// ─── State persistence ────────────────────────────────────────────────────────

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            state.agents = state.agents || {};
            if (state.pausedUntil === undefined) state.pausedUntil = null;
        }
    } catch (e) {
        log(`WARN state file corrupt, starting fresh: ${e.message}`);
        state = { agents: {}, lastReleasesCheck: null, lastArchiveCleanup: null, pausedUntil: null };
    }
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        log(`ERROR saving state: ${e.message}`);
    }
}

function getAgentState(name) {
    if (!state.agents[name]) {
        state.agents[name] = { lastRun: null, consecutiveErrors: 0, nextAllowedRun: null };
    }
    return state.agents[name];
}

// ─── Agent discovery ──────────────────────────────────────────────────────────

function discoverAgents() {
    const found = {};

    // CEO: special case — CLAUDE.md lives at repo root, not in agents/ceo/
    if (fs.existsSync(path.join(REPO_ROOT, 'CLAUDE.md'))) {
        found['ceo'] = REPO_ROOT;
    }

    // Department heads: agents/*/CLAUDE.md
    if (fs.existsSync(AGENTS_DIR)) {
        for (const name of fs.readdirSync(AGENTS_DIR)) {
            const agentDir = path.join(AGENTS_DIR, name);
            try {
                if (fs.statSync(agentDir).isDirectory() &&
                    fs.existsSync(path.join(agentDir, 'CLAUDE.md'))) {
                    found[name] = agentDir;
                }
            } catch (e) { /* skip */ }
        }
    }

    log(`AGENTS discovered: ${Object.keys(found).join(', ')}`);
    return found;
}

// Sort agent names by length descending for unambiguous prefix matching
// (prevents 'bi' from matching before 'bi-finance')
function agentNamesSorted() {
    return Object.keys(agents).sort((a, b) => b.length - a.length);
}

// Route an event filename to its intended agent
function routeEventFile(filename) {
    for (const name of agentNamesSorted()) {
        if (filename.startsWith(name + '-')) return name;
    }
    return null;
}

// ─── Git hook installation ────────────────────────────────────────────────────

function installGitHook() {
    try {
        if (!fs.existsSync(HOOK_SOURCE)) {
            log('WARN git hook source not found at bin/hooks/post-commit — skipping install');
            return;
        }
        const hookContent = fs.readFileSync(HOOK_SOURCE);
        let needsInstall = true;
        if (fs.existsSync(HOOK_DEST)) {
            const existing = fs.readFileSync(HOOK_DEST);
            needsInstall = !existing.equals(hookContent);
        }
        if (needsInstall) {
            fs.mkdirSync(path.dirname(HOOK_DEST), { recursive: true });
            fs.writeFileSync(HOOK_DEST, hookContent, { mode: 0o755 });
            log('HOOK installed bin/hooks/post-commit → .git/hooks/post-commit');
        }
    } catch (e) {
        log(`ERROR installing git hook: ${e.message}`);
    }
}

// ─── wake-on.conf loading ─────────────────────────────────────────────────────

function loadWakeConf(agentName, agentDir) {
    const confPath = path.join(agentDir, 'wake-on.conf');
    if (!fs.existsSync(confPath)) return [];

    const watches = [];
    try {
        const lines = fs.readFileSync(confPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1) continue;
            const directive = trimmed.slice(0, colonIdx).trim();
            const value = trimmed.slice(colonIdx + 1).trim();
            if (directive === 'watch') {
                watches.push({ agentName, filePath: path.join(REPO_ROOT, value) });
            }
        }
    } catch (e) {
        log(`WARN failed to load wake-on.conf for ${agentName}: ${e.message}`);
    }
    return watches;
}

// ─── Backoff ──────────────────────────────────────────────────────────────────

function getBackoffMs(consecutiveErrors) {
    if (consecutiveErrors <= 0) return 0;
    return Math.min(BACKOFF_BASE_MS * Math.pow(2, consecutiveErrors - 1), BACKOFF_MAX_MS);
}

// ─── Usage limit detection ────────────────────────────────────────────────────

// Parse "resets Feb 19, 4pm (UTC)" from Claude's limit error message.
// Returns a Date or null.
function parseResetTime(output) {
    // Pattern: "resets [Month] [day], [hour][am/pm] (UTC)"
    const m = output.match(/resets\s+(\w+ \d+),\s*(\d+(?::\d+)?(?:am|pm))\s*\(UTC\)/i);
    if (!m) return null;
    try {
        const year = new Date().getUTCFullYear();
        const parsed = new Date(`${m[1]}, ${year} ${m[2]} UTC`);
        if (isNaN(parsed.getTime())) return null;
        // If the parsed time is in the past (e.g., we're parsing Dec date in Jan), advance year
        if (parsed.getTime() < Date.now()) parsed.setUTCFullYear(year + 1);
        return parsed;
    } catch (e) {
        return null;
    }
}

function applyUsageLimitPause(output, agentName) {
    const resetTime = parseResetTime(output);
    const pauseUntil = resetTime || new Date(Date.now() + 5 * 60 * 60 * 1000); // fallback: +5h
    state.pausedUntil = pauseUntil.toISOString();
    saveState();
    const source = resetTime ? `parsed from error message` : `fallback +5h`;
    log(`LIMIT ${agentName} hit Claude Max session limit — pausing ALL agents until ${state.pausedUntil} (${source})`);
}

function isGloballyPaused() {
    if (!state.pausedUntil) return false;
    if (new Date(state.pausedUntil).getTime() <= Date.now()) {
        log('RESUMED global pause expired — resuming agents');
        state.pausedUntil = null;
        saveState();
        return false;
    }
    return true;
}

function checkUnpauseEvent(filename) {
    // Manual override: drop events/coordinator-unpause-{ts}.json to clear pause immediately
    if (!filename.startsWith('coordinator-unpause-')) return false;
    log('UNPAUSE manual unpause event received — clearing global pause');
    state.pausedUntil = null;
    saveState();
    // Archive the event so it doesn't re-trigger
    const filePath = path.join(EVENTS_DIR, filename);
    if (fs.existsSync(filePath)) archiveEvent(filePath);
    return true;
}

// ─── Core: starting an agent ──────────────────────────────────────────────────

function tryStartAgent(agentName, triggerEventPath, reason) {
    // Unknown agent
    if (!agents[agentName]) {
        log(`WARN unknown agent "${agentName}" — ignoring`);
        return;
    }

    // Already running: queue the trigger (one pending max — latest wins)
    if (running[agentName]) {
        pendingTriggers[agentName] = triggerEventPath || null;
        const reasonStr = reason || (triggerEventPath ? path.basename(triggerEventPath) : 'unknown');
        log(`QUEUED ${agentName} already running — trigger queued: ${reasonStr}`);
        return;
    }

    // Global pause: Claude Max session limit hit — wait until reset
    if (isGloballyPaused()) {
        const msLeft = new Date(state.pausedUntil).getTime() - Date.now();
        const minsLeft = Math.round(msLeft / 60000);
        log(`PAUSED ${agentName} — session limit active, ${minsLeft}min until ${state.pausedUntil}`);
        // Queue the trigger so it fires when the pause lifts
        pendingTriggers[agentName] = triggerEventPath || pendingTriggers[agentName] || null;
        // Schedule a retry when the pause expires
        setTimeout(() => tryStartAgent(agentName, pendingTriggers[agentName], reason), msLeft + 5000);
        return;
    }

    // Backoff check
    const agentState = getAgentState(agentName);
    if (agentState.nextAllowedRun) {
        const waitMs = new Date(agentState.nextAllowedRun) - Date.now();
        if (waitMs > 0) {
            log(`BACKOFF ${agentName} in backoff for ${Math.round(waitMs / 1000)}s more`);
            // Schedule a retry when backoff expires
            setTimeout(() => tryStartAgent(agentName, triggerEventPath, reason), waitMs + 100);
            return;
        }
    }

    spawnAgent(agentName, triggerEventPath, reason);
}

function spawnAgent(agentName, triggerEventPath, reason) {
    const agentDir = agents[agentName];
    const triggerStr = reason || (triggerEventPath ? path.basename(triggerEventPath) : '24h-fallback');

    log(`AGENT ${agentName} starting (trigger: ${triggerStr})`);

    const env = {
        ...process.env,
        HOME: '/home/selfhosting',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        HTTPS_PROXY: 'http://127.0.0.1:3128',
    };
    if (triggerEventPath) env.TRIGGER_EVENT = triggerEventPath;
    if (reason && !triggerEventPath) env.TRIGGER_REASON = reason;

    // Capture stdout+stderr to detect "hit your limit" while still forwarding to journald
    const child = spawn('bash', [RUN_AGENT_ONCE, agentDir, String(AGENT_MAX_RUNTIME)], {
        env,
        detached: false,   // keep as our child so we can kill it and its descendants
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Buffer last 16KB of output for limit detection; forward everything to journald via our stdout
    const OUTPUT_BUFFER_MAX = 16 * 1024;
    let outputBuffer = '';
    function onData(chunk) {
        const text = chunk.toString();
        process.stdout.write(text); // forward to journald
        outputBuffer += text;
        if (outputBuffer.length > OUTPUT_BUFFER_MAX) {
            outputBuffer = outputBuffer.slice(outputBuffer.length - OUTPUT_BUFFER_MAX);
        }
    }
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    running[agentName] = {
        pid: child.pid,
        startTime: Date.now(),
        triggerEventPath,
        child,
    };
    log(`AGENT ${agentName} started (pid: ${child.pid})`);

    child.on('error', (err) => {
        log(`ERROR ${agentName} failed to spawn: ${err.message}`);
        delete running[agentName];
        handleAgentExit(agentName, 1, triggerEventPath, outputBuffer);
    });

    child.on('exit', (code, signal) => {
        const durationSec = Math.round((Date.now() - running[agentName]?.startTime) / 1000);
        const exitDesc = signal ? `signal=${signal}` : `code=${code}`;
        log(`AGENT ${agentName} exited (${exitDesc}, duration: ${durationSec}s)`);
        delete running[agentName];
        handleAgentExit(agentName, code, triggerEventPath, outputBuffer);
    });
}

function handleAgentExit(agentName, exitCode, triggerEventPath, outputBuffer) {
    const agentState = getAgentState(agentName);
    const now = new Date().toISOString();
    const output = outputBuffer || '';

    // Archive the triggering event now that the agent has processed it
    if (triggerEventPath && fs.existsSync(triggerEventPath)) {
        archiveEvent(triggerEventPath);
    }

    // Also archive any other events for this agent that are sitting in events/
    archiveAgentEvents(agentName);

    if (exitCode === 0 || exitCode === 124) {
        // 0 = success, 124 = timeout (hit max runtime — counts as a successful run)
        agentState.lastRun = now;
        agentState.consecutiveErrors = 0;
        agentState.nextAllowedRun = null;
        log(`STATE ${agentName} lastRun updated, errors reset`);
    } else if (exitCode === 1 && output.includes('hit your limit')) {
        // Claude Max session limit hit — pause globally, don't count as agent error
        applyUsageLimitPause(output, agentName);
        // Don't increment consecutiveErrors — this isn't the agent's fault
        agentState.lastRun = now; // record the run so 8h fallback doesn't fire immediately after unpause
    } else if (exitCode === 3) {
        // Model fallback detected by run-agent-once.sh (Haiku/Sonnet served instead of Opus)
        log(`MODEL_FALLBACK ${agentName} — server served wrong model. Pausing ALL agents for 5h.`);
        state.pausedUntil = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
        saveState();
        agentState.lastRun = now;
    } else {
        // Error: apply backoff
        agentState.consecutiveErrors = (agentState.consecutiveErrors || 0) + 1;
        const backoffMs = getBackoffMs(agentState.consecutiveErrors);
        agentState.nextAllowedRun = new Date(Date.now() + backoffMs).toISOString();
        log(`BACKOFF ${agentName} error #${agentState.consecutiveErrors}, next allowed in ${Math.round(backoffMs / 1000)}s`);
    }

    saveState();

    // If a trigger arrived while we were running, process it now
    if (pendingTriggers.hasOwnProperty(agentName)) {
        const pendingTrigger = pendingTriggers[agentName];
        delete pendingTriggers[agentName];
        log(`PENDING ${agentName} processing queued trigger`);
        tryStartAgent(agentName, pendingTrigger, 'pending-trigger');
    }
}

// ─── Archive management ───────────────────────────────────────────────────────

function archiveEvent(filePath) {
    try {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
        const dest = path.join(ARCHIVE_DIR, path.basename(filePath));
        fs.renameSync(filePath, dest);
    } catch (e) {
        // rename can fail if src was already moved; silently ignore
    }
}

function archiveAgentEvents(agentName) {
    try {
        if (!fs.existsSync(EVENTS_DIR)) return;
        for (const file of fs.readdirSync(EVENTS_DIR)) {
            if (file.startsWith(agentName + '-') && file.endsWith('.json')) {
                archiveEvent(path.join(EVENTS_DIR, file));
            }
        }
    } catch (e) {
        log(`WARN archiving events for ${agentName}: ${e.message}`);
    }
}

function cleanupArchive() {
    try {
        if (!fs.existsSync(ARCHIVE_DIR)) return;
        const size = dirSize(ARCHIVE_DIR);
        if (size <= ARCHIVE_MAX_BYTES) return;

        const files = fs.readdirSync(ARCHIVE_DIR)
            .map(f => {
                const fp = path.join(ARCHIVE_DIR, f);
                return { fp, mtime: fs.statSync(fp).mtimeMs, size: fs.statSync(fp).size };
            })
            .sort((a, b) => a.mtime - b.mtime); // oldest first

        let current = size;
        for (const file of files) {
            if (current <= ARCHIVE_TARGET_BYTES) break;
            fs.unlinkSync(file.fp);
            current -= file.size;
            log(`ARCHIVE deleted old event: ${path.basename(file.fp)}`);
        }
        log(`ARCHIVE cleanup complete — size now ~${Math.round(current / 1024)}KB`);
    } catch (e) {
        log(`ERROR archive cleanup: ${e.message}`);
    }
}

function dirSize(dir) {
    let total = 0;
    try {
        for (const f of fs.readdirSync(dir)) {
            try { total += fs.statSync(path.join(dir, f)).size; } catch (e) { /* skip */ }
        }
    } catch (e) { /* skip */ }
    return total;
}

// ─── File watchers ────────────────────────────────────────────────────────────

function debounce(key, fn) {
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(() => {
        delete debounceTimers[key];
        fn();
    }, WATCH_DEBOUNCE_MS);
}

function watchInbox() {
    if (!fs.existsSync(INBOX_DIR)) {
        log('WARN inbox/ does not exist yet — will retry in 30s');
        setTimeout(watchInbox, 30000);
        return;
    }
    fs.watch(INBOX_DIR, (event, filename) => {
        if (!filename || !filename.endsWith('.md')) return;
        const agentName = filename.replace(/\.md$/, '');
        debounce(`inbox:${agentName}`, () => {
            log(`INBOX ${filename} modified → ${agentName}`);
            tryStartAgent(agentName, null, 'inbox-message');
        });
    });
    log(`WATCH inbox/ (agents: ${Object.keys(agents).join(', ')})`);
}

function watchEventsDir() {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
    fs.watch(EVENTS_DIR, (event, filename) => {
        if (!filename || !filename.endsWith('.json')) return;
        const filePath = path.join(EVENTS_DIR, filename);
        debounce(`event:${filename}`, () => {
            if (!fs.existsSync(filePath)) return; // already archived
            // Handle coordinator-level events first (not agent triggers)
            if (checkUnpauseEvent(filename)) return;
            const agentName = routeEventFile(filename);
            if (!agentName) {
                log(`EVENT ${filename} → no matching agent (unrouted)`);
                return;
            }
            log(`EVENT ${filename} → ${agentName}`);
            tryStartAgent(agentName, filePath, null);
        });
    });
    log('WATCH events/ (routing by filename convention)');
}

function watchAdditionalFiles() {
    for (const [agentName, agentDir] of Object.entries(agents)) {
        const watches = loadWakeConf(agentName, agentDir);
        for (const { filePath } of watches) {
            if (!fs.existsSync(filePath)) {
                log(`WATCH ${agentName} declared ${filePath} but file does not exist yet — will watch parent dir`);
            }
            const watchTarget = fs.existsSync(filePath) ? filePath : path.dirname(filePath);
            try {
                fs.watch(watchTarget, (event, changedFile) => {
                    // If watching directory, filter to the specific file
                    if (changedFile && path.join(path.dirname(filePath), changedFile) !== filePath) return;
                    debounce(`wakeconf:${agentName}:${filePath}`, () => {
                        if (!fs.existsSync(filePath)) return;
                        log(`FILEWATCH ${path.basename(filePath)} changed → ${agentName}`);
                        // Write a coordinator-generated event for auditability
                        writeCoordinatorEvent(agentName, 'file-changed', { file: path.basename(filePath) });
                    });
                });
                log(`WATCH ${path.relative(REPO_ROOT, filePath)} (${agentName}, from wake-on.conf)`);
            } catch (e) {
                log(`WARN could not watch ${filePath} for ${agentName}: ${e.message}`);
            }
        }
    }
}

function writeCoordinatorEvent(agentName, type, data) {
    const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15) + 'Z';
    const filename = `${agentName}-${type}-${ts}.json`;
    const filePath = path.join(EVENTS_DIR, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify({ type, ...data, ts: new Date().toISOString() }, null, 2));
        // The events/ watcher will pick this up and route it
    } catch (e) {
        log(`ERROR writing coordinator event: ${e.message}`);
    }
}

// ─── Crash recovery ───────────────────────────────────────────────────────────

function recoverFromCrash() {
    log('RECOVERY scanning for missed events and stale state...');
    let recovered = 0;

    // Check if any tracked PIDs are still alive (coordinator restarted while agent ran)
    for (const [name, agentState] of Object.entries(state.agents)) {
        // We lost the PID on restart; conservatively assume agents are not running
        // (they'll restart on next event or fallback)
    }

    // Scan events/ for unprocessed event files
    if (fs.existsSync(EVENTS_DIR)) {
        for (const filename of fs.readdirSync(EVENTS_DIR)) {
            if (!filename.endsWith('.json')) continue;
            const agentName = routeEventFile(filename);
            if (agentName) {
                const filePath = path.join(EVENTS_DIR, filename);
                log(`RECOVERY found unprocessed event: ${filename} → ${agentName}`);
                // Small delay to let watchers initialize first
                setTimeout(() => tryStartAgent(agentName, filePath, null), 2000 + recovered * 500);
                recovered++;
            }
        }
    }

    // Check inbox modification times against lastRun — if inbox was modified after lastRun, start agent
    if (fs.existsSync(INBOX_DIR)) {
        for (const filename of fs.readdirSync(INBOX_DIR)) {
            if (!filename.endsWith('.md')) continue;
            const agentName = filename.replace(/\.md$/, '');
            if (!agents[agentName]) continue;
            try {
                const inboxMtime = fs.statSync(path.join(INBOX_DIR, filename)).mtime;
                const agentState = getAgentState(agentName);
                const lastRun = agentState.lastRun ? new Date(agentState.lastRun) : null;
                if (!lastRun || inboxMtime > lastRun) {
                    log(`RECOVERY ${agentName} inbox modified since last run — starting`);
                    setTimeout(() => tryStartAgent(agentName, null, 'inbox-missed'), 3000 + recovered * 500);
                    recovered++;
                }
            } catch (e) { /* skip */ }
        }
    }

    log(`RECOVERY complete — ${recovered} missed event(s) found`);
}

// ─── Scheduled tasks ──────────────────────────────────────────────────────────

function checkFallbacks() {
    const now = Date.now();
    for (const [agentName] of Object.entries(agents)) {
        if (running[agentName]) continue; // already running
        const agentState = getAgentState(agentName);
        const lastRun = agentState.lastRun ? new Date(agentState.lastRun).getTime() : 0;
        if (now - lastRun >= FALLBACK_INTERVAL_MS) {
            log(`FALLBACK ${agentName} — ${Math.round((now - lastRun) / 3600000)}h since last run`);
            tryStartAgent(agentName, null, '8h-fallback');
        }
    }
}

function runCheckReleases() {
    const now = Date.now();
    const lastCheck = state.lastReleasesCheck ? new Date(state.lastReleasesCheck).getTime() : 0;
    if (now - lastCheck < RELEASES_CHECK_INTERVAL_MS) return;

    log('RELEASES running check-releases.js');
    state.lastReleasesCheck = new Date().toISOString();
    saveState();

    const child = spawn('node', [CHECK_RELEASES], {
        env: { ...process.env, HOME: '/home/selfhosting' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', d => log(`RELEASES ${d.toString().trim()}`));
    child.stderr.on('data', d => log(`RELEASES ERR ${d.toString().trim()}`));
    child.on('exit', code => log(`RELEASES check-releases.js exited (code: ${code})`));
}

function runArchiveCleanup() {
    const now = Date.now();
    const lastCleanup = state.lastArchiveCleanup ? new Date(state.lastArchiveCleanup).getTime() : 0;
    if (now - lastCleanup < ARCHIVE_CLEANUP_INTERVAL_MS) return;

    cleanupArchive();
    state.lastArchiveCleanup = new Date().toISOString();
    saveState();
}

// ─── Startup ──────────────────────────────────────────────────────────────────

function ensureDirectories() {
    for (const dir of [EVENTS_DIR, ARCHIVE_DIR, LOGS_DIR]) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function start() {
    log('='.repeat(60));
    log('STARTUP coordinator v1.1 (8h-fallback, usage-limit-detection)');

    ensureDirectories();
    loadState();
    agents = discoverAgents();
    installGitHook();

    watchInbox();
    watchEventsDir();
    watchAdditionalFiles();

    // Give watchers a moment to initialize, then run crash recovery
    setTimeout(recoverFromCrash, 1000);

    // Periodic checks: 8h fallbacks + releases + cleanup + pause expiry
    setInterval(() => {
        isGloballyPaused(); // side-effect: clears expired pause and logs
        checkFallbacks();
        runCheckReleases();
        runArchiveCleanup();
    }, PERIODIC_CHECK_INTERVAL_MS);

    // Also run an immediate fallback check after startup (catches long-dormant agents)
    setTimeout(checkFallbacks, 5000);

    log('STARTUP complete — watching for events');
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
    log(`SHUTDOWN received ${signal} — stopping running agents`);
    for (const [name, info] of Object.entries(running)) {
        log(`SHUTDOWN killing ${name} (pid: ${info.pid})`);
        try {
            // Kill the agent and its child processes (sub-agents spawned within the claude session)
            process.kill(-info.child.pid, 'SIGTERM');
        } catch (e) {
            try { process.kill(info.child.pid, 'SIGTERM'); } catch (e2) { /* already gone */ }
        }
    }
    saveState();
    setTimeout(() => process.exit(0), 3000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    log(`UNCAUGHT ${err.message}\n${err.stack}`);
    // Don't crash the coordinator on unexpected errors — log and continue
});
process.on('unhandledRejection', (reason) => {
    log(`UNHANDLED_REJECTION ${reason}`);
});

// ─── Run ──────────────────────────────────────────────────────────────────────
start();

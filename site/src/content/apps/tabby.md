---
title: "How to Self-Host Tabby with Docker Compose"
description: "Deploy Tabby with Docker for self-hosted AI code completion. Repository indexing, IDE integration, and team management setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-machine-learning"
apps:
  - tabby
tags:
  - self-hosted
  - tabby
  - docker
  - ai
  - code-completion
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Tabby?

[Tabby](https://tabby.tabbyml.com/) is a self-hosted AI code completion server. It runs a code-specific language model on your infrastructure and serves completions to IDE extensions (VS Code, JetBrains, Vim/Neovim). Tabby indexes your repositories for context-aware suggestions and includes an admin dashboard for managing users and monitoring usage. Think of it as a self-hosted GitHub Copilot alternative.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- NVIDIA GPU with 4+ GB VRAM (recommended) or CPU mode (slower)
- 8 GB+ RAM
- 10 GB+ free disk space
- NVIDIA Container Toolkit (for GPU mode)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  tabby:
    image: tabbyml/tabby:v0.32.0
    container_name: tabby
    ports:
      - "8080:8080"
    volumes:
      - tabby_data:/data
    command: serve --model StarCoder-1B --device cuda
    # For CPU-only mode, use:
    # command: serve --model StarCoder-1B --device cpu
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  tabby_data:
```

Start the stack:

```bash
docker compose up -d
```

Tabby downloads the model on first start (StarCoder-1B is ~2 GB).

## Initial Setup

1. Open `http://your-server:8080` in your browser
2. Create your admin account on first visit
3. Go to **Settings** → **Repository** to add your code repositories
4. Install the Tabby extension in your IDE

### IDE Extension Setup

**VS Code:**
1. Install "Tabby" from the VS Code Marketplace
2. Open Settings → search for "Tabby"
3. Set Server Endpoint to `http://your-server:8080`

**JetBrains:**
1. Install "Tabby" from the JetBrains Plugin Marketplace
2. Go to Settings → Tools → Tabby
3. Set Server Endpoint to `http://your-server:8080`

**Vim/Neovim:**
Install `TabbyML/vim-tabby` plugin and configure the endpoint.

## Configuration

### Model Selection

| Model | VRAM Required | Quality | Speed |
|-------|-------------|---------|-------|
| `StarCoder-1B` | ~2 GB | Good | Very fast |
| `StarCoder-3B` | ~4 GB | Better | Fast |
| `StarCoder-7B` | ~8 GB | Best built-in | Moderate |
| `CodeLlama-7B` | ~8 GB | Best overall | Moderate |
| `DeepSeek-Coder-1.3B` | ~2 GB | Good | Very fast |

Change the model in the `command` field:

```yaml
command: serve --model CodeLlama-7B --device cuda
```

### Repository Indexing

Add repositories through the admin dashboard for context-aware completions:
1. Go to Settings → Repository
2. Add Git repository URLs
3. Tabby indexes the code and uses it as context for completions

### Key CLI Arguments

| Argument | Description |
|----------|-------------|
| `--model MODEL` | Code completion model to serve |
| `--chat-model MODEL` | Separate model for chat (optional) |
| `--device cuda/cpu` | Inference device |
| `--port PORT` | Server port (default: 8080) |
| `--parallelism N` | Max concurrent completion requests |

## Advanced Configuration

### Separate Chat Model

Use a larger model for chat while keeping a fast small model for completions:

```yaml
command: >
  serve
  --model StarCoder-1B
  --chat-model CodeLlama-7B-Instruct
  --device cuda
```

### Using an External LLM Backend

Tabby can connect to Ollama or other OpenAI-compatible APIs instead of serving models itself:

```yaml
command: serve --device cpu
environment:
  - TABBY_LLM_ENDPOINT=http://ollama:11434
```

## Reverse Proxy

Configure your reverse proxy to forward to port 8080. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the Tabby data volume:

```bash
docker run --rm -v tabby_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/tabby-backup.tar.gz /data
```

This contains user accounts, repository indexes, and configuration. Models can be re-downloaded. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Completions Are Slow

**Symptom:** Code completions take 2+ seconds.
**Fix:** Use a smaller model (StarCoder-1B or DeepSeek-Coder-1.3B). Ensure GPU mode is active (`--device cuda`). Check that the NVIDIA Container Toolkit is installed.

### GPU Not Detected

**Symptom:** Container falls back to CPU mode.
**Fix:** Verify `nvidia-smi` works on the host. Ensure `deploy.resources.reservations.devices` is set in docker-compose.yml. Install NVIDIA Container Toolkit if missing.

### IDE Extension Not Connecting

**Symptom:** Extension shows "disconnected" status.
**Fix:** Verify the server URL is correct and accessible. Check firewall rules for port 8080. If using a reverse proxy, ensure it's forwarding correctly.

### No Context-Aware Completions

**Symptom:** Completions don't reference your codebase.
**Fix:** Add your repositories in Settings → Repository. Wait for indexing to complete (check the admin dashboard for status). Ensure the repository URL is accessible from the Tabby container.

## Resource Requirements

- **VRAM:** 2 GB (1B models), 4 GB (3B models), 8 GB (7B models)
- **RAM:** 4-8 GB system RAM
- **CPU:** Low-medium (GPU does the heavy lifting)
- **Disk:** 2-10 GB per model + repository index size

## Verdict

Tabby is the best self-hosted code completion server for teams. The admin dashboard, user management, repository indexing, and usage analytics make it a proper enterprise-ready tool. The trade-off is that it requires a dedicated GPU for reasonable performance, and the model selection is more limited than using a general-purpose LLM backend like Ollama.

**Choose Tabby** for a centralized code AI server for your team. **Choose Continue.dev + [Ollama](/apps/ollama)** if you want more flexibility and don't need centralized management.

## Related

- [Tabby vs Continue](/compare/tabby-vs-continue)
- [How to Self-Host Ollama](/apps/ollama)
- [Ollama vs vLLM](/compare/ollama-vs-vllm)
- [Self-Hosted GitHub Copilot Alternatives](/replace/github-copilot)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Hardware for Self-Hosted AI](/hardware/ai-ml-hardware)

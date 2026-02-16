---
title: "How to Self-Host Ollama with Docker Compose"
description: "Run large language models locally with Ollama and Docker Compose. Complete setup guide with GPU passthrough, model management, and API configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ai-ml"
apps:
  - ollama
tags:
  - self-hosted
  - ollama
  - docker
  - ai
  - llm
  - machine-learning
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Ollama?

[Ollama](https://ollama.com) is a local LLM runtime that lets you run large language models like Llama 3, Mistral, Gemma, and dozens more on your own hardware. It handles model downloading, quantization, GPU acceleration, and serves an OpenAI-compatible REST API. Think of it as the Docker of LLMs — pull a model, run it, interact with it through an API or CLI.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 8 GB of RAM minimum (16 GB+ recommended for larger models)
- 20-50 GB of free disk space for models
- NVIDIA GPU with CUDA support (optional but strongly recommended for performance)
- If using GPU: NVIDIA drivers 531+ and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed

## Docker Compose Configuration

Create a `docker-compose.yml` file:

### CPU-Only Setup

```yaml
services:
  ollama:
    image: ollama/ollama:0.16.1
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      # Stores downloaded models and configuration
      - ollama_data:/root/.ollama
    environment:
      # How long to keep models loaded in memory (default 5m, use -1 for always)
      - OLLAMA_KEEP_ALIVE=5m
      # Maximum parallel requests per model
      - OLLAMA_NUM_PARALLEL=1
      # Allow connections from other containers
      - OLLAMA_ORIGINS=*
    restart: unless-stopped

volumes:
  ollama_data:
```

### With NVIDIA GPU

```yaml
services:
  ollama:
    image: ollama/ollama:0.16.1
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_KEEP_ALIVE=5m
      # Increase parallel requests when GPU is available
      - OLLAMA_NUM_PARALLEL=4
      # Limit to 1 model loaded at a time (saves VRAM)
      - OLLAMA_MAX_LOADED_MODELS=1
      # Enable flash attention for better performance
      - OLLAMA_FLASH_ATTENTION=1
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ollama_data:
```

### With AMD GPU (ROCm)

```yaml
services:
  ollama:
    image: ollama/ollama:rocm
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    devices:
      - /dev/kfd
      - /dev/dri
    environment:
      - OLLAMA_KEEP_ALIVE=5m
      - OLLAMA_NUM_PARALLEL=4
      - OLLAMA_ORIGINS=*
    restart: unless-stopped

volumes:
  ollama_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Ollama starts with no models. Pull your first model:

```bash
# Pull Llama 3.1 8B (4.7 GB)
docker exec ollama ollama pull llama3.1

# Pull a smaller model for testing (2 GB)
docker exec ollama ollama pull phi3:mini
```

Test it works:

```bash
# Interactive chat
docker exec -it ollama ollama run llama3.1

# API request
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "What is self-hosting?",
  "stream": false
}'
```

List downloaded models:

```bash
docker exec ollama ollama list
```

## Configuration

### Key Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_KEEP_ALIVE` | `5m` | Time to keep models in memory. Use `-1` for always, `0` to unload immediately |
| `OLLAMA_NUM_PARALLEL` | `1` | Max concurrent requests per model. Increase with GPU |
| `OLLAMA_MAX_LOADED_MODELS` | `0` (unlimited) | Max models loaded simultaneously. Set to `1` on limited VRAM |
| `OLLAMA_MAX_QUEUE` | `512` | Maximum queued requests |
| `OLLAMA_ORIGINS` | `localhost only` | CORS origins. Set to `*` for container access |
| `OLLAMA_FLASH_ATTENTION` | disabled | Enable flash attention (reduces VRAM, improves speed) |
| `OLLAMA_CONTEXT_LENGTH` | auto | Override default context window (e.g., `8192`) |
| `OLLAMA_HOST` | `0.0.0.0:11434` | Bind address (already set correctly in Docker image) |

### Model Management

```bash
# Pull a model
docker exec ollama ollama pull mistral

# Remove a model to free disk space
docker exec ollama ollama rm mistral

# Show model details
docker exec ollama ollama show llama3.1

# Copy/rename a model
docker exec ollama ollama cp llama3.1 my-custom-model
```

### Popular Models

| Model | Size | Use Case |
|-------|------|----------|
| `llama3.1` | 4.7 GB | General purpose, good balance |
| `llama3.1:70b` | 40 GB | High quality, needs 48 GB+ VRAM |
| `mistral` | 4.1 GB | Fast, good for coding |
| `codellama` | 3.8 GB | Code generation and completion |
| `phi3:mini` | 2.0 GB | Lightweight, good for low-resource servers |
| `gemma2` | 5.4 GB | Google's model, strong reasoning |
| `deepseek-coder-v2` | 8.9 GB | Code-focused, excellent quality |

### Creating Custom Models

Create a `Modelfile` to customize model behavior:

```
FROM llama3.1
PARAMETER temperature 0.7
PARAMETER num_ctx 8192
SYSTEM "You are a helpful assistant specialized in Linux system administration."
```

```bash
docker exec ollama ollama create sysadmin-helper -f /path/to/Modelfile
```

## Advanced Configuration (Optional)

### GPU Selection

If you have multiple NVIDIA GPUs, select specific ones:

```yaml
environment:
  - CUDA_VISIBLE_DEVICES=0,1  # Use GPU 0 and 1 only
```

### Spread Model Across Multiple GPUs

```yaml
environment:
  - OLLAMA_SCHED_SPREAD=1  # Distribute model layers across all GPUs
```

### KV Cache Quantization (Save VRAM)

```yaml
environment:
  - OLLAMA_KV_CACHE_TYPE=q8_0  # Options: f16 (default), q8_0, q4_0
```

Using `q8_0` reduces VRAM usage with minimal quality loss. `q4_0` saves more VRAM but may impact output quality.

### Connecting to Open WebUI

Ollama's API is designed to work with web interfaces. The most popular is [Open WebUI](/apps/open-webui):

```yaml
services:
  ollama:
    image: ollama/ollama:0.16.1
    container_name: ollama
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  open-webui:
    image: ghcr.io/open-webui/open-webui:v0.8.2
    container_name: open-webui
    ports:
      - "3000:8080"
    volumes:
      - open-webui_data:/app/backend/data
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - WEBUI_SECRET_KEY=change-this-to-a-random-string
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
  open-webui_data:
```

See the full [Open WebUI guide](/apps/open-webui) for detailed setup.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or another reverse proxy, forward to port 11434 (API) or port 3000 if using Open WebUI.

For the Ollama API specifically, ensure WebSocket passthrough is enabled and increase proxy timeouts — model inference can take 30+ seconds for large prompts.

Nginx config snippet:

```nginx
location /ollama/ {
    proxy_pass http://localhost:11434/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

Back up the models volume:

```bash
docker compose stop ollama
docker run --rm -v ollama_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/ollama-backup.tar.gz /data
docker compose start ollama
```

The `/root/.ollama` volume contains downloaded models and configuration. Models can be re-downloaded, so backing up is optional if bandwidth isn't a concern.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### GPU not detected

**Symptom:** Ollama falls back to CPU despite having an NVIDIA GPU.

**Fix:** Verify the NVIDIA Container Toolkit is installed and configured:
```bash
nvidia-smi  # Should show your GPU
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi  # Should work in Docker
```
If the second command fails, reconfigure the toolkit:
```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Model download fails

**Symptom:** `ollama pull` hangs or fails.

**Fix:** Check disk space (`df -h`) — models are large. Verify network connectivity from inside the container:
```bash
docker exec ollama curl -I https://registry.ollama.ai
```

### Out of memory (OOM)

**Symptom:** Container is killed during inference.

**Fix:** Use a smaller model or a quantized variant. Add swap space:
```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
Or limit the model's context length:
```yaml
environment:
  - OLLAMA_CONTEXT_LENGTH=4096
```

### Slow inference on CPU

**Symptom:** Responses take minutes.

**Fix:** CPU inference is inherently slow for large models. Use smaller models (`phi3:mini`, `tinyllama`), reduce context length, or add a GPU. Even a used NVIDIA GTX 1070 with 8 GB VRAM dramatically improves performance.

### Cannot connect from another container

**Symptom:** Other containers get "connection refused" when hitting Ollama's API.

**Fix:** Ensure `OLLAMA_ORIGINS=*` is set and containers are on the same Docker network. Use `http://ollama:11434` (the service name) as the URL, not `localhost`.

## Resource Requirements

- **RAM (CPU mode):** Model size + 2-4 GB overhead. A 7B model needs ~8 GB total.
- **RAM (GPU mode):** System RAM for overhead (~4 GB), VRAM for the model.
- **VRAM:** Roughly matches model file size. 8 GB VRAM = 7B parameter models. 24 GB VRAM = 70B quantized models.
- **CPU:** More cores = faster CPU inference. Ollama uses all available cores.
- **Disk:** 20-100+ GB depending on model collection.

## Verdict

Ollama is the best way to run LLMs locally. The Docker setup is dead simple, GPU passthrough works reliably, and the OpenAI-compatible API means it integrates with virtually every AI tool. Pair it with [Open WebUI](/apps/open-webui) for a ChatGPT-like interface, or use the API directly from your applications.

For a complete self-hosted AI stack, Ollama is the runtime and [Open WebUI](/apps/open-webui) is the interface. If you need an OpenAI API drop-in replacement with support for multiple model formats, [LocalAI](/apps/localai) is an alternative — but Ollama is simpler and faster for most use cases.

## Related

- [How to Self-Host Open WebUI](/apps/open-webui)
- [How to Self-Host LocalAI](/apps/localai)
- [Ollama vs LocalAI](/compare/ollama-vs-localai)
- [Self-Hosted Alternatives to ChatGPT](/replace/chatgpt)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [GPU Passthrough in Docker](/foundations/gpu-passthrough-docker)
- [LLM Hardware Guide](/foundations/llm-hardware-guide)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

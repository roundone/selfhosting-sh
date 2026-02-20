---
title: "How to Self-Host LocalAI with Docker Compose"
description: "Deploy LocalAI with Docker Compose for private AI inference. Text, image generation, audio transcription, and OpenAI API compatibility."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-machine-learning"
apps:
  - localai
tags:
  - self-hosted
  - localai
  - docker
  - ai
  - llm
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is LocalAI?

[LocalAI](https://localai.io/) is a self-hosted, OpenAI-compatible API server that runs AI models locally. Unlike Ollama (which focuses on LLMs), LocalAI handles text generation, image generation (Stable Diffusion), audio transcription (Whisper), text-to-speech, and embeddings — all from a single API endpoint. It's a drop-in replacement for the OpenAI API, so existing applications work without code changes.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 8 GB+ RAM (CPU mode) or NVIDIA GPU with 8+ GB VRAM
- 20 GB+ free disk space (models are large)
- NVIDIA Container Toolkit (for GPU mode)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  localai:
    image: localai/localai:v3.11.0
    # GPU variants (uncomment one):
    # image: localai/localai:v3.11.0-gpu-nvidia-cuda-12
    # image: localai/localai:v3.11.0-gpu-nvidia-cuda-13
    # image: localai/localai:v3.11.0-gpu-hipblas       # AMD ROCm
    # image: localai/localai:v3.11.0-gpu-intel          # Intel Arc
    # image: localai/localai:v3.11.0-gpu-vulkan         # Vulkan
    container_name: localai
    ports:
      - "8080:8080"
    volumes:
      - localai_models:/build/models
    environment:
      # Thread count for CPU inference
      - THREADS=4
      # Default context window size
      - CONTEXT_SIZE=2048
      # Enable debug logging (optional)
      # - DEBUG=true
    # Uncomment for NVIDIA GPU support:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]
    restart: unless-stopped

volumes:
  localai_models:
```

For the all-in-one image with pre-bundled models:

```yaml
services:
  localai:
    image: localai/localai:v3.11.0-aio-cpu
    # Or with GPU: localai/localai:v3.11.0-aio-gpu-nvidia-cuda-12
    container_name: localai
    ports:
      - "8080:8080"
    volumes:
      - localai_models:/build/models
    restart: unless-stopped

volumes:
  localai_models:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Once running, verify the API is responding:

```bash
curl http://localhost:8080/v1/models
```

### Loading a Model

Download a GGUF model and create a configuration:

```bash
# Download a model (example: Mistral 7B)
docker exec localai wget -P /build/models \
  https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf

# Create a model config
docker exec localai bash -c 'cat > /build/models/mistral.yaml << EOF
name: mistral
backend: llama-cpp
parameters:
  model: mistral-7b-instruct-v0.2.Q4_K_M.gguf
  temperature: 0.7
  top_p: 0.9
context_size: 4096
threads: 4
EOF'
```

Test it with the OpenAI-compatible API:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "What is self-hosting?"}]
  }'
```

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `THREADS` | `4` | CPU threads for inference |
| `CONTEXT_SIZE` | `512` | Default context window size |
| `MODELS_PATH` | `/build/models` | Directory for model files |
| `DEBUG` | `false` | Enable debug logging |
| `CORS` | `true` | Enable CORS headers |
| `GALLERIES` | | JSON array of model gallery URLs |

### Model Gallery

LocalAI supports a model gallery for easy model installation:

```bash
# List available models
curl http://localhost:8080/models/available

# Install a model from the gallery
curl http://localhost:8080/models/apply -d '{"id": "huggingface@TheBloke/mistral-7b-instruct-v0.2-GGUF/mistral-7b-instruct-v0.2.Q4_K_M.gguf"}'
```

## Advanced Configuration

### Image Generation (Stable Diffusion)

Add a Stable Diffusion model config:

```yaml
# /build/models/stablediffusion.yaml
name: stablediffusion
backend: stablediffusion
parameters:
  model: stablediffusion_assets
```

Generate images via the OpenAI Images API:

```bash
curl http://localhost:8080/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a cat on a spaceship", "size": "512x512"}'
```

### Audio Transcription (Whisper)

LocalAI supports Whisper for speech-to-text:

```bash
curl http://localhost:8080/v1/audio/transcriptions \
  -F "file=@audio.wav" \
  -F "model=whisper-1"
```

### Text-to-Speech

```bash
curl http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model": "tts-1", "input": "Hello from LocalAI", "voice": "alloy"}' \
  --output speech.mp3
```

## Reverse Proxy

For HTTPS access, configure your reverse proxy to forward to port 8080. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

Nginx Proxy Manager: Create a proxy host pointing to `localai:8080`. Enable WebSocket support for streaming responses.

## Backup

Back up the models volume:

```bash
docker run --rm -v localai_models:/data -v $(pwd):/backup alpine \
  tar czf /backup/localai-models-backup.tar.gz /data
```

The models volume contains downloaded models and YAML configurations. Models can be re-downloaded, but custom configs should be backed up. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Model Not Loading

**Symptom:** API returns empty model list or 404 on model name.
**Fix:** Verify the YAML config filename matches the `name` field. Check that the GGUF file path in the YAML matches the actual file in `/build/models/`. Check logs: `docker logs localai`.

### Out of Memory

**Symptom:** Container killed, OOM errors in logs.
**Fix:** Use a smaller quantized model (Q4_K_M instead of Q8). Reduce `CONTEXT_SIZE`. For GPU: choose a model that fits in your VRAM. For CPU: ensure enough system RAM (model size + 2 GB overhead).

### Slow Inference on CPU

**Symptom:** Responses take 30+ seconds.
**Fix:** Increase `THREADS` to match your CPU core count. Use a smaller model (7B Q4 instead of 13B). Consider a GPU variant for 5-10x speedup.

### CORS Errors from Frontend

**Symptom:** Browser console shows CORS errors.
**Fix:** Set `CORS=true` environment variable (default is already true). If using a reverse proxy, ensure it doesn't strip CORS headers.

### GPU Not Detected

**Symptom:** Running on CPU despite having GPU.
**Fix:** Ensure you're using the correct GPU image variant (e.g., `v3.11.0-gpu-nvidia-cuda-12`). Verify NVIDIA Container Toolkit is installed: `nvidia-smi` should work inside the container. Check `deploy.resources.reservations.devices` in your Compose file.

## Resource Requirements

- **RAM (CPU mode):** 4-8 GB for 7B models, 8-16 GB for 13B models
- **VRAM (GPU mode):** 4-8 GB for 7B Q4, 8-16 GB for 13B Q4
- **CPU:** Medium-high (benefits from more cores, set THREADS accordingly)
- **Disk:** 5-50 GB depending on number and size of models

## Verdict

LocalAI is the Swiss Army knife of self-hosted AI. If you need a single service that handles text generation, image generation, audio transcription, and text-to-speech — all behind an OpenAI-compatible API — LocalAI is the only option that does it all. The trade-off is more complex setup compared to [Ollama](/apps/ollama), which only does LLM inference but does it with less friction.

**Choose LocalAI** if you're migrating an application from the OpenAI API to self-hosted, or if you need multi-modal AI (text + images + audio) from one endpoint. **Choose [Ollama](/apps/ollama)** if you only need LLM inference and want the simplest setup.

## Related

- [How to Self-Host Ollama](/apps/ollama)
- [How to Self-Host Open WebUI](/apps/open-webui)
- [Ollama vs LocalAI](/compare/ollama-vs-localai)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt)
- [Self-Hosted Midjourney Alternatives](/replace/midjourney)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

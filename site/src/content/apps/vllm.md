---
title: "How to Self-Host vLLM with Docker Compose"
description: "Deploy vLLM with Docker for high-throughput LLM serving. PagedAttention, continuous batching, and OpenAI-compatible API setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - vllm
tags:
  - self-hosted
  - vllm
  - docker
  - ai
  - llm
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is vLLM?

[vLLM](https://docs.vllm.ai/) is a high-throughput LLM inference engine designed for production serving. It invented PagedAttention, which manages GPU memory like an operating system manages virtual memory — dramatically improving throughput for concurrent requests. vLLM serves an OpenAI-compatible API, making it a drop-in backend for applications built against the OpenAI API.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- NVIDIA GPU with 16+ GB VRAM (required — no CPU mode)
- NVIDIA Container Toolkit installed
- 30 GB+ free disk space (for model downloads)
- HuggingFace account (for gated models like Llama)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  vllm:
    image: vllm/vllm-openai:v0.15.1
    container_name: vllm
    ports:
      - "8000:8000"
    volumes:
      - huggingface_cache:/root/.cache/huggingface
    environment:
      # Required for gated models (Llama, Mistral, etc.)
      - HUGGING_FACE_HUB_TOKEN=hf_your_token_here
    command: >
      --model mistralai/Mistral-7B-Instruct-v0.3
      --max-model-len 4096
      --gpu-memory-utilization 0.9
      --host 0.0.0.0
      --port 8000
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    ipc: host
    restart: unless-stopped

volumes:
  huggingface_cache:
```

Create a `.env` file:

```bash
# Get your token from https://huggingface.co/settings/tokens
HUGGING_FACE_HUB_TOKEN=hf_your_token_here
```

Start the stack:

```bash
docker compose up -d
```

The first start downloads the model from HuggingFace (may take several minutes depending on model size and connection speed).

## Initial Setup

Verify the API is responding:

```bash
curl http://localhost:8000/v1/models
```

Test with a chat completion:

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [{"role": "user", "content": "What is self-hosting?"}],
    "max_tokens": 200
  }'
```

## Configuration

### Key Command-Line Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--model` | Required | HuggingFace model ID or local path |
| `--max-model-len` | Model's max | Maximum context window length |
| `--gpu-memory-utilization` | `0.9` | Fraction of GPU VRAM to use (0.0-1.0) |
| `--tensor-parallel-size` | `1` | Number of GPUs for tensor parallelism |
| `--dtype` | `auto` | Data type: `auto`, `float16`, `bfloat16` |
| `--quantization` | None | Quantization method: `awq`, `gptq`, `fp8` |
| `--max-num-seqs` | `256` | Max concurrent sequences |
| `--host` | `0.0.0.0` | Host to bind |
| `--port` | `8000` | Port to listen on |
| `--api-key` | None | API key for authentication |

### Popular Models

| Model | VRAM Required | Notes |
|-------|-------------|-------|
| `mistralai/Mistral-7B-Instruct-v0.3` | ~16 GB | Good balance of quality and speed |
| `meta-llama/Llama-3.2-8B-Instruct` | ~18 GB | Requires HF token (gated) |
| `Qwen/Qwen2.5-7B-Instruct` | ~16 GB | Strong multilingual support |
| `TheBloke/Mistral-7B-Instruct-v0.2-AWQ` | ~6 GB | AWQ quantized, less VRAM |

### Multi-GPU Setup

For models that don't fit in a single GPU:

```yaml
command: >
  --model meta-llama/Llama-3.1-70B-Instruct
  --tensor-parallel-size 2
  --max-model-len 4096
  --gpu-memory-utilization 0.9
```

Set `--tensor-parallel-size` to the number of GPUs available.

## Advanced Configuration

### Quantized Models (Lower VRAM)

Run AWQ or GPTQ quantized models to reduce VRAM requirements:

```yaml
command: >
  --model TheBloke/Mistral-7B-Instruct-v0.2-AWQ
  --quantization awq
  --max-model-len 4096
```

### API Key Authentication

```yaml
command: >
  --model mistralai/Mistral-7B-Instruct-v0.3
  --api-key your-secret-api-key
```

Clients must include `Authorization: Bearer your-secret-api-key` in requests.

### Speculative Decoding

For faster generation with a draft model:

```yaml
command: >
  --model meta-llama/Llama-3.2-8B-Instruct
  --speculative-model meta-llama/Llama-3.2-1B-Instruct
  --num-speculative-tokens 5
```

## Reverse Proxy

Configure your reverse proxy to forward to port 8000. WebSocket support is recommended for streaming. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

The HuggingFace cache volume stores downloaded models. Models can be re-downloaded from HuggingFace, so backups are optional but save time on re-deployment.

```bash
docker run --rm -v huggingface_cache:/data -v $(pwd):/backup alpine \
  tar czf /backup/vllm-models-backup.tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### CUDA Out of Memory

**Symptom:** `torch.cuda.OutOfMemoryError` on startup.
**Fix:** Reduce `--max-model-len` (try 2048). Lower `--gpu-memory-utilization` to 0.8. Use a quantized model (AWQ/GPTQ). Use `--tensor-parallel-size 2` if you have multiple GPUs.

### Model Download Fails

**Symptom:** 401 or 403 error when downloading gated models.
**Fix:** Set `HUGGING_FACE_HUB_TOKEN` with a valid HuggingFace token. Accept the model's license on the HuggingFace website first.

### Slow First Request

**Symptom:** First request takes 30+ seconds after startup.
**Fix:** This is normal. vLLM compiles CUDA kernels on first use. Subsequent requests are fast. Use the warm-up period for health checks.

### Container Crashes Immediately

**Symptom:** Container exits with code 1.
**Fix:** Check `docker logs vllm`. Common causes: GPU not detected (install NVIDIA Container Toolkit), model too large for available VRAM, missing `ipc: host` in Compose file.

## Resource Requirements

- **VRAM:** 16-24 GB for 7B models (FP16), 6-8 GB for quantized
- **RAM:** 16 GB+ system RAM recommended
- **CPU:** Moderate (GPU does the heavy lifting)
- **Disk:** 10-50 GB per model

## Verdict

vLLM is the production-grade LLM serving engine. If you need to serve multiple concurrent users with consistent latency, vLLM's PagedAttention and continuous batching make it 2-5x more efficient than sequential inference engines. The trade-off is a hard GPU requirement and more complex setup.

**Choose vLLM** if you're building an application that serves LLM responses to multiple users. **Choose [Ollama](/apps/ollama/)** if you want simpler setup for personal use or small teams.

## Related

- [How to Self-Host Ollama](/apps/ollama/)
- [How to Self-Host Open WebUI](/apps/open-webui/)
- [Ollama vs vLLM](/compare/ollama-vs-vllm/)
- [Ollama vs LocalAI](/compare/ollama-vs-localai/)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt/)
- [Best Self-Hosted AI Tools](/best/ai-ml/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

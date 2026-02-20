---
title: "How to Self-Host Text Generation WebUI"
description: "Deploy Oobabooga's Text Generation WebUI for local LLM inference. GGUF, GPTQ, and LoRA training with Docker setup guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - text-generation-webui
tags:
  - self-hosted
  - text-generation-webui
  - docker
  - ai
  - llm
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Text Generation WebUI?

[Text Generation WebUI](https://github.com/oobabooga/text-generation-webui) (commonly called "Oobabooga") is a Gradio-based web interface for running large language models locally. It supports the widest range of model formats of any LLM interface — GGUF, GPTQ, AWQ, EXL2, and HuggingFace Transformers. It also supports LoRA training and fine-tuning, making it the go-to tool for ML enthusiasts who want deep model control.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- NVIDIA GPU with 8+ GB VRAM (recommended)
- 16 GB+ system RAM
- 30 GB+ free disk space
- NVIDIA Container Toolkit installed (for GPU mode)

## Docker Compose Configuration

Text Generation WebUI doesn't have an official Docker image, but the community-maintained setup works well. Create a `docker-compose.yml`:

```yaml
services:
  text-gen-webui:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: text-gen-webui
    ports:
      - "7860:7860"    # Web UI
      - "5000:5000"    # API server
    volumes:
      - ./models:/app/models
      - ./loras:/app/loras
      - ./characters:/app/characters
      - ./presets:/app/presets
      - ./extensions:/app/extensions
    environment:
      - CLI_ARGS=--listen --api --verbose
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
```

Create a `Dockerfile`:

```dockerfile
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

RUN apt-get update && apt-get install -y \
    git python3 python3-pip python3-venv wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone https://github.com/oobabooga/text-generation-webui.git . && \
    git checkout v1.10.1

RUN pip3 install --no-cache-dir -r requirements.txt && \
    pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

EXPOSE 7860 5000

CMD ["python3", "server.py", "--listen", "--api"]
```

Alternatively, use the official installation method which is simpler:

```bash
git clone https://github.com/oobabooga/text-generation-webui
cd text-generation-webui
./start_linux.sh
```

The startup script creates a conda environment and handles all dependencies automatically.

Start the stack:

```bash
docker compose up -d --build
```

## Initial Setup

1. Open `http://your-server:7860` in your browser
2. Go to the **Model** tab
3. Enter a HuggingFace model name (e.g., `TheBloke/Mistral-7B-Instruct-v0.2-GGUF`)
4. Click **Download** and wait for the model to download
5. Select the model and click **Load**
6. Switch to the **Chat** tab and start chatting

## Configuration

### Model Loader Selection

| Loader | Model Formats | Best For |
|--------|--------------|----------|
| llama.cpp | GGUF | CPU/GPU hybrid inference, quantized models |
| ExLlamaV2 | EXL2, GPTQ | Fastest GPU inference, quantized models |
| Transformers | SafeTensors, HF format | Full precision, training, fine-tuning |
| AutoGPTQ | GPTQ | GPU inference, older GPTQ models |
| AutoAWQ | AWQ | GPU inference, AWQ quantized models |

### CLI Arguments

| Argument | Description |
|----------|-------------|
| `--listen` | Listen on 0.0.0.0 (required for Docker) |
| `--api` | Enable the OpenAI-compatible API on port 5000 |
| `--verbose` | Enable detailed logging |
| `--cpu` | Run on CPU only (slow) |
| `--n-gpu-layers N` | Number of GPU layers (for llama.cpp) |
| `--gpu-memory X` | Set GPU VRAM limit in GiB |
| `--extensions E1 E2` | Load extensions on startup |

## Advanced Configuration

### LoRA Training

Text Generation WebUI includes a built-in LoRA training interface:

1. Go to the **Training** tab
2. Prepare training data in the expected format (JSON or raw text)
3. Select a base model (must be loaded in Transformers format)
4. Configure training parameters (learning rate, epochs, batch size)
5. Start training — the LoRA adapter is saved to `loras/`

### Extensions

Extensions add functionality. Popular ones include:
- **openai** — OpenAI-compatible API server
- **multimodal** — Vision model support
- **superboogav2** — RAG (retrieval augmented generation)
- **whisper_stt** — Speech-to-text input
- **silero_tts** — Text-to-speech output

### API Usage

The OpenAI-compatible API runs on port 5000:

```bash
curl http://localhost:5000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Mistral-7B-Instruct-v0.2",
    "messages": [{"role": "user", "content": "What is self-hosting?"}]
  }'
```

## Reverse Proxy

Configure your reverse proxy to forward to port 7860 (Web UI) or 5000 (API). WebSocket support is required for the Gradio UI. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up these directories:
- `models/` — Downloaded models (large, can be re-downloaded)
- `loras/` — Trained LoRA adapters (cannot be re-created without retraining)
- `characters/` — Custom character definitions
- `presets/` — Generation parameter presets

Priority: `loras/` and `characters/` are irreplaceable. Models can be re-downloaded. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### CUDA Out of Memory

**Symptom:** Model fails to load with OOM error.
**Fix:** Use a smaller quantized model. Set `--n-gpu-layers` to offload fewer layers to GPU. Use EXL2 or GGUF quantization for smaller VRAM footprint.

### Model Downloads Slowly

**Symptom:** Model download from HuggingFace is very slow.
**Fix:** Download models manually using `huggingface-cli download` and place them in the `models/` directory.

### Gradio UI Won't Load

**Symptom:** Port 7860 connection refused.
**Fix:** Ensure `--listen` flag is set in CLI_ARGS. Check Docker port mapping. Verify the container started successfully: `docker logs text-gen-webui`.

### Extension Not Working

**Symptom:** Extension doesn't appear or crashes.
**Fix:** Install extension dependencies inside the container. Some extensions require additional Python packages not included in the base installation.

## Resource Requirements

- **VRAM:** 4-8 GB for 7B Q4, 8-16 GB for 13B Q4, 16-24 GB for 7B FP16
- **RAM:** 8-32 GB (depends on model size and loader)
- **CPU:** Medium-high (benefits from more cores for CPU inference)
- **Disk:** 5-100 GB per model

## Verdict

Text Generation WebUI is the power user's LLM interface. It supports more model formats and loading backends than any other tool, and the built-in LoRA training is unique. The trade-off is more complex setup and a less polished UI compared to [Open WebUI](/apps/open-webui).

**Choose Text Generation WebUI** if you want LoRA training, EXL2 model support, or deep control over inference parameters. **Choose [Open WebUI](/apps/open-webui) + [Ollama](/apps/ollama)** for a polished ChatGPT-like experience with simpler setup.

## Related

- [How to Self-Host Open WebUI](/apps/open-webui)
- [How to Self-Host Ollama](/apps/ollama)
- [Open WebUI vs Text Generation WebUI](/compare/open-webui-vs-text-generation-webui)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Hardware for Self-Hosted AI](/hardware/ai-ml-hardware)

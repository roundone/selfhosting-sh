---
title: "How to Self-Host ComfyUI with Docker Compose"
description: "Deploy ComfyUI with Docker for node-based AI image generation. Workflow editor, custom nodes, and GPU setup guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-machine-learning"
apps:
  - comfyui
tags:
  - self-hosted
  - comfyui
  - docker
  - ai
  - image-generation
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ComfyUI?

[ComfyUI](https://github.com/comfyanonymous/ComfyUI) is a node-based workflow editor for AI image generation. Instead of a traditional form-based UI, you build image generation pipelines by connecting nodes — model loaders, samplers, VAE decoders, ControlNet processors, and more. This gives you full control over every step of the generation process. Workflows can be saved, shared, and reproduced exactly.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- NVIDIA GPU with 4+ GB VRAM (8+ GB recommended)
- 8 GB+ system RAM
- 20 GB+ free disk space
- NVIDIA Container Toolkit installed

## Docker Compose Configuration

ComfyUI doesn't have an official Docker image. Here's a Docker setup using a custom Dockerfile:

Create a `Dockerfile`:

```dockerfile
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    git python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone https://github.com/comfyanonymous/ComfyUI.git . && \
    git checkout v0.14.2

RUN pip3 install --no-cache-dir torch torchvision torchaudio \
    --index-url https://download.pytorch.org/whl/cu124 && \
    pip3 install --no-cache-dir -r requirements.txt

EXPOSE 8188

CMD ["python3", "main.py", "--listen", "0.0.0.0"]
```

Create a `docker-compose.yml`:

```yaml
services:
  comfyui:
    build: .
    container_name: comfyui
    ports:
      - "8188:8188"
    volumes:
      - ./models:/app/models
      - ./output:/app/output
      - ./input:/app/input
      - ./custom_nodes:/app/custom_nodes
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
```

**Alternative: Source installation** (simpler):

```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt
python main.py --listen
```

Build and start:

```bash
docker compose up -d --build
```

## Initial Setup

1. Open `http://your-server:8188` in your browser
2. You'll see the node editor with a default workflow
3. Download a model and place it in `models/checkpoints/`:

```bash
wget -P models/checkpoints/ \
  https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
```

4. Click **Queue Prompt** to generate your first image

### Understanding the Node Editor

The default workflow contains:
- **Load Checkpoint** — Loads the image generation model
- **CLIP Text Encode (Prompt)** — Encodes your positive prompt
- **CLIP Text Encode (Negative)** — Encodes what to avoid
- **KSampler** — The actual generation step (steps, CFG, sampler)
- **VAE Decode** — Converts the latent image to pixels
- **Save Image** — Saves the output

Right-click anywhere to add new nodes. Connect outputs to inputs by dragging.

## Configuration

### Model Directories

| Directory | Contents |
|-----------|----------|
| `models/checkpoints/` | SD 1.5, SDXL, Flux checkpoint files |
| `models/vae/` | VAE models |
| `models/loras/` | LoRA adapters |
| `models/controlnet/` | ControlNet models |
| `models/upscale_models/` | Upscaler models (ESRGAN, etc.) |
| `models/clip/` | CLIP text encoder models |
| `models/embeddings/` | Textual inversion embeddings |

### CLI Arguments

| Argument | Description |
|----------|-------------|
| `--listen ADDRESS` | Listen address (use `0.0.0.0` for Docker) |
| `--port PORT` | Port (default: 8188) |
| `--cpu` | Run on CPU only |
| `--lowvram` | Optimize for low VRAM GPUs |
| `--novram` | Run with minimal VRAM (~256 MB) |
| `--disable-auto-launch` | Don't open browser on start |
| `--preview-method auto` | Enable generation previews |

## Advanced Configuration

### Custom Nodes (ComfyUI-Manager)

Install ComfyUI-Manager for easy custom node management:

```bash
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
```

Restart ComfyUI. Click the **Manager** button to browse and install custom nodes from the UI.

### API Usage

ComfyUI has a WebSocket API for programmatic use:

```python
import json
import urllib.request

prompt = {
    # Export a workflow as API format from the UI
    # Save → API Format → copy the JSON
}

data = json.dumps({"prompt": prompt}).encode("utf-8")
req = urllib.request.Request(
    "http://localhost:8188/prompt",
    data=data,
    headers={"Content-Type": "application/json"}
)
urllib.request.urlopen(req)
```

Export any workflow as API-compatible JSON using the **Save (API Format)** button.

### Flux Model Support

ComfyUI supports Flux models. Download the Flux checkpoint and use the appropriate workflow nodes (different from SD 1.5/SDXL workflows).

## Reverse Proxy

Configure your reverse proxy to forward to port 8188. WebSocket support is required for the node editor and generation progress. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up these directories:
- `output/` — Generated images (irreplaceable)
- `custom_nodes/` — Installed custom nodes (can be re-downloaded)
- `models/` — Downloaded models (large, can be re-downloaded)

Priority: Save your workflow JSON files — they capture your entire generation pipeline and are small. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Out of VRAM

**Symptom:** Generation fails with CUDA OOM error.
**Fix:** Add `--lowvram` or `--novram` to the command. Reduce image resolution. Use FP16 models instead of FP32.

### Custom Node Errors

**Symptom:** Workflow fails with "missing node" errors.
**Fix:** Install the required custom nodes. Check ComfyUI-Manager for one-click installation. Some workflows require specific custom node versions.

### Models Not Appearing

**Symptom:** Checkpoint dropdown is empty.
**Fix:** Verify model files are in `models/checkpoints/` (not a subdirectory). File format must be `.safetensors` or `.ckpt`. Refresh the page after adding models.

### WebSocket Connection Lost

**Symptom:** UI disconnects from the server.
**Fix:** Check that your reverse proxy supports WebSocket connections. If using Nginx, ensure `proxy_http_version 1.1`, `Upgrade`, and `Connection` headers are configured.

## Resource Requirements

- **VRAM:** 4 GB minimum, 8 GB recommended, 12+ GB for SDXL/Flux
- **RAM:** 8-16 GB
- **CPU:** Low (GPU does the computation)
- **Disk:** 4-7 GB per model, plus generated images

## Verdict

ComfyUI is the power user's image generation tool. The node-based workflow gives you complete control over every step of the generation pipeline — something no other interface provides. Workflows are reproducible, shareable, and composable. The trade-off is a steeper learning curve compared to [Stable Diffusion WebUI](/apps/stable-diffusion-webui).

**Choose ComfyUI** if you want maximum control over image generation pipelines, reproducible workflows, and the ability to build complex generation chains. **Choose [Stable Diffusion WebUI](/apps/stable-diffusion-webui)** if you want a simpler, more traditional interface.

## Related

- [How to Self-Host Stable Diffusion WebUI](/apps/stable-diffusion-webui)
- [Stable Diffusion vs ComfyUI](/compare/stable-diffusion-vs-comfyui)
- [Self-Hosted Midjourney Alternatives](/replace/midjourney)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Hardware for Self-Hosted AI](/hardware/ai-ml-hardware)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

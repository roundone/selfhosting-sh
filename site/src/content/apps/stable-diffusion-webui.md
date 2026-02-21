---
title: "How to Self-Host Stable Diffusion WebUI"
description: "Deploy AUTOMATIC1111's Stable Diffusion WebUI with Docker for self-hosted AI image generation. GPU setup and model guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - stable-diffusion-webui
tags:
  - self-hosted
  - stable-diffusion
  - docker
  - ai
  - image-generation
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Stable Diffusion WebUI?

[Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) (by AUTOMATIC1111) is the most popular web interface for running Stable Diffusion image generation models locally. It provides txt2img, img2img, inpainting, upscaling, and dozens of other image generation features through a Gradio-based web interface. It's a self-hosted alternative to Midjourney and DALL-E.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- NVIDIA GPU with 8+ GB VRAM (4 GB minimum, 12+ GB recommended)
- 16 GB+ system RAM
- 20 GB+ free disk space (models are 2-7 GB each)
- NVIDIA Container Toolkit installed

## Docker Compose Configuration

There's no official Docker image. The recommended approach is a custom Dockerfile or using the source install method. Here's a Docker Compose setup using a community image:

```yaml
services:
  stable-diffusion:
    # No versioned tags exist for this image — :latest is the only option
    image: universonic/stable-diffusion-webui:latest
    container_name: stable-diffusion
    ports:
      - "7861:7861"
    volumes:
      - sd_models:/app/stable-diffusion-webui/models
      - sd_outputs:/app/stable-diffusion-webui/outputs
      - sd_extensions:/app/stable-diffusion-webui/extensions
    environment:
      - CLI_ARGS=--listen --api --xformers
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  sd_models:
  sd_outputs:
  sd_extensions:
```

**Alternative: Source installation** (more reliable, recommended):

```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
./webui.sh --listen --api --xformers
```

The startup script handles all dependencies, creates a venv, and installs PyTorch with CUDA support.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:7861` in your browser
2. The first start downloads the default Stable Diffusion v1.5 model (~4 GB)
3. Type a prompt in the txt2img tab and click **Generate**

### Downloading Better Models

Download models from [CivitAI](https://civitai.com/) or [HuggingFace](https://huggingface.co/) and place them in the `models/Stable-diffusion/` directory:

```bash
# Example: Download SDXL base model
wget -P models/Stable-diffusion/ \
  https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
```

Refresh the model list in the web UI dropdown after adding new models.

## Configuration

### Key CLI Arguments

| Argument | Description |
|----------|-------------|
| `--listen` | Listen on 0.0.0.0 (required for Docker/remote access) |
| `--api` | Enable the REST API |
| `--xformers` | Enable xFormers for faster generation and lower VRAM |
| `--medvram` | Optimize for 8 GB VRAM GPUs |
| `--lowvram` | Optimize for 4 GB VRAM GPUs (slower) |
| `--share` | Create a public Gradio link |
| `--port PORT` | Custom port (default: 7861) |
| `--no-half` | Disable FP16 (for GPUs without FP16 support) |

### Model Types

| Type | Directory | Purpose |
|------|-----------|---------|
| Checkpoints | `models/Stable-diffusion/` | Base image generation models |
| VAE | `models/VAE/` | Variational autoencoders for color/detail |
| LoRA | `models/Lora/` | Fine-tuned adapters for specific styles |
| Embeddings | `embeddings/` | Textual inversions for concepts/styles |
| ControlNet | `models/ControlNet/` | Pose/depth/edge-guided generation |

## Advanced Configuration

### ControlNet

ControlNet allows pose-guided, edge-guided, and depth-guided image generation:

1. Install the ControlNet extension from the Extensions tab
2. Download ControlNet models to `models/ControlNet/`
3. Enable ControlNet in the generation parameters

### API Usage

Generate images via the REST API:

```bash
curl -X POST http://localhost:7861/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cat in space, digital art",
    "negative_prompt": "low quality, blurry",
    "steps": 20,
    "width": 512,
    "height": 512,
    "cfg_scale": 7
  }'
```

The response contains base64-encoded images.

### SDXL Support

SDXL models require 12+ GB VRAM. Use `--xformers` and consider `--medvram` if you're at the VRAM limit.

## Reverse Proxy

Configure your reverse proxy to forward to port 7861. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up these volumes:
- `sd_models/` — Downloaded models (large, can be re-downloaded)
- `sd_outputs/` — Generated images (irreplaceable)
- `sd_extensions/` — Installed extensions (can be re-downloaded)

Priority: `sd_outputs/` is irreplaceable. Models and extensions can be re-downloaded. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Out of VRAM

**Symptom:** `RuntimeError: CUDA out of memory`
**Fix:** Add `--medvram` or `--lowvram` to CLI_ARGS. Reduce resolution (start with 512x512). Use `--xformers` if not already enabled. Generate one image at a time (batch size 1).

### Slow Generation

**Symptom:** Images take 60+ seconds.
**Fix:** Enable `--xformers`. Use a smaller model (SD 1.5 instead of SDXL). Reduce steps (20 is usually sufficient). Ensure GPU is being used (check with `nvidia-smi`).

### Extension Installation Fails

**Symptom:** Extension install from URL fails.
**Fix:** Check that the container has internet access. Install extensions manually by cloning into the `extensions/` directory. Restart the container after manual installation.

### Black Images Generated

**Symptom:** Output images are completely black.
**Fix:** This usually indicates an incompatible model format or a safety checker triggering. Try a different model. Add `--no-half-vae` to CLI_ARGS. Disable the safety checker in settings.

## Resource Requirements

- **VRAM:** 4 GB minimum (SD 1.5 with `--lowvram`), 8 GB recommended, 12+ GB for SDXL
- **RAM:** 8-16 GB
- **CPU:** Low-medium (GPU does the work)
- **Disk:** 4-7 GB per model, plus generated images

## Verdict

Stable Diffusion WebUI (AUTOMATIC1111) is the most feature-rich image generation interface. The extension ecosystem, model compatibility, and community are unmatched. The trade-off is a more complex setup compared to cloud alternatives, and it requires a decent NVIDIA GPU.

**Choose Stable Diffusion WebUI** for a feature-rich, traditional image generation workflow. **Choose [ComfyUI](/apps/comfyui/)** for node-based workflows with more control over the generation pipeline.

## Related

- [How to Self-Host ComfyUI](/apps/comfyui/)
- [Stable Diffusion vs ComfyUI](/compare/stable-diffusion-vs-comfyui/)
- [Self-Hosted Midjourney Alternatives](/replace/midjourney/)
- [Best Self-Hosted AI Tools](/best/ai-ml/)
- [Hardware for Self-Hosted AI](/hardware/ai-ml-hardware/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

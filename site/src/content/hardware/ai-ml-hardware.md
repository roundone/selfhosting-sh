---
title: "Best Hardware for Self-Hosted AI & ML"
description: "GPU and server recommendations for running AI models locally. NVIDIA GPUs, mini PCs, and server builds for LLMs, image generation, and more."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "hardware"
apps:
  - ollama
  - vllm
  - comfyui
  - stable-diffusion-webui
  - tabby
tags:
  - hardware
  - ai
  - machine-learning
  - gpu
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**For most people:** An NVIDIA RTX 3060 12 GB ($250-300 used) in a standard desktop is the best entry point. 12 GB VRAM runs 7B-13B parameter models comfortably, handles Stable Diffusion without issues, and provides code completion via Tabby. This is the sweet spot for cost, capability, and power consumption.

**If budget allows:** An RTX 4090 with 24 GB VRAM ($1,600-1,800) runs 70B models quantized, handles the largest Stable Diffusion workflows, and is the single most capable consumer GPU for AI workloads.

## What to Look For

### VRAM Is Everything

For AI workloads, **GPU VRAM determines what models you can run.** Not system RAM, not CPU cores, not disk speed — VRAM. A model that doesn't fit in VRAM either won't load or falls back to slow CPU inference.

| VRAM | What You Can Run |
|------|-----------------|
| 4 GB | Small LLMs (3B quantized), code completion (Tabby with small models), basic Stable Diffusion (SD 1.5) |
| 8 GB | 7B LLMs (quantized), SDXL, most LoRAs and ControlNet, Whisper medium |
| 12 GB | 13B LLMs (quantized), SDXL with multiple LoRAs, Whisper large |
| 16 GB | 13B LLMs (higher quantization), video generation basics |
| 24 GB | 70B LLMs (4-bit quantized), all Stable Diffusion workflows, Whisper large-v3 with batching |
| 48 GB+ | 70B LLMs (8-bit), multiple concurrent models, fine-tuning |

### NVIDIA Only (Practically)

NVIDIA GPUs with CUDA are required for most AI tools. AMD ROCm support exists but is incomplete — many tools either don't support it or have reduced performance. Intel Arc has even less support.

**Rule of thumb:** Buy NVIDIA. The CUDA ecosystem is too dominant to bet against for self-hosted AI in 2026.

### System RAM Matters for CPU Inference

If you want to run models on CPU (no GPU, or models too large for VRAM), system RAM becomes the bottleneck. [Ollama](/apps/ollama) and [LocalAI](/apps/localai) support CPU inference — slower, but functional.

| System RAM | CPU Inference Capability |
|-----------|------------------------|
| 8 GB | 3B models only |
| 16 GB | 7B quantized models |
| 32 GB | 13B quantized models |
| 64 GB | 30B quantized models |
| 128 GB+ | 70B quantized models |

CPU inference is 10-50x slower than GPU inference. Usable for batch processing, testing, and occasional queries — not for real-time chat or image generation.

## Top GPU Picks

### NVIDIA RTX 3060 12 GB — Best Budget GPU

The RTX 3060 12 GB is the most recommended GPU for self-hosted AI on a budget. The 12 GB VRAM (more than the RTX 3070's 8 GB) is the key — it runs 7B-13B parameter LLMs, handles SDXL, and provides solid code completion.

**Specs:**
- VRAM: 12 GB GDDR6
- CUDA cores: 3584
- TDP: 170W
- Price: $250-300 (used), $300-350 (new)

**Can run:** Ollama (7B-13B models), Stable Diffusion (SDXL), ComfyUI, Tabby, Whisper (large)

**Cannot run well:** 70B models (even quantized), concurrent large model serving

### NVIDIA RTX 4060 Ti 16 GB — Best Mid-Range

The RTX 4060 Ti 16 GB variant offers more VRAM than the 8 GB model at a reasonable price. Ada Lovelace architecture provides better inference throughput per watt than Ampere.

**Specs:**
- VRAM: 16 GB GDDR6
- CUDA cores: 4352
- TDP: 165W
- Price: $400-450

**Can run:** All 7B-13B models at higher quantization, SDXL with complex workflows, Tabby with larger code models, concurrent small model serving

### NVIDIA RTX 4090 — Best Consumer GPU

The RTX 4090 is the most powerful consumer GPU for AI workloads. 24 GB VRAM handles 70B models (4-bit quantized), the largest Stable Diffusion workflows, and multiple concurrent models.

**Specs:**
- VRAM: 24 GB GDDR6X
- CUDA cores: 16384
- TDP: 450W
- Price: $1,600-1,800

**Can run:** 70B models (4-bit quantized), all image generation workflows, multiple concurrent models, fine-tuning smaller models, [vLLM](/apps/vllm) for production inference

### NVIDIA RTX 3090 — Best Used Value

The RTX 3090 offers 24 GB VRAM at significantly lower prices than the RTX 4090. Older architecture means lower inference speed, but the VRAM capacity is identical for model loading purposes.

**Specs:**
- VRAM: 24 GB GDDR6X
- CUDA cores: 10496
- TDP: 350W
- Price: $700-900 (used)

**Can run:** Same models as RTX 4090, but ~40% slower inference. Still runs 70B quantized, all SD workflows, and production serving.

### NVIDIA Tesla P40 — Best Datacenter Budget

The Tesla P40 is a datacenter GPU available cheaply on the used market. 24 GB VRAM, no video output (headless only), and no FP16 tensor cores — but it runs inference workloads and fits in standard servers.

**Specs:**
- VRAM: 24 GB GDDR5X
- CUDA cores: 3840
- TDP: 250W
- Price: $150-250 (used on eBay)

**Can run:** 70B models (4-bit quantized, slowly). Good for batch processing, not real-time inference. No display output — headless server only.

**Trade-off:** Older Pascal architecture. Much slower than RTX 30/40 series for inference. No FP16 tensor cores means quantized model inference is less efficient. But 24 GB VRAM for $200 is hard to argue with for experimentation.

## Complete Hardware Builds

### Starter Build — $400-600

For experimenting with AI models. Runs 7B LLMs, Stable Diffusion, and code completion.

| Component | Recommendation | Cost |
|-----------|---------------|------|
| GPU | RTX 3060 12 GB (used) | $250-300 |
| CPU | Any modern 4+ core (Ryzen 5 / i5) | $100-150 (used system) |
| RAM | 16 GB DDR4 | $30-40 |
| Storage | 500 GB NVMe SSD | $40-50 |
| PSU | 550W 80+ Bronze | $50-60 |
| **Total** | | **$470-600** |

**Power consumption:** ~200W under AI load. ~$15/month electricity at $0.12/kWh.

**What this runs:** [Ollama](/apps/ollama) with 7B-13B models, [Open WebUI](/apps/open-webui), [ComfyUI](/apps/comfyui) with SDXL, [Tabby](/apps/tabby) for code completion, [Whisper](/apps/whisper) for transcription.

### Mid-Range Build — $800-1,200

For serious self-hosted AI. Runs larger models, faster inference, more concurrent workloads.

| Component | Recommendation | Cost |
|-----------|---------------|------|
| GPU | RTX 4060 Ti 16 GB or RTX 3090 (used) | $400-900 |
| CPU | Ryzen 7 / i7 (8+ cores) | $150-200 |
| RAM | 32 GB DDR4/DDR5 | $60-80 |
| Storage | 1 TB NVMe SSD | $70-90 |
| PSU | 750W 80+ Gold | $80-100 |
| **Total** | | **$760-1,370** |

**Power consumption:** ~300W under AI load. ~$22/month electricity at $0.12/kWh.

**What this runs:** Everything in the starter build plus: 30B-70B models (quantized on 24 GB VRAM), [vLLM](/apps/vllm) for production serving, complex ComfyUI workflows with ControlNet and IP-Adapter, multiple models loaded simultaneously.

### High-End Build — $2,000-3,000

For running the largest models, production inference, and fine-tuning.

| Component | Recommendation | Cost |
|-----------|---------------|------|
| GPU | RTX 4090 24 GB | $1,600-1,800 |
| CPU | Ryzen 9 / i9 (12+ cores) | $300-400 |
| RAM | 64 GB DDR5 | $120-160 |
| Storage | 2 TB NVMe SSD | $120-150 |
| PSU | 1000W 80+ Gold | $120-150 |
| **Total** | | **$2,260-2,860** |

**Power consumption:** ~500W under AI load. ~$36/month electricity at $0.12/kWh.

**What this runs:** 70B models at usable quantization, multiple concurrent model serving with vLLM, fine-tuning 7B-13B models, video generation (AnimateDiff, SVD), all image generation workflows at maximum speed.

### CPU-Only Build — $200-400

No GPU. For experimenting with smaller models or batch processing where speed doesn't matter.

| Component | Recommendation | Cost |
|-----------|---------------|------|
| System | Used Dell OptiPlex / Lenovo ThinkCentre | $100-200 |
| RAM upgrade | 32 GB DDR4 | $40-60 |
| Storage | 500 GB NVMe SSD | $40-50 |
| **Total** | | **$180-310** |

**What this runs:** [Ollama](/apps/ollama) or [LocalAI](/apps/localai) with 7B quantized models on CPU (slow but functional), [Flowise](/apps/flowise) for AI workflows (calling external APIs), [Whisper](/apps/whisper) on CPU (slower transcription).

**Not recommended for:** Image generation, real-time chat, production serving, anything requiring fast inference.

## Comparison Table

| Spec | Starter | Mid-Range | High-End | CPU-Only |
|------|---------|-----------|----------|----------|
| GPU VRAM | 12 GB | 16-24 GB | 24 GB | None |
| System RAM | 16 GB | 32 GB | 64 GB | 32 GB |
| Storage | 500 GB | 1 TB | 2 TB | 500 GB |
| Max LLM size | 13B | 70B (quantized) | 70B (high quant) | 7B (slow) |
| Image generation | SDXL | SDXL + ControlNet | Everything | No |
| Power (AI load) | ~200W | ~300W | ~500W | ~80W |
| Monthly electricity | ~$15 | ~$22 | ~$36 | ~$6 |
| Cost | $400-600 | $800-1,200 | $2,000-3,000 | $200-400 |

## Power Consumption and Running Costs

Self-hosted AI hardware consumes significantly more power than typical homelab equipment. A server running [Jellyfin](/apps/jellyfin) idles at 10-30W. A GPU under AI inference load draws 170-450W.

| GPU | Idle Power | AI Load Power | Monthly Cost (24/7, $0.12/kWh) |
|-----|-----------|--------------|-------------------------------|
| RTX 3060 12 GB | 15W | 170W | $10-15 |
| RTX 4060 Ti 16 GB | 10W | 165W | $10-14 |
| RTX 3090 | 25W | 350W | $18-30 |
| RTX 4090 | 20W | 450W | $15-39 |
| Tesla P40 | 15W | 250W | $10-22 |
| CPU only (system) | 30W | 80W | $3-7 |

**Key insight:** If you're only using AI models occasionally (not 24/7 inference), actual electricity costs are much lower. A system that runs inference 2-3 hours/day costs roughly 10% of the 24/7 figures above.

## What Can You Run on This?

| Tool | Min GPU | Recommended GPU | Can Use CPU? |
|------|---------|----------------|-------------|
| [Ollama](/apps/ollama) (7B) | 4 GB VRAM | 8 GB+ VRAM | Yes (slow) |
| [Ollama](/apps/ollama) (70B Q4) | 24 GB VRAM | 24 GB VRAM | Yes (very slow) |
| [vLLM](/apps/vllm) | 8 GB VRAM | 24 GB VRAM | No |
| [LocalAI](/apps/localai) | None | 8 GB+ VRAM | Yes |
| [ComfyUI](/apps/comfyui) | 4 GB VRAM | 12 GB+ VRAM | No |
| [SD WebUI](/apps/stable-diffusion-webui) | 4 GB VRAM | 12 GB+ VRAM | No |
| [Tabby](/apps/tabby) | 4 GB VRAM | 8 GB+ VRAM | No |
| [Whisper](/apps/whisper) | None | 8 GB+ VRAM | Yes (slower) |
| [Flowise](/apps/flowise) | None | None (calls LLM APIs) | Yes |
| [Text Gen WebUI](/apps/text-generation-webui) | 4 GB VRAM | 12 GB+ VRAM | Yes (slow) |

## Multi-GPU Considerations

Some tools support multi-GPU setups:

- **vLLM:** Tensor parallelism across multiple GPUs. Two RTX 3090s (48 GB combined VRAM) can run 70B models at higher quantization than a single card.
- **Ollama:** Currently single-GPU only for a given model.
- **ComfyUI:** Single-GPU only.
- **Text Generation WebUI:** Supports model splitting across GPUs via ExLlamaV2.

**Recommendation:** For most self-hosters, a single powerful GPU is better than multiple weaker ones. Multi-GPU setups add complexity (power, cooling, motherboard compatibility) and not all tools support them.

## Cloud GPU vs Self-Hosted

| Factor | Cloud GPU (RunPod, Vast.ai) | Self-Hosted |
|--------|---------------------------|-------------|
| Upfront cost | $0 | $400-3,000 |
| Hourly cost | $0.20-2.00/hour | $0 (electricity only) |
| Monthly cost (8h/day) | $50-500 | $6-36 (electricity) |
| Monthly cost (24/7) | $150-1,500 | $6-39 (electricity) |
| Break-even | — | 2-6 months |
| Data privacy | On provider's hardware | On your hardware |
| Setup time | Minutes | Hours |
| Availability | Always (if you pay) | Always (your hardware) |

**Break-even analysis:** A self-hosted RTX 3060 12 GB ($300) replaces ~$50-100/month in cloud GPU costs. It pays for itself in 3-6 months of regular use.

## Related

- [Best Self-Hosted AI & ML Tools](/best/ai-ml)
- [How to Self-Host Ollama](/apps/ollama)
- [How to Self-Host Open WebUI](/apps/open-webui)
- [How to Self-Host vLLM](/apps/vllm)
- [How to Self-Host ComfyUI](/apps/comfyui)
- [How to Self-Host Stable Diffusion WebUI](/apps/stable-diffusion-webui)
- [How to Self-Host Tabby](/apps/tabby)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt)
- [Self-Hosted Midjourney Alternatives](/replace/midjourney)
- [Self-Hosted Copilot Alternatives](/replace/github-copilot)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Getting Started with Self-Hosting](/foundations/getting-started)

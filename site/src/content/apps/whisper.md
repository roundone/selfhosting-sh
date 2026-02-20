---
title: "How to Self-Host Whisper with Docker Compose"
description: "Deploy OpenAI's Whisper with Docker for private speech-to-text transcription. GPU acceleration and API setup guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "ai-ml"
apps:
  - whisper
tags:
  - self-hosted
  - whisper
  - docker
  - ai
  - speech-to-text
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Whisper?

[Whisper](https://github.com/openai/whisper) is OpenAI's open-source speech-to-text model. It transcribes audio in 99+ languages with high accuracy, including translation to English. Self-hosting Whisper means your audio never leaves your server — no API costs, no data sharing. Several community projects wrap Whisper in a REST API for easy integration.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB+ RAM (CPU mode) or NVIDIA GPU with 4+ GB VRAM
- 5 GB+ free disk space
- NVIDIA Container Toolkit (for GPU mode)

## Docker Compose Configuration

The best Docker-based Whisper deployment is [Speaches](https://github.com/speaches-ai/speaches) (formerly Faster Whisper Server), which provides an OpenAI-compatible API:

```yaml
services:
  whisper:
    image: ghcr.io/speaches-ai/speaches:v0.8.3
    # Formerly fedirz/faster-whisper-server — project renamed to speaches
    container_name: whisper
    ports:
      - "8000:8000"
    volumes:
      - whisper_models:/root/.cache/huggingface
    environment:
      - WHISPER__MODEL=Systran/faster-whisper-large-v3
      # Smaller, faster models:
      # - WHISPER__MODEL=Systran/faster-whisper-medium
      # - WHISPER__MODEL=Systran/faster-whisper-small
      # - WHISPER__MODEL=Systran/faster-whisper-base
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  whisper_models:
```

Start the stack:

```bash
docker compose up -d
```

The model downloads on first start (large-v3 is ~3 GB).

## Initial Setup

Test transcription with a curl command:

```bash
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"
```

The response includes the transcribed text in JSON format, compatible with OpenAI's API response format.

## Configuration

### Model Selection

| Model | Size | VRAM Required | Speed | Accuracy |
|-------|------|---------------|-------|----------|
| `faster-whisper-tiny` | ~75 MB | ~1 GB | Very fast | Low |
| `faster-whisper-base` | ~140 MB | ~1 GB | Fast | Medium |
| `faster-whisper-small` | ~460 MB | ~2 GB | Moderate | Good |
| `faster-whisper-medium` | ~1.5 GB | ~3 GB | Slow | Better |
| `faster-whisper-large-v3` | ~3 GB | ~5 GB | Slowest | Best |

For most use cases, `faster-whisper-small` or `faster-whisper-medium` offers the best speed/accuracy trade-off.

### API Endpoints

The API is OpenAI-compatible:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/audio/transcriptions` | POST | Transcribe audio to text |
| `/v1/audio/translations` | POST | Translate audio to English |

### Translation

Translate any language to English:

```bash
curl -X POST http://localhost:8000/v1/audio/translations \
  -F "file=@french-audio.mp3" \
  -F "model=whisper-1"
```

## Advanced Configuration

### Timestamps

Get word-level timestamps:

```bash
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@audio.mp3" \
  -F "model=whisper-1" \
  -F "response_format=verbose_json" \
  -F "timestamp_granularities[]=word"
```

### Integration with Open WebUI

[Open WebUI](/apps/open-webui) supports Whisper for voice input. Set the Whisper API URL in Open WebUI's settings to `http://whisper:8000/v1` to enable voice-to-text in your ChatGPT alternative.

## Reverse Proxy

Configure your reverse proxy to forward to port 8000. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

The models volume stores downloaded Whisper models. These can be re-downloaded, so backups are optional. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Transcription Returns Empty

**Symptom:** API returns empty text.
**Fix:** Check that the audio file is in a supported format (mp3, wav, m4a, flac, ogg, webm). Verify the file isn't corrupted. Check container logs: `docker logs whisper`.

### Out of Memory

**Symptom:** Container crashes with OOM error.
**Fix:** Use a smaller model. `faster-whisper-small` works well on 4 GB VRAM. For CPU mode, ensure sufficient system RAM (model size + 2 GB overhead).

### Slow Transcription

**Symptom:** Transcription takes minutes for short audio.
**Fix:** Ensure GPU mode is active (check `nvidia-smi`). Use a smaller model. Use the CUDA image variant, not CPU.

## Resource Requirements

- **VRAM:** 1-5 GB depending on model size
- **RAM:** 2-8 GB (CPU mode depends on model size)
- **CPU:** Medium (CPU-only mode is 5-10x slower than GPU)
- **Disk:** 100 MB - 3 GB per model

## Verdict

Self-hosted Whisper gives you private, unlimited speech-to-text transcription with no API costs. The faster-whisper implementation is significantly faster than the original OpenAI Whisper while maintaining accuracy. For most self-hosters, the `small` or `medium` model provides the best speed/accuracy balance.

**Choose Whisper** for standalone speech-to-text. **Choose [LocalAI](/apps/localai)** if you want Whisper combined with LLM inference and image generation in one service.

## Related

- [How to Self-Host Open WebUI](/apps/open-webui)
- [How to Self-Host Ollama](/apps/ollama)
- [How to Self-Host LocalAI](/apps/localai)
- [Self-Hosted ChatGPT Alternatives](/replace/chatgpt)
- [Best Self-Hosted AI Tools](/best/ai-ml)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

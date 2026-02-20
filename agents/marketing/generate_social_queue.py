#!/usr/bin/env python3
"""Generate 120 unique social media queue entries for 40 newly published articles."""

import json

QUEUE_FILE = "/opt/selfhosting-sh/queues/social-queue.jsonl"
TIMESTAMP = "2026-02-20T06:15:00Z"
BASE = "https://selfhosting.sh"

# Each article: (slug, x_text, bluesky_text, mastodon_text)
# All texts are genuinely unique per platform — different angles, openers, structures.

articles = [
    # 1. Ollama
    {
        "slug": "/apps/ollama/",
        "x": f"Ollama makes running LLMs locally dead simple. Llama 3, Mistral, CodeLlama — one command to pull and run. No cloud API bills. {BASE}/apps/ollama/ #selfhosted #homelab",
        "bluesky": f"If you haven't tried Ollama yet, you're missing out. Pull any LLM — Llama 3, Mistral, CodeLlama — and run it locally with a single command. Clean CLI, OpenAI-compatible API. {BASE}/apps/ollama/",
        "mastodon": f"Want to run large language models on your own hardware? Ollama is the easiest way to get started.\n\nSupports Llama 3, Mistral, CodeLlama and dozens more. Simple CLI, built-in API server.\n\n{BASE}/apps/ollama/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #ollama",
    },
    # 2. Open WebUI
    {
        "slug": "/apps/open-webui/",
        "x": f"Open WebUI gives you a ChatGPT-style interface for local LLMs. Connects to Ollama or any OpenAI-compatible API. Your data stays yours. {BASE}/apps/open-webui/ #selfhosted",
        "bluesky": f"Miss the ChatGPT interface but want to keep your data private? Open WebUI connects to Ollama and any OpenAI-compatible API. Beautiful UI, fully local. {BASE}/apps/open-webui/",
        "mastodon": f"Open WebUI is a polished ChatGPT-like frontend for self-hosted LLMs. Connect it to Ollama or any OpenAI-compatible backend.\n\nConversation history, model switching, document upload — on your hardware.\n\n{BASE}/apps/open-webui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #chatgpt #openwebui",
    },
    # 3. LocalAI
    {
        "slug": "/apps/localai/",
        "x": f"LocalAI: OpenAI API drop-in replacement on your own hardware. Swap one URL and your existing code works with local models. {BASE}/apps/localai/ #selfhosted #homelab",
        "bluesky": f"Already using the OpenAI API? LocalAI lets you swap the endpoint URL and run everything locally. Same API, your hardware, zero API costs. {BASE}/apps/localai/",
        "mastodon": f"LocalAI provides a fully compatible OpenAI API on your own infrastructure. No code changes — just point your apps at a different URL.\n\nText generation, embeddings, image gen, and more.\n\n{BASE}/apps/localai/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #openai #localai",
    },
    # 4. Text Generation WebUI
    {
        "slug": "/apps/text-generation-webui/",
        "x": f"oobabooga's text-generation-webui: the Swiss army knife of local LLM interfaces. GPTQ, GGML, ExLlama — load any model format. {BASE}/apps/text-generation-webui/ #selfhosted",
        "bluesky": f"Need fine-grained control over local LLMs? text-generation-webui by oobabooga supports every quantization format and advanced sampling controls most UIs skip. {BASE}/apps/text-generation-webui/",
        "mastodon": f"For power users who want full control over local LLMs, text-generation-webui (oobabooga) is unmatched.\n\nGPTQ, GGML, AWQ, ExLlama support. Advanced sampling, extensions, character presets.\n\n{BASE}/apps/text-generation-webui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #machinelearning",
    },
    # 5. Stable Diffusion WebUI
    {
        "slug": "/apps/stable-diffusion-webui/",
        "x": f"AUTOMATIC1111's Stable Diffusion WebUI — the definitive self-hosted image gen tool. Hundreds of models, ControlNet, inpainting, your GPU. {BASE}/apps/stable-diffusion-webui/ #selfhosted",
        "bluesky": f"Stop paying per image. AUTOMATIC1111's Stable Diffusion WebUI runs on your GPU with full access to hundreds of models, ControlNet, inpainting, and more. {BASE}/apps/stable-diffusion-webui/",
        "mastodon": f"AUTOMATIC1111's Stable Diffusion WebUI remains the gold standard for self-hosted image generation.\n\nHundreds of models, ControlNet, inpainting, img2img, massive extension ecosystem.\n\nSetup guide:\n{BASE}/apps/stable-diffusion-webui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #stablediffusion #generativeart",
    },
    # 6. ComfyUI
    {
        "slug": "/apps/comfyui/",
        "x": f"ComfyUI takes Stable Diffusion to another level. Node-based interface, reusable pipelines, serious control over every step. {BASE}/apps/comfyui/ #selfhosted #homelab",
        "bluesky": f"ComfyUI's node-based approach to image generation is genuinely powerful. Build reusable workflows, chain operations, control every pipeline step. {BASE}/apps/comfyui/",
        "mastodon": f"If you've outgrown AUTOMATIC1111, ComfyUI's node-based workflow editor is what you want next.\n\nBuild complex, reusable image gen pipelines. Chain samplers, LoRAs, ControlNet visually.\n\n{BASE}/apps/comfyui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #stablediffusion #comfyui #generativeart",
    },
    # 7. vLLM
    {
        "slug": "/apps/vllm/",
        "x": f"vLLM serves LLMs at production scale. PagedAttention, continuous batching, up to 24x higher throughput than naive serving. {BASE}/apps/vllm/ #selfhosted",
        "bluesky": f"Running LLMs in production? vLLM's PagedAttention and continuous batching deliver up to 24x higher throughput than naive HuggingFace serving. {BASE}/apps/vllm/",
        "mastodon": f"vLLM is the high-performance LLM inference engine for production workloads.\n\nPagedAttention, continuous batching, OpenAI-compatible API. Up to 24x better throughput.\n\n{BASE}/apps/vllm/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #vllm #machinelearning",
    },
    # 8. Whisper
    {
        "slug": "/apps/whisper/",
        "x": f"Self-host OpenAI Whisper for unlimited speech-to-text. No API limits, no per-minute charges, complete privacy. {BASE}/apps/whisper/ #selfhosted #homelab",
        "bluesky": f"OpenAI's Whisper runs beautifully on your own hardware. Unlimited transcription, no API costs, no data leaving your network. Accuracy is impressive. {BASE}/apps/whisper/",
        "mastodon": f"Self-hosting OpenAI Whisper gives you unlimited, private speech-to-text.\n\nNo per-minute charges. No cloud dependency. 99 languages supported. Accuracy rivals commercial services.\n\n{BASE}/apps/whisper/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #whisper #speechtotext #transcription",
    },
    # 9. Flowise
    {
        "slug": "/apps/flowise/",
        "x": f"Flowise: build LLM-powered apps with drag-and-drop. Chains, agents, RAG pipelines — no code required. Self-hosted LangChain made visual. {BASE}/apps/flowise/ #selfhosted",
        "bluesky": f"Want to build LLM apps without writing code? Flowise gives you a visual drag-and-drop builder for chains, agents, and RAG pipelines. All self-hosted. {BASE}/apps/flowise/",
        "mastodon": f"Flowise is a no-code builder for LLM applications you self-host.\n\nDrag-and-drop chains, agents, RAG pipelines. Connect to Ollama, OpenAI, or any compatible backend.\n\n{BASE}/apps/flowise/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #langchain #nocode #flowise",
    },
    # 10. Langflow
    {
        "slug": "/apps/langflow/",
        "x": f"Langflow turns LangChain into a visual builder. Drag components, connect them, deploy — all from a browser. {BASE}/apps/langflow/ #selfhosted",
        "bluesky": f"Langflow gives you a visual canvas for LangChain workflows. Connect LLM components, test in real time, deploy — all self-hosted. {BASE}/apps/langflow/",
        "mastodon": f"Langflow provides a visual interface for building LangChain apps on your own infrastructure.\n\nDrag-and-drop components, real-time testing, Python code export. Great for prototyping LLM workflows.\n\n{BASE}/apps/langflow/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #langchain #langflow #python",
    },
    # 11. Tabby
    {
        "slug": "/apps/tabby/",
        "x": f"Tabby: self-hosted GitHub Copilot alternative. Code completion powered by local models — your code never leaves your machine. {BASE}/apps/tabby/ #selfhosted #homelab",
        "bluesky": f"Why send your code to Microsoft's servers? Tabby gives you Copilot-style code completion running entirely on your own hardware. {BASE}/apps/tabby/",
        "mastodon": f"Tabby is the self-hosted GitHub Copilot alternative you've been waiting for.\n\nCode completion via local models — StarCoder, CodeLlama, more. VS Code + JetBrains extensions. Your code stays private.\n\n{BASE}/apps/tabby/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #coding #copilot #tabby #developer",
    },
    # 12. Ollama vs LocalAI
    {
        "slug": "/compare/ollama-vs-localai/",
        "x": f"Ollama vs LocalAI — which local LLM runner? One optimizes for simplicity, the other for API compatibility. We break it down. {BASE}/compare/ollama-vs-localai/ #selfhosted",
        "bluesky": f"Choosing between Ollama and LocalAI? Ollama wins on simplicity and DX. LocalAI wins on OpenAI API compat and model format support. Full comparison: {BASE}/compare/ollama-vs-localai/",
        "mastodon": f"Ollama vs LocalAI — two popular self-hosted LLM runners compared.\n\nOllama: dead simple, great CLI, fast setup.\nLocalAI: full OpenAI API compat, broader model support.\n\nWhich fits your use case?\n\n{BASE}/compare/ollama-vs-localai/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #ollama #localai",
    },
    # 13. Open WebUI vs Text Generation WebUI
    {
        "slug": "/compare/open-webui-vs-text-generation-webui/",
        "x": f"Open WebUI vs text-generation-webui: polished ChatGPT clone vs power-user LLM toolkit. Different tools, different users. {BASE}/compare/open-webui-vs-text-generation-webui/ #selfhosted",
        "bluesky": f"Open WebUI is beautiful and beginner-friendly. text-generation-webui gives you every knob and dial. Our comparison helps you pick the right LLM frontend. {BASE}/compare/open-webui-vs-text-generation-webui/",
        "mastodon": f"Two different approaches to self-hosted LLM interfaces:\n\nOpen WebUI: clean ChatGPT-like UX, easy setup, great for teams.\ntext-generation-webui: advanced controls, every model format, power-user focused.\n\n{BASE}/compare/open-webui-vs-text-generation-webui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #chatgpt",
    },
    # 14. Stable Diffusion vs ComfyUI
    {
        "slug": "/compare/stable-diffusion-vs-comfyui/",
        "x": f"AUTOMATIC1111 vs ComfyUI: simple image gen vs node-based workflows. Both excellent — depends on how deep you want to go. {BASE}/compare/stable-diffusion-vs-comfyui/ #selfhosted",
        "bluesky": f"AUTOMATIC1111 gets you generating images in minutes. ComfyUI takes longer to learn but unlocks workflows you can't build anywhere else. How to decide: {BASE}/compare/stable-diffusion-vs-comfyui/",
        "mastodon": f"Stable Diffusion WebUI (AUTOMATIC1111) vs ComfyUI — the two dominant self-hosted image gen interfaces.\n\nA1111: beginner-friendly, extensions, quick results.\nComfyUI: node-based, advanced workflows, max control.\n\n{BASE}/compare/stable-diffusion-vs-comfyui/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #stablediffusion #comfyui #generativeart",
    },
    # 15. Ollama vs vLLM
    {
        "slug": "/compare/ollama-vs-vllm/",
        "x": f"Ollama vs vLLM: dev-friendly local inference vs production throughput. Pick Ollama for dev, vLLM when you serve real traffic. {BASE}/compare/ollama-vs-vllm/ #selfhosted",
        "bluesky": f"Ollama is perfect for development and personal use. vLLM is built for production with 24x better throughput. They solve different problems. {BASE}/compare/ollama-vs-vllm/",
        "mastodon": f"Ollama vs vLLM — two LLM serving tools for very different use cases.\n\nOllama: simple CLI, quick experimentation, great DX.\nvLLM: PagedAttention, continuous batching, production throughput.\n\nWhich do you need?\n\n{BASE}/compare/ollama-vs-vllm/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #llm #ollama #vllm",
    },
    # 16. Flowise vs Langflow
    {
        "slug": "/compare/flowise-vs-langflow/",
        "x": f"Flowise vs Langflow: two no-code LLM builders, different philosophies. We tested both — here's which to pick. {BASE}/compare/flowise-vs-langflow/ #selfhosted",
        "bluesky": f"Building LLM apps visually? Flowise and Langflow both offer drag-and-drop builders but they differ in meaningful ways. Hands-on comparison: {BASE}/compare/flowise-vs-langflow/",
        "mastodon": f"Flowise vs Langflow — two visual builders for LLM applications, both self-hosted.\n\nFlowise: JS-based, lighter, strong chatbot focus.\nLangflow: Python-native, better LangChain integration, code export.\n\n{BASE}/compare/flowise-vs-langflow/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #nocode #langchain #flowise #langflow",
    },
    # 17. Tabby vs Continue
    {
        "slug": "/compare/tabby-vs-continue/",
        "x": f"Tabby vs Continue: self-hosted Copilot alternatives. One runs its own server, the other is a flexible IDE extension. {BASE}/compare/tabby-vs-continue/ #selfhosted",
        "bluesky": f"Replacing GitHub Copilot? Tabby runs its own inference server. Continue is an IDE extension connecting to any backend. Different architectures, different tradeoffs. {BASE}/compare/tabby-vs-continue/",
        "mastodon": f"Tabby vs Continue — self-hosted code completion alternatives to GitHub Copilot.\n\nTabby: integrated server + model, purpose-built.\nContinue: flexible IDE extension, bring your own backend.\n\n{BASE}/compare/tabby-vs-continue/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #coding #copilot #developer #tabby",
    },
    # 18. Elasticsearch vs OpenSearch
    {
        "slug": "/compare/elasticsearch-vs-opensearch/",
        "x": f"Elasticsearch vs OpenSearch: the fork that split search. License drama aside, there are real technical differences now. {BASE}/compare/elasticsearch-vs-opensearch/ #selfhosted",
        "bluesky": f"Three years after the fork, Elasticsearch and OpenSearch have genuinely diverged. Features, performance, licensing — full comparison: {BASE}/compare/elasticsearch-vs-opensearch/",
        "mastodon": f"Elasticsearch vs OpenSearch — the fork that changed search.\n\nElasticsearch went SSPL, AWS forked it under Apache 2.0. They've diverged significantly since.\n\nFeatures, performance, licensing compared:\n{BASE}/compare/elasticsearch-vs-opensearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #elasticsearch #opensearch #search",
    },
    # 19. Typesense vs Elasticsearch
    {
        "slug": "/compare/typesense-vs-elasticsearch/",
        "x": f"Typesense vs Elasticsearch: lightweight instant search vs enterprise powerhouse. Most projects don't need ES complexity. {BASE}/compare/typesense-vs-elasticsearch/ #selfhosted",
        "bluesky": f"Be honest — do you actually need Elasticsearch? Typesense gives you instant typo-tolerant search with a fraction of the operational overhead. {BASE}/compare/typesense-vs-elasticsearch/",
        "mastodon": f"Typesense vs Elasticsearch — do you need a search engine or a search platform?\n\nTypesense: instant setup, typo-tolerant, low resources, dev-friendly.\nElasticsearch: analytics, complex queries, enterprise scale.\n\n{BASE}/compare/typesense-vs-elasticsearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #typesense #elasticsearch",
    },
    # 20. Best AI/ML roundup
    {
        "slug": "/best/ai-ml/",
        "x": f"The definitive list of self-hosted AI & ML tools in 2026. LLM runners, image gen, code assistants, speech-to-text — all tested. {BASE}/best/ai-ml/ #selfhosted #homelab",
        "bluesky": f"We tested every major self-hosted AI tool — Ollama to Stable Diffusion to Whisper. Here are the best ones and when to use each. {BASE}/best/ai-ml/",
        "mastodon": f"Best self-hosted AI & ML tools in 2026 — our comprehensive roundup.\n\nLLM runners, chat interfaces, image gen, code completion, speech-to-text, workflow builders. All tested and compared.\n\n{BASE}/best/ai-ml/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #machinelearning #llm #stablediffusion",
    },
    # 21. Replace ChatGPT
    {
        "slug": "/replace/chatgpt/",
        "x": f"Replace ChatGPT with something you control. Open WebUI + Ollama gives you 90% of the experience with 100% privacy. {BASE}/replace/chatgpt/ #selfhosted",
        "bluesky": f"You don't need ChatGPT. Open WebUI + Ollama running locally gives you a remarkably similar experience with zero data leaving your machine. {BASE}/replace/chatgpt/",
        "mastodon": f"Ready to ditch ChatGPT? Here are the best self-hosted alternatives.\n\nOpen WebUI + Ollama for the closest experience. LocalAI for API compat. text-generation-webui for power users.\n\nAll options compared:\n{BASE}/replace/chatgpt/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #chatgpt #privacy #llm",
    },
    # 22. Replace Midjourney
    {
        "slug": "/replace/midjourney/",
        "x": f"Self-hosted Midjourney alternatives work now. Stable Diffusion + ComfyUI on a decent GPU = production-quality images, no subscription. {BASE}/replace/midjourney/ #selfhosted",
        "bluesky": f"Tired of Midjourney's subscription? A GPU and Stable Diffusion WebUI gets you unlimited image generation with no monthly fee. The gap has closed. {BASE}/replace/midjourney/",
        "mastodon": f"Self-hosted Midjourney alternatives have come a long way.\n\nA1111 for ease of use, ComfyUI for advanced workflows, Fooocus for Midjourney-like simplicity.\n\nAll options + hardware requirements:\n{BASE}/replace/midjourney/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #midjourney #stablediffusion #generativeart",
    },
    # 23. Replace GitHub Copilot
    {
        "slug": "/replace/github-copilot/",
        "x": f"$10/month for Copilot? Tabby + a local model = code completion that never phones home. Your codebase stays private. {BASE}/replace/github-copilot/ #selfhosted",
        "bluesky": f"Self-hosted Copilot alternatives are production-ready. Tabby and Continue both offer solid code completion without sending your code to Microsoft. {BASE}/replace/github-copilot/",
        "mastodon": f"Stop paying $10/month to send code to Microsoft's servers.\n\nTabby, Continue, and others now offer solid self-hosted code completion powered by local models.\n\nFull comparison + setup:\n{BASE}/replace/github-copilot/\n\n#selfhosted #homelab #docker #linux #foss #opensource #ai #copilot #coding #developer #privacy",
    },
    # 24. AI/ML Hardware
    {
        "slug": "/hardware/ai-ml-hardware/",
        "x": f"What GPU do you actually need for local AI? A 3060 12GB handles most 7B models. We break down every budget tier. {BASE}/hardware/ai-ml-hardware/ #selfhosted #homelab",
        "bluesky": f"Planning a local AI setup? We cover every budget tier — from a $200 used GPU for 7B models to multi-GPU rigs for 70B. Real benchmarks, real picks. {BASE}/hardware/ai-ml-hardware/",
        "mastodon": f"What hardware do you actually need to run AI models locally?\n\nBudget GPUs for 7B, mid-range for 13B, high-end for 70B+. CPU inference options too. Real benchmarks included.\n\n{BASE}/hardware/ai-ml-hardware/\n\n#selfhosted #homelab #linux #ai #hardware #gpu #llm #machinelearning #nvidia #amd",
    },
    # 25. SearXNG
    {
        "slug": "/apps/searxng/",
        "x": f"SearXNG aggregates results from 70+ search engines without tracking you. Self-host your own private metasearch. {BASE}/apps/searxng/ #selfhosted #homelab",
        "bluesky": f"SearXNG is a privacy-respecting metasearch engine you self-host. Pulls from 70+ engines, strips the tracking, gives you clean results. {BASE}/apps/searxng/",
        "mastodon": f"SearXNG is the self-hosted metasearch engine that respects your privacy.\n\nAggregates 70+ search engines — Google, Bing, DDG, more — zero tracking. Fully customizable.\n\nDocker setup guide:\n{BASE}/apps/searxng/\n\n#selfhosted #homelab #docker #linux #foss #opensource #privacy #search #searxng",
    },
    # 26. Meilisearch
    {
        "slug": "/apps/meilisearch/",
        "x": f"Meilisearch: instant typo-tolerant search, absurdly easy setup. One binary, sub-50ms results. Perfect for app search. {BASE}/apps/meilisearch/ #selfhosted",
        "bluesky": f"Meilisearch gives you Algolia-like instant search you can self-host. Typo tolerance, faceting, sub-50ms results out of the box. Setup takes minutes. {BASE}/apps/meilisearch/",
        "mastodon": f"Meilisearch is the self-hosted search engine that just works.\n\nInstant results, typo tolerance, faceted search, customizable ranking — minimal config needed. Written in Rust.\n\nDocker setup guide:\n{BASE}/apps/meilisearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #meilisearch #rust",
    },
    # 27. Typesense
    {
        "slug": "/apps/typesense/",
        "x": f"Typesense: search-as-you-type with faceting, geo search, and vector search. Open source, low memory footprint. {BASE}/apps/typesense/ #selfhosted",
        "bluesky": f"Typesense is what you reach for when Elasticsearch is overkill. Search-as-you-type, faceting, geo search — runs on surprisingly little RAM. {BASE}/apps/typesense/",
        "mastodon": f"Typesense is an open-source search engine built for speed and simplicity.\n\nSearch-as-you-type, typo tolerance, faceting, geo search, vector search. Minimal resources vs Elasticsearch.\n\n{BASE}/apps/typesense/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #typesense",
    },
    # 28. Whoogle
    {
        "slug": "/apps/whoogle/",
        "x": f"Whoogle: Google results without Google tracking. Self-host it, search in peace. Lightweight, no JS required on the client. {BASE}/apps/whoogle/ #selfhosted #homelab",
        "bluesky": f"Want Google's search quality without the surveillance? Whoogle proxies results through your server. No ads, no tracking, no JavaScript needed. {BASE}/apps/whoogle/",
        "mastodon": f"Whoogle is the simplest way to get Google results without Google tracking you.\n\nSelf-hosted proxy that strips ads, tracking, and AMP. No JS required, works in any browser.\n\n{BASE}/apps/whoogle/\n\n#selfhosted #homelab #docker #linux #foss #opensource #privacy #search #google #whoogle",
    },
    # 29. Elasticsearch
    {
        "slug": "/apps/elasticsearch/",
        "x": f"Elasticsearch remains the standard for search + analytics. Here's how to self-host it properly with Docker Compose. {BASE}/apps/elasticsearch/ #selfhosted",
        "bluesky": f"Elasticsearch is still the go-to for serious search and analytics. Our guide covers Docker self-hosting — cluster setup, security, and tuning. {BASE}/apps/elasticsearch/",
        "mastodon": f"Elasticsearch — the industry-standard search and analytics engine — fully self-hosted.\n\nFull-text search, aggregations, log analytics. Docker deployment, cluster config, security, and tuning covered.\n\n{BASE}/apps/elasticsearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #elasticsearch #analytics #devops",
    },
    # 30. OpenSearch
    {
        "slug": "/apps/opensearch/",
        "x": f"OpenSearch: Elasticsearch's Apache 2.0 fork. All the power, none of the licensing headaches. Docker setup guide inside. {BASE}/apps/opensearch/ #selfhosted",
        "bluesky": f"OpenSearch gives you Elasticsearch capabilities under Apache 2.0. If licensing matters to you (it should), this is the fork to choose. {BASE}/apps/opensearch/",
        "mastodon": f"OpenSearch is AWS's Apache 2.0 fork of Elasticsearch — matured into a strong standalone project.\n\nFull-text search, dashboards, observability, security built in. Truly open source.\n\n{BASE}/apps/opensearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #opensearch #elasticsearch #analytics",
    },
    # 31. ManticoreSearch
    {
        "slug": "/apps/manticoresearch/",
        "x": f"ManticoreSearch: SQL-compatible full-text search, 10x lighter than Elasticsearch. If you know SQL, you know the query language. {BASE}/apps/manticoresearch/ #selfhosted",
        "bluesky": f"ManticoreSearch lets you do full-text search with plain SQL queries. Fraction of Elasticsearch's resource needs. Seriously underrated. {BASE}/apps/manticoresearch/",
        "mastodon": f"ManticoreSearch is a SQL-compatible full-text search engine using a fraction of Elasticsearch's resources.\n\nKnow SQL? You already know the query language. Built-in replication, columnar storage, real-time indexing.\n\n{BASE}/apps/manticoresearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #manticoresearch #sql #database",
    },
    # 32. Sonic
    {
        "slug": "/apps/sonic/",
        "x": f"Sonic: lightweight search backend in Rust. ~30MB RAM. When you need search without the Elasticsearch overhead. {BASE}/apps/sonic/ #selfhosted",
        "bluesky": f"Need search but can't spare RAM for Elasticsearch? Sonic uses ~30MB and provides fast full-text search. Written in Rust, built for efficiency. {BASE}/apps/sonic/",
        "mastodon": f"Sonic proves you don't need gigabytes of RAM for fast full-text search.\n\nWritten in Rust, ~30MB memory. Lightweight search index that pairs with your existing database.\n\n{BASE}/apps/sonic/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #rust #sonic",
    },
    # 33. SearXNG vs Whoogle
    {
        "slug": "/compare/searxng-vs-whoogle/",
        "x": f"SearXNG vs Whoogle: multi-engine metasearch vs clean Google proxy. Both private — different approaches. {BASE}/compare/searxng-vs-whoogle/ #selfhosted",
        "bluesky": f"Two paths to private search: SearXNG pulls from 70+ engines. Whoogle proxies Google. One gives diversity, the other gives Google minus tracking. {BASE}/compare/searxng-vs-whoogle/",
        "mastodon": f"SearXNG vs Whoogle — two self-hosted approaches to private search.\n\nSearXNG: metasearch across 70+ engines, highly customizable.\nWhoogle: clean Google results, minimal setup.\n\nWhich fits your needs?\n\n{BASE}/compare/searxng-vs-whoogle/\n\n#selfhosted #homelab #docker #linux #foss #opensource #privacy #search #searxng #whoogle",
    },
    # 34. Meilisearch vs Typesense
    {
        "slug": "/compare/meilisearch-vs-typesense/",
        "x": f"Meilisearch vs Typesense: the two best modern self-hosted search engines. Both fast, both simple — here's where they differ. {BASE}/compare/meilisearch-vs-typesense/ #selfhosted",
        "bluesky": f"Meilisearch and Typesense are both excellent self-hosted search engines. The differences are subtle but real. We tested both head-to-head. {BASE}/compare/meilisearch-vs-typesense/",
        "mastodon": f"Meilisearch vs Typesense — two leading modern self-hosted search engines.\n\nBoth offer instant results, typo tolerance, easy setup. Differences: indexing speed, filtering, vector search support.\n\n{BASE}/compare/meilisearch-vs-typesense/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #meilisearch #typesense",
    },
    # 35. Meilisearch vs Elasticsearch
    {
        "slug": "/compare/meilisearch-vs-elasticsearch/",
        "x": f"Meilisearch vs Elasticsearch: you probably don't need the complexity. For app search, Meilisearch wins. For analytics, ES. {BASE}/compare/meilisearch-vs-elasticsearch/ #selfhosted",
        "bluesky": f"Honest take: Meilisearch is better for app search. Elasticsearch is better for analytics and logs. Most people pick ES by default when they shouldn't. {BASE}/compare/meilisearch-vs-elasticsearch/",
        "mastodon": f"Meilisearch vs Elasticsearch — simplicity vs power.\n\nMeilisearch: instant app search, minutes to set up, low resources.\nElasticsearch: analytics, log aggregation, complex queries.\n\nPick the right tool:\n{BASE}/compare/meilisearch-vs-elasticsearch/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #meilisearch #elasticsearch",
    },
    # 36. SearXNG vs Google
    {
        "slug": "/compare/searxng-vs-google/",
        "x": f"Can self-hosted SearXNG actually replace Google? The answer is more nuanced than you'd expect. {BASE}/compare/searxng-vs-google/ #selfhosted",
        "bluesky": f"Can SearXNG replace Google? We compared result quality, speed, and features. The privacy-search tradeoff isn't as bad as you might think. {BASE}/compare/searxng-vs-google/",
        "mastodon": f"SearXNG vs Google — can a self-hosted metasearch engine genuinely replace Google?\n\nResult quality, speed, features, and the privacy tradeoff. The gap is smaller than most assume.\n\n{BASE}/compare/searxng-vs-google/\n\n#selfhosted #homelab #docker #linux #foss #opensource #privacy #search #searxng #google #degoogle",
    },
    # 37. Best Search Engines roundup
    {
        "slug": "/best/search-engines/",
        "x": f"Every self-hosted search engine worth running in 2026. Privacy metasearch to full-text indexing — ranked and compared. {BASE}/best/search-engines/ #selfhosted #homelab",
        "bluesky": f"We tested every major self-hosted search engine: SearXNG, Meilisearch, Typesense, Elasticsearch, Sonic, and more. Our picks by use case: {BASE}/best/search-engines/",
        "mastodon": f"Best self-hosted search engines in 2026 — comprehensive roundup.\n\nPrivacy metasearch, app search, full-text indexing, analytics. Every major option tested and compared.\n\n{BASE}/best/search-engines/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #meilisearch #typesense #elasticsearch #searxng",
    },
    # 38. Replace Google Search
    {
        "slug": "/replace/google-search/",
        "x": f"Self-hosted Google Search alternatives that work. SearXNG and Whoogle lead — both fully respect your privacy. {BASE}/replace/google-search/ #selfhosted",
        "bluesky": f"Replacing Google Search with something self-hosted? SearXNG for multi-engine results, Whoogle for Google results minus tracking. Both solid. {BASE}/replace/google-search/",
        "mastodon": f"Replace Google Search with something you control.\n\nSearXNG: 70+ engines, zero tracking.\nWhoogle: Google results without surveillance.\n\nBoth easy to self-host. Full guide:\n{BASE}/replace/google-search/\n\n#selfhosted #homelab #docker #linux #foss #opensource #privacy #search #degoogle #google",
    },
    # 39. Replace Algolia
    {
        "slug": "/replace/algolia/",
        "x": f"Algolia charges per search request. Meilisearch and Typesense give you the same instant search, self-hosted, free. {BASE}/replace/algolia/ #selfhosted",
        "bluesky": f"Paying Algolia for search? Meilisearch and Typesense are self-hosted alternatives with near-identical DX. Same speed, zero ongoing cost. {BASE}/replace/algolia/",
        "mastodon": f"Self-hosted Algolia alternatives matching the developer experience.\n\nMeilisearch: closest to Algolia's API, easiest migration.\nTypesense: excellent search-as-you-type, strong faceting.\n\nZero per-request charges.\n\n{BASE}/replace/algolia/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #algolia #meilisearch #typesense #webdev",
    },
    # 40. Search Engine Setup foundation
    {
        "slug": "/foundations/search-engine-setup/",
        "x": f"Self-hosted search from scratch: indexing, relevance tuning, integration patterns. Foundation knowledge for any engine. {BASE}/foundations/search-engine-setup/ #selfhosted",
        "bluesky": f"New to self-hosted search? Our foundation guide covers the fundamentals: indexing strategies, relevance tuning, and app integration patterns. {BASE}/foundations/search-engine-setup/",
        "mastodon": f"Foundation guide to self-hosted search — everything you need before picking an engine.\n\nIndexing strategies, relevance tuning, search-as-you-type patterns, integration approaches.\n\n{BASE}/foundations/search-engine-setup/\n\n#selfhosted #homelab #docker #linux #foss #opensource #search #tutorial #webdev",
    },
]


def generate_entries():
    entries = []
    for article in articles:
        slug = article["slug"]
        url = f"{BASE}{slug}"
        for platform in ["x", "bluesky", "mastodon"]:
            entries.append({
                "platform": platform,
                "type": "article_link",
                "text": article[platform],
                "url": url,
                "queued_at": TIMESTAMP,
            })
    return entries


def validate_entries(entries):
    """Validate character limits and uniqueness."""
    limits = {"x": 280, "bluesky": 300, "mastodon": 500}
    issues = []

    for i, entry in enumerate(entries):
        platform = entry["platform"]
        text = entry["text"]
        limit = limits[platform]
        if len(text) > limit:
            issues.append(f"Entry {i}: {platform} text is {len(text)} chars (limit {limit}) — slug: {entry['url']}")

    # Check uniqueness
    texts = [e["text"] for e in entries]
    dupes = len(texts) - len(set(texts))
    if dupes > 0:
        issues.append(f"DUPLICATE TEXT: {dupes} duplicate(s) detected!")

    return issues


def main():
    entries = generate_entries()

    # Validate before writing
    issues = validate_entries(entries)
    if issues:
        print("VALIDATION ISSUES:")
        for issue in issues:
            print(f"  - {issue}")
        print()

    platform_counts = {}
    for e in entries:
        platform_counts[e["platform"]] = platform_counts.get(e["platform"], 0) + 1

    # Append to queue
    with open(QUEUE_FILE, "a") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")

    print(f"Appended {len(entries)} entries to {QUEUE_FILE}")
    print(f"  Per platform: {platform_counts}")
    print(f"  Articles covered: {len(articles)}")


if __name__ == "__main__":
    main()

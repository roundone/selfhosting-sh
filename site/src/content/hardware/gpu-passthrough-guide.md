---
title: "GPU Passthrough for Home Servers"
description: "Complete guide to GPU passthrough for home servers. Plex transcoding, AI inference, and gaming VMs with NVIDIA and AMD GPUs on Proxmox."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "gpu", "proxmox", "transcoding"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

For **Plex/Jellyfin hardware transcoding:** Get an [Intel N100 mini PC](/hardware/intel-n100-mini-pc/) with Quick Sync — it handles 10+ simultaneous transcodes at 8W. No discrete GPU needed.

For **AI inference (Ollama, LocalAI):** NVIDIA GeForce RTX 3060 12GB (~$200 used) is the best value — 12GB VRAM runs 7B-13B parameter models. Pair with Proxmox GPU passthrough.

For **gaming VM + server on one box:** NVIDIA RTX 4060 or AMD RX 7600 passed through to a Windows VM on Proxmox, while Linux containers run on the host.

## Use Cases for GPUs in Home Servers

| Use Case | GPU Required? | Best Option |
|----------|--------------|-------------|
| [Plex](/apps/plex/)/[Jellyfin](/apps/jellyfin/) transcoding | No — Intel Quick Sync is better | Intel iGPU (N100, 12th gen+) |
| AI/LLM inference (Ollama) | Yes — VRAM matters most | NVIDIA RTX 3060 12GB |
| Stable Diffusion / ComfyUI | Yes — VRAM + compute | NVIDIA RTX 3090 24GB |
| Gaming VM (single-player) | Yes — passthrough to VM | NVIDIA RTX 4060 / AMD RX 7600 |
| Security camera AI (Frigate) | No — Intel iGPU or Coral TPU | Google Coral USB ($30) |
| Video encoding (FFmpeg) | Optional — GPU acceleration helps | NVIDIA NVENC (any GTX/RTX) |

### Why Intel Quick Sync Beats Discrete GPUs for Transcoding

Intel's integrated GPU has dedicated hardware video encode/decode blocks that are more efficient than discrete GPUs for transcoding:

| Method | Power Draw | Simultaneous 4K Transcodes | Cost |
|--------|-----------|---------------------------|------|
| Intel N100 Quick Sync | 6-10W | 10-15 | $150 (whole PC) |
| Intel 12th gen Quick Sync | 15-25W | 20+ | $200-300 (whole PC) |
| NVIDIA RTX 3060 NVENC | 30-80W | 5-8 (software limit) | $200 (GPU alone) |
| CPU transcoding (8 cores) | 80-150W | 2-3 | Varies |

NVIDIA also software-limits concurrent NVENC sessions to 5 on consumer GPUs (bypassed with a driver patch, but janky). Intel has no such limit.

## GPU Recommendations by Use Case

### AI/LLM Inference

VRAM is the bottleneck. A 7B parameter model (Llama 3 7B, Mistral 7B) needs ~4-5GB VRAM. A 13B model needs ~8-10GB. A 70B model needs ~40GB.

| GPU | VRAM | Performance (tokens/sec on 7B) | Power | Used Price |
|-----|------|-------------------------------|-------|-----------|
| RTX 3060 12GB | 12 GB | ~35 t/s | 170W TDP | ~$200 |
| RTX 3090 24GB | 24 GB | ~55 t/s | 350W TDP | ~$600 |
| RTX 4060 8GB | 8 GB | ~40 t/s | 115W TDP | ~$280 |
| RTX 4090 24GB | 24 GB | ~90 t/s | 450W TDP | ~$1,600 |
| Tesla P40 24GB | 24 GB | ~25 t/s | 250W TDP | ~$150 |

**Best value: RTX 3060 12GB.** The 12GB VRAM is unusual for its tier — most xx60 cards have 6-8GB. This runs 7B-13B models comfortably. Used prices around $200 make it the clear winner for home AI.

**Budget pick: Tesla P40.** 24GB VRAM for ~$150 used. Slower compute than consumer cards, no video output (data center card), needs active cooling (add a $20 fan shroud). But 24GB VRAM for $150 is unbeatable for running larger models.

### Gaming VM

| GPU | Performance Tier | Power | Price |
|-----|-----------------|-------|-------|
| RTX 4060 | 1080p/1440p high | 115W | ~$280 |
| RX 7600 | 1080p high | 165W | ~$230 |
| RTX 4070 | 1440p/4K medium | 200W | ~$480 |
| RX 7800 XT | 1440p/4K medium | 263W | ~$420 |

AMD cards work well for passthrough but require more configuration (vendor-id reset workaround). NVIDIA is more straightforward for passthrough but requires the `vfio` driver trick on consumer GPUs.

### Video Processing (FFmpeg/Handbrake)

Any NVIDIA GTX/RTX card with NVENC handles hardware-accelerated video encoding. The RTX 3060 is again the sweet spot — NVENC quality on 30-series is excellent, and the card is cheap used.

## GPU Passthrough with Proxmox

GPU passthrough (VFIO/IOMMU) gives a VM direct access to the physical GPU — near-native performance.

### Requirements

1. **CPU with IOMMU support:** Intel VT-d or AMD-Vi
2. **Motherboard with IOMMU groups:** Check your IOMMU groups — the GPU must be in its own group or with devices you can also pass through
3. **Two GPUs (for gaming VM):** One for Proxmox console (iGPU or second dGPU), one for passthrough. For headless AI, the host doesn't need a display.

### Setup Steps (Proxmox)

**1. Enable IOMMU in BIOS:**
- Intel: Enable VT-d
- AMD: Enable IOMMU/AMD-Vi

**2. Enable IOMMU in Proxmox boot parameters:**

```bash
# Edit GRUB config
nano /etc/default/grub

# Intel:
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"
# AMD:
GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on iommu=pt"

update-grub
reboot
```

**3. Load VFIO modules:**

```bash
# Add to /etc/modules
echo -e "vfio\nvfio_iommu_type1\nvfio_pci\nvfio_virqfd" >> /etc/modules
```

**4. Blacklist GPU drivers on the host:**

```bash
# /etc/modprobe.d/blacklist.conf
echo -e "blacklist nouveau\nblacklist nvidia\nblacklist radeon\nblacklist amdgpu" >> /etc/modprobe.d/blacklist.conf
```

**5. Bind GPU to VFIO:**

```bash
# Find GPU PCI IDs
lspci -nn | grep -i nvidia
# Example output: 01:00.0 VGA: NVIDIA [10de:2504]
#                 01:00.1 Audio: NVIDIA [10de:228e]

# /etc/modprobe.d/vfio.conf
echo "options vfio-pci ids=10de:2504,10de:228e disable_vga=1" >> /etc/modprobe.d/vfio.conf

update-initramfs -u
reboot
```

**6. Add GPU to VM in Proxmox:**
- VM → Hardware → Add → PCI Device
- Select your GPU
- Check "All Functions" and "Primary GPU" (for gaming VMs)
- Set machine type to q35, BIOS to OVMF (UEFI)

### NVIDIA-Specific Passthrough Notes

NVIDIA consumer drivers detect virtual machines and refuse to load (Error 43). Fix:

```bash
# In the VM's .conf file (/etc/pve/qemu-server/<vmid>.conf)
# Add these CPU flags:
cpu: host,hidden=1,flags=+pcid
args: -cpu 'host,+kvm_pv_unhalt,+kvm_pv_eoi,hv_vendor_id=NV43FIX,kvm=off'
```

This hides the hypervisor from the NVIDIA driver.

### LXC Container GPU Access (No Passthrough)

For Docker workloads like [Jellyfin](/apps/jellyfin/) transcoding or Ollama, you don't need full passthrough. Mount the GPU device into an LXC container:

```bash
# In the LXC container config (/etc/pve/lxc/<id>.conf)
lxc.cgroup2.devices.allow: c 226:* rwm
lxc.mount.entry: /dev/dri dev/dri none bind,optional,create=dir
```

This shares the GPU between the host and containers — multiple containers can use it simultaneously (unlike passthrough, which dedicates the GPU to one VM).

## Power Consumption

| GPU | Idle | Typical Load | Max (TDP) | Annual Idle Cost |
|-----|------|-------------|-----------|------------------|
| Intel N100 iGPU | 0W (part of CPU) | 3-5W | 10W | $0 |
| RTX 3060 12GB | 15W | 80-120W | 170W | $16 |
| RTX 3090 24GB | 25W | 200-300W | 350W | $26 |
| RTX 4060 8GB | 10W | 70-100W | 115W | $11 |
| Tesla P40 | 30W | 150-200W | 250W | $32 |
| No GPU (CPU transcode) | 0W | 60-120W (CPU) | Varies | Varies |

GPUs draw significant idle power even when not processing. Consider powering down the GPU when not in use (supported on some Linux setups with `nvidia-smi` or `echo auto > /sys/bus/pci/devices/0000:01:00.0/power/control`).

## Which GPU for Which Server?

| Server Type | GPU Recommendation | Why |
|-------------|-------------------|-----|
| [Intel N100 Mini PC](/hardware/intel-n100-mini-pc/) | None (use iGPU) | No PCIe slot, iGPU is enough |
| [Dell OptiPlex](/hardware/used-dell-optiplex/) Micro/SFF | Low-profile RTX A2000 | SFF only fits low-profile cards |
| [Dell OptiPlex](/hardware/used-dell-optiplex/) MT | RTX 3060 | Full-height PCIe x16 |
| [DIY NAS Build](/hardware/diy-nas-build/) | Usually none | NAS workloads don't need GPU |
| [Enterprise Server](/hardware/used-enterprise-servers/) (R730) | RTX 3090 or Tesla P40 | Full-size PCIe, adequate PSU |
| [Proxmox](/hardware/proxmox-hardware-guide/) cluster | RTX 3060 per node | GPU passthrough to VMs |

## FAQ

### Can I use one GPU for multiple VMs?

Not with standard passthrough — a GPU is dedicated to one VM at a time. **SR-IOV** (Single Root I/O Virtualization) splits a physical GPU into virtual GPUs, but consumer GPUs don't support it. NVIDIA A-series and Intel Data Center GPUs support SR-IOV. For home use, the workaround is sharing via LXC containers instead of VMs.

### Do I need a GPU for Plex hardware transcoding?

No. Intel Quick Sync (iGPU) is the best option for Plex/Jellyfin transcoding. It's faster, more power-efficient, and has no concurrent session limit. Even a $150 N100 mini PC handles 10+ simultaneous 4K-to-1080p transcodes.

### Can I mine crypto with a GPU in my server?

You can, but it's not profitable for most GPUs in 2026 given electricity costs. A RTX 3060 mining Ethereum Classic earns roughly $0.30/day while consuming $0.40/day in electricity (@$0.12/kWh). Not recommended.

### What about AMD GPUs for AI?

AMD ROCm support has improved significantly but is still behind NVIDIA CUDA in the AI/ML ecosystem. Ollama supports ROCm for AMD RX 6000/7000 series. If you're running Ollama specifically, AMD works. For broader AI workloads (ComfyUI, training), NVIDIA is the safer bet.

### Can I use a GPU from a laptop (MXM/soldered)?

No. Laptop GPUs are not removable or usable in desktops. If you need a low-power GPU, look at the NVIDIA T400/T600 (30-40W TDP, low-profile, passive cooling options).

## Related

- [Proxmox Hardware Guide](/hardware/proxmox-hardware-guide/)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)
- [Intel N100 Mini PC Guide](/hardware/intel-n100-mini-pc/)
- [Used Enterprise Servers](/hardware/used-enterprise-servers/)
- [Used Dell OptiPlex Guide](/hardware/used-dell-optiplex/)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Home Server Noise Reduction](/hardware/home-server-noise-reduction/)

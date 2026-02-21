---
title: "Jellyfin Transcoding Not Working: Fix Guide"
description: "Fix Jellyfin transcoding failures including hardware acceleration setup, codec errors, and Docker GPU passthrough for Intel and NVIDIA."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - jellyfin
tags: ["troubleshooting", "jellyfin", "transcoding", "hardware-acceleration", "docker"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

You are streaming media through Jellyfin and hitting one of these issues:

- "Playback Error" in the client with no useful message
- Video plays but transcoding is using 100% CPU instead of your GPU
- Hardware acceleration is enabled in settings but not actually working
- HDR content looks washed out on non-HDR displays
- Subtitles cause the stream to fail
- Remote streaming buffers constantly despite decent bandwidth

Transcoding issues in Jellyfin almost always come down to one of two things: the GPU is not accessible to the Docker container, or the Jellyfin configuration does not match your hardware. This guide covers every common failure mode.

---

## Quick Diagnostic Checklist

Before diving into specific issues, run through this:

```bash
# 1. Check if the Jellyfin container can see GPU devices
docker exec <jellyfin_container> ls -la /dev/dri/

# 2. Check Jellyfin's transcoding log
docker exec <jellyfin_container> cat /config/log/ffmpeg-transcode-*.log | tail -50

# 3. For Intel GPUs — check VAAPI support
docker exec <jellyfin_container> vainfo 2>&1

# 4. For NVIDIA GPUs — check if nvidia-smi works inside container
docker exec <jellyfin_container> nvidia-smi

# 5. Check host GPU availability
ls -la /dev/dri/
```

The ffmpeg transcode log is the most valuable diagnostic tool. Every transcoding failure writes detailed output there, including the exact FFmpeg command that failed and why.

---

## Issue 1: "Playback Error" with No Transcoding

### Symptom

Clicking play on a video shows "This client isn't compatible with the media and the server isn't sending a compatible media format" or a generic "Playback Error" message. The Jellyfin dashboard shows no transcoding session.

### The Cause

Jellyfin is trying to direct-play the file, but the client does not support the codec. Transcoding should kick in automatically, but it fails silently if hardware acceleration is misconfigured or FFmpeg cannot process the file.

### The Fix

**Step 1: Check what codec the file uses.**

In the Jellyfin web UI, go to the media item, click the three-dot menu, and select **Media Info**. Look at the video codec (H.264, H.265/HEVC, AV1, etc.) and audio codec (AAC, DTS, TrueHD, etc.).

**Step 2: Enable transcoding in Jellyfin.**

Go to **Dashboard > Playback > Transcoding** and verify:
- A hardware acceleration method is selected (VAAPI, QSV, or NVENC)
- The hardware device path is correct (`/dev/dri/renderD128` for Intel VAAPI)
- "Allow encoding in HEVC format" is checked if you have HEVC content

**Step 3: Ensure FFmpeg can transcode at all.**

Test software transcoding by temporarily setting the hardware acceleration dropdown to **None**. If playback works with software transcoding but not hardware, the problem is GPU passthrough (see the next sections).

**Step 4: Check the FFmpeg log for the exact error.**

```bash
docker exec <jellyfin_container> ls /config/log/ | grep ffmpeg
docker exec <jellyfin_container> cat /config/log/ffmpeg-transcode-*.log | tail -100
```

---

## Issue 2: Intel QSV/VAAPI Not Working

### Symptom

You have an Intel CPU with integrated graphics (iGPU). Hardware acceleration is enabled in Jellyfin settings with VAAPI or QSV selected, but transcoding either fails or falls back to software (100% CPU usage).

### The Cause

The Docker container cannot access the GPU device nodes at `/dev/dri/`. Docker does not pass through host devices by default.

### The Fix

**Step 1: Verify the GPU exists on the host.**

```bash
ls -la /dev/dri/
```

You should see:

```
drwxr-xr-x  3 root root       100 Feb 16 00:00 .
crw-rw----+ 1 root video  226,   0 Feb 16 00:00 card0
crw-rw----+ 1 root render 226, 128 Feb 16 00:00 renderD128
```

If `/dev/dri/` does not exist, your kernel does not have the GPU driver loaded. Install the Intel GPU driver:

```bash
# Ubuntu/Debian
sudo apt install -y intel-media-va-driver-non-free vainfo

# Verify
vainfo
```

**Step 2: Pass the device into the Docker container.**

Update your `docker-compose.yml`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - "109"   # The 'render' group GID — check yours with: getent group render
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /path/to/media:/media:ro
    restart: unless-stopped
```

**Critical:** The `group_add` value must match the GID of the `render` group on your host. Find it with:

```bash
getent group render | cut -d: -f3
```

Common values are `109`, `110`, or `303` depending on your distribution.

**Step 3: Verify inside the container.**

```bash
docker exec <jellyfin_container> ls -la /dev/dri/
docker exec <jellyfin_container> vainfo
```

`vainfo` should output a list of supported profiles:

```
vainfo: VA-API version: 1.20
vainfo: Driver version: Intel iHD driver - 24.1.0
vainfo: Supported profile and entrypoints
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264Main               : VAEntrypointEncSlice
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointEncSlice
      ...
```

If `vainfo` outputs errors or no profiles, the driver is not working. Ensure you installed `intel-media-va-driver-non-free` (not just `intel-media-va-driver` — the non-free variant includes codec support you need).

**Step 4: Configure Jellyfin.**

In **Dashboard > Playback > Transcoding**:
- Hardware acceleration: **Video Acceleration API (VAAPI)** for VAAPI, or **Intel QuickSync (QSV)** for QSV
- VA-API Device: `/dev/dri/renderD128`
- Enable hardware decoding for: H.264, HEVC, VP9, AV1 (check all codecs your GPU supports based on `vainfo` output)
- Enable hardware encoding
- Check "Allow encoding in HEVC format"

**Intel QSV vs VAAPI:** QSV generally produces better quality output and supports more features (like HDR tone mapping). Use QSV if your Intel CPU is 6th generation (Skylake) or newer. Use VAAPI if QSV does not work or on older hardware.

---

## Issue 3: NVIDIA GPU Not Working

### Symptom

You have an NVIDIA GPU. Hardware acceleration is set to NVENC in Jellyfin, but transcoding fails or uses the CPU.

### The Cause

NVIDIA GPU passthrough in Docker requires the NVIDIA Container Toolkit (`nvidia-container-toolkit`), which is separate from the regular NVIDIA driver. Without it, Docker containers cannot access the GPU at all.

### The Fix

**Step 1: Install the NVIDIA driver on the host.**

```bash
# Check if the driver is already installed
nvidia-smi
```

If `nvidia-smi` works and shows your GPU, the host driver is fine. If not, install it:

```bash
# Ubuntu/Debian
sudo apt install -y nvidia-driver-550
sudo reboot
```

**Step 2: Install the NVIDIA Container Toolkit.**

```bash
# Add NVIDIA's package repository
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt update
sudo apt install -y nvidia-container-toolkit

# Configure Docker to use the NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

**Step 3: Update your Docker Compose file.**

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /path/to/media:/media:ro
    restart: unless-stopped
```

Alternatively, if your Docker Compose version does not support `runtime`, use `deploy`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu, compute, video]
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /path/to/media:/media:ro
    restart: unless-stopped
```

**Step 4: Verify inside the container.**

```bash
docker exec <jellyfin_container> nvidia-smi
```

This should show your GPU model, driver version, and CUDA version.

**Step 5: Configure Jellyfin.**

In **Dashboard > Playback > Transcoding**:
- Hardware acceleration: **NVIDIA NVENC**
- Enable hardware decoding for: H.264, HEVC, VP9 (AV1 if you have RTX 4000 series or newer)
- Enable hardware encoding
- Check "Allow encoding in HEVC format"

---

## Issue 4: "Failed to initialize hardware device"

### Symptom

The FFmpeg transcode log shows:

```
[AVHWDeviceContext] Failed to initialise VAAPI connection: -1 (unknown libva error).
Failed to create a VAAPI device
Device creation failed: -1.
Failed to set value '/dev/dri/renderD128' for option 'vaapi_device'
```

Or for NVIDIA:

```
Cannot load libcuda.so.1
Failed to create NVENC device
```

### The Cause

The GPU driver is not working correctly inside the container. Either the device is not passed through, the permissions are wrong, or the driver version has a mismatch.

### The Fix

**For VAAPI/QSV (Intel):**

1. Check permissions on the device:

```bash
ls -la /dev/dri/renderD128
```

If the device is owned by the `render` group, ensure your container user is in that group (via `group_add` in Compose — see Issue 2).

2. Test VAAPI directly:

```bash
docker exec <jellyfin_container> vainfo --display drm --device /dev/dri/renderD128
```

3. If `vainfo` shows "libva error: /usr/lib/dri/iHD_drv_video.so init failed," the driver inside the container is missing or incompatible. Ensure you are using the official `jellyfin/jellyfin` image, which includes the Intel media driver.

**For NVIDIA:**

1. Verify `nvidia-container-toolkit` is installed:

```bash
nvidia-ctk --version
```

2. Test basic GPU access:

```bash
docker run --rm --runtime=nvidia --gpus all nvidia/cuda:12.3.1-base-ubuntu22.04 nvidia-smi
```

If this fails, the NVIDIA Container Toolkit is not properly configured. Re-run:

```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

3. Check for driver version mismatch. The host driver version must be compatible with the CUDA version expected by the container. Run `nvidia-smi` on the host to see the driver version and maximum supported CUDA version.

---

## Issue 5: Subtitle Burn-In Failing

### Symptom

Videos play fine until you enable subtitles (especially ASS/SSA or PGS bitmap subtitles). Playback fails or subtitles render incorrectly — missing fonts, wrong positioning, or garbled text.

### The Cause

When subtitles cannot be delivered as a separate stream (text-based subs to a compatible client), Jellyfin burns them into the video stream. This requires:

- FFmpeg's subtitle rendering libraries
- Font files for text-based subtitle rendering
- Full video transcoding (not just remuxing)

ASS/SSA subtitles are particularly demanding because they support custom fonts, positioning, and effects.

### The Fix

**Step 1: Mount a fonts directory.**

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /path/to/media:/media:ro
      - /usr/share/fonts:/usr/share/fonts:ro      # System fonts
      - ./fonts:/config/fonts                       # Custom fonts
    # ... rest of config
```

**Step 2: Install fallback fonts on the host.**

```bash
# Ubuntu/Debian
sudo apt install -y fonts-dejavu fonts-liberation fonts-noto-cjk
```

CJK (Chinese/Japanese/Korean) fonts are the most commonly missing. The `fonts-noto-cjk` package covers them.

**Step 3: Set the fallback font in Jellyfin.**

In **Dashboard > Playback > Transcoding**, set the **Fallback font** to a font file path inside the container, for example `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`.

**Step 4: For PGS/VOBSUB bitmap subtitles,** these always require transcoding. Ensure hardware acceleration is working (Issues 2-4 above), as bitmap subtitle burn-in is CPU-intensive without GPU offloading.

---

## Issue 6: HDR Tone Mapping Not Working

### Symptom

HDR content (typically HEVC 10-bit with HDR10 or Dolby Vision metadata) plays but looks washed out, with faded colors and low contrast on SDR displays. Or tone mapping is enabled but transcoding fails.

### The Cause

HDR to SDR tone mapping requires OpenCL support inside the container. Without it, Jellyfin either skips tone mapping (resulting in washed-out output) or fails the transcode entirely.

### The Fix

**For Intel GPUs:**

Ensure the Intel Compute Runtime is available. The official Jellyfin Docker image includes it, but you need to pass through the correct devices:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - "109"  # render group GID
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /path/to/media:/media:ro
    restart: unless-stopped
```

In **Dashboard > Playback > Transcoding**:
- Check **"Enable tone mapping"**
- Set **"Tone mapping algorithm"** to **BT.2390** (recommended for best results)
- Check **"Enable VPP tone mapping"** if using QSV (this uses Intel's video processing pipeline for faster tone mapping)

Verify OpenCL works inside the container:

```bash
docker exec <jellyfin_container> /usr/lib/jellyfin-ffmpeg/ffmpeg -v verbose -init_hw_device opencl 2>&1 | head -20
```

You should see your GPU listed as an OpenCL device.

**For NVIDIA GPUs:**

NVIDIA tone mapping uses CUDA, not OpenCL. Ensure `NVIDIA_DRIVER_CAPABILITIES=all` is set in your environment (see Issue 3). Then enable tone mapping in Jellyfin settings.

**Note:** Dolby Vision tone mapping has limited support. Jellyfin can tone-map HDR10 and HLG reliably. Dolby Vision Profile 5 works in some cases, but Profile 7 and 8 are unreliable. If Dolby Vision content looks wrong, set the client to direct-play if possible.

---

## Issue 7: High CPU Despite GPU Transcoding Being Enabled

### Symptom

You enabled hardware acceleration and the GPU device is passed through, but during transcoding `htop` shows high CPU usage and `intel_gpu_top` or `nvidia-smi` shows no GPU activity.

### The Cause

Jellyfin may be falling back to software transcoding silently. Common reasons:

- The specific codec is not supported by your GPU (e.g., AV1 decode on older Intel hardware)
- The resolution or bitrate exceeds GPU capabilities
- The transcode session includes subtitle burn-in that disables hardware acceleration
- A Jellyfin configuration error

### The Fix

**Step 1: Verify GPU usage during active transcoding.**

For Intel:

```bash
# Install intel-gpu-tools
sudo apt install -y intel-gpu-tools
sudo intel_gpu_top
```

Look for the **Video** and **VideoEnhance** engine utilization while a transcode is active. If they show 0%, the GPU is not being used.

For NVIDIA:

```bash
watch -n 1 nvidia-smi
```

Look for the **GPU-Util** percentage and processes using the GPU.

**Step 2: Check the FFmpeg log for the active session.**

```bash
# Find the most recent transcode log
docker exec <jellyfin_container> ls -lt /config/log/ | grep ffmpeg | head -5
docker exec <jellyfin_container> cat /config/log/ffmpeg-transcode-<latest>.log
```

Look for lines containing `hwaccel` or `vaapi` or `nvenc` or `qsv`. If you see `-c:v libx264` instead of `-c:v h264_vaapi` or `-c:v h264_nvenc`, Jellyfin is using software encoding.

**Step 3: Check which codecs triggered the fallback.**

In Jellyfin's transcoding settings, verify that hardware decoding is enabled for the specific codec your media uses. Common miss: enabling H.264 hardware decode but not HEVC, then playing HEVC content.

**Step 4: Check for subtitle-triggered fallback.**

Some subtitle formats force a full software transcode pipeline. Try playing the same file with subtitles disabled. If GPU usage appears, the subtitle rendering is the problem (see Issue 5).

**Step 5: Check Jellyfin's internal playback information.**

While a video is playing, open the playback menu and select **Playback Info** (or press the `P` key in the web client). This shows whether the current session is transcoding and which method is being used.

---

## Issue 8: Remote Streaming Buffering

### Symptom

Local playback is smooth, but streaming remotely over the internet buffers frequently or fails to start.

### The Cause

This is usually not a transcoding issue but a bandwidth or bitrate mismatch. Jellyfin tries to direct-play by default, which sends the original file bitrate. A 40 Mbps 4K remux will not stream smoothly over a 10 Mbps upload connection.

### The Fix

**Step 1: Check your upload bandwidth.**

Run a speed test from the server:

```bash
# Install speedtest-cli
pip install speedtest-cli
speedtest-cli --simple
```

Note the **Upload** speed. Your streaming bitrate cannot exceed this.

**Step 2: Set a remote streaming bitrate limit.**

In the Jellyfin client (not the server), go to **Settings > Playback** and set **Internet streaming bitrate limit** to a value below your upload speed. A safe starting point is 70% of your upload bandwidth.

| Upload Speed | Recommended Limit | Practical Resolution |
|-------------|-------------------|---------------------|
| 5 Mbps | 3 Mbps | 720p |
| 10 Mbps | 8 Mbps | 1080p |
| 25 Mbps | 15 Mbps | 1080p high quality |
| 50+ Mbps | 30 Mbps | 4K (with transcoding) |

**Step 3: Enable server-side bitrate limiting.**

In **Dashboard > Playback**, set the **Internet streaming bitrate limit** as a server-wide default. This applies to all remote clients that have not set their own limit.

**Step 4: Pre-transcode for remote access.**

If your hardware cannot transcode in real-time (especially 4K HEVC on low-power hardware), consider using the `tdarr` tool to pre-transcode your library to lower bitrate versions. This is outside Jellyfin but eliminates real-time transcoding entirely.

**Step 5: Configure your reverse proxy for streaming.**

If using a reverse proxy, increase buffer sizes and timeouts. See [Reverse Proxy 502 Bad Gateway](/troubleshooting/reverse-proxy-502-bad-gateway/) for timeout configuration. Additionally, for Nginx/NPM, add these to the Advanced configuration:

```nginx
proxy_buffering off;
proxy_request_buffering off;
```

This prevents the proxy from buffering the entire stream segment before forwarding it to the client.

---

## Resource Requirements for Transcoding

Transcoding is the most resource-intensive task a self-hosted media server performs. Plan your hardware accordingly.

### Software Transcoding (No GPU)

| Resolution | CPU Requirement | Speed |
|-----------|----------------|-------|
| 1080p H.264 | Modern quad-core (Intel i5/Ryzen 5) | Real-time to 2x |
| 1080p HEVC | Modern six-core (Intel i7/Ryzen 7) | 0.5x to real-time |
| 4K H.264 | High-end eight-core | Barely real-time |
| 4K HEVC | Not practical | Too slow for real-time |

Software transcoding of 4K content is impractical for most home servers. Hardware acceleration is effectively mandatory.

### Hardware Transcoding

| GPU | Simultaneous 1080p Streams | 4K Support | Tone Mapping |
|-----|---------------------------|-----------|--------------|
| Intel N100 | 3-5 | Yes (limited) | Yes (VPP) |
| Intel 10th gen+ iGPU | 5-10 | Yes | Yes (VPP) |
| NVIDIA GTX 1050 | 3-5 | Limited | Yes (CUDA) |
| NVIDIA RTX 3060 | 15-20 | Yes | Yes (CUDA) |
| NVIDIA RTX 4060 | 20+ | Yes + AV1 encode | Yes (CUDA) |

**RAM for transcoding:** Jellyfin itself uses 200-500 MB. Each active transcode session adds 100-500 MB of cache. 4 GB is the minimum for a media server with transcoding. 8 GB is comfortable for multiple simultaneous streams.

---

## Complete Diagnostic Checklist

When transcoding is not working, run through this in order:

1. Is the container running? `docker ps | grep jellyfin`
2. Does `/dev/dri/` exist on the host? `ls -la /dev/dri/`
3. Is the device passed through? `docker exec jellyfin ls -la /dev/dri/`
4. Is the container user in the render group? `docker exec jellyfin id`
5. Does VAAPI/NVENC work? `docker exec jellyfin vainfo` or `docker exec jellyfin nvidia-smi`
6. Is hardware acceleration enabled in Jellyfin settings?
7. Is hardware decoding enabled for the specific codec?
8. What does the FFmpeg log say? Check `/config/log/ffmpeg-transcode-*.log`
9. Does software transcoding work? (Set acceleration to None and test)
10. Is the issue specific to subtitles? (Disable subs and test)

## Prevention

1. **Test transcoding immediately after setup.** Do not wait until you have a full library to discover GPU passthrough is broken.
2. **Use the official `jellyfin/jellyfin` image.** It includes all necessary drivers and codecs. Third-party images may be missing components.
3. **Pin your Jellyfin version.** GPU compatibility can change between releases. Test before upgrading.
4. **Monitor GPU utilization during playback.** If it is not being used, check the FFmpeg log immediately rather than assuming it works.
5. **Set remote streaming bitrate limits proactively.** Do not rely on clients to configure this correctly.

## Related

- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex/)
- [Docker Compose Common Errors](/troubleshooting/docker-compose-common-errors/)
- [Reverse Proxy 502 Bad Gateway](/troubleshooting/reverse-proxy-502-bad-gateway/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

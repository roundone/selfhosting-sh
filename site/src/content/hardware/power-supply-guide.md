---
title: "Power Supply Guide for Home Servers"
description: "How to choose a PSU for your home server or NAS build. Wattage sizing, efficiency ratings, and the best power supplies for 24/7 operation."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "power-supply", "psu", "efficiency"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**A 450W 80 Plus Gold PSU is the right size for most home servers.** Your NAS with an i3-12100, 6 HDDs, and an HBA card draws 80–120W under load and 40–60W idle. A 450W PSU puts you at 20–30% load where efficiency is best, gives headroom for upgrades, and costs $50–70.

Don't overbuy wattage. A 750W PSU powering a 50W idle server is less efficient at that low load than a 450W PSU. The 80 Plus efficiency curve peaks at 50% load — size your PSU so typical load falls in the 20–50% range.

## How Much Wattage Do You Need?

### Component Power Draw

| Component | Idle | Load | Notes |
|-----------|------|------|-------|
| Intel i3-12100 | 15W | 60W | 58W PL1 |
| Intel N100 | 3W | 6W | 6W TDP |
| AMD Ryzen 5 5600G | 20W | 65W | 65W TDP |
| DDR4 RAM (per 8 GB) | 2W | 3W | |
| 3.5" HDD (per drive) | 5W | 8W | Startup: 25W burst |
| 2.5" SSD (per drive) | 0.5W | 3W | |
| NVMe SSD | 1W | 5W | |
| HBA card (LSI 9207) | 8W | 12W | |
| 10GbE NIC | 5W | 10W | |
| Case fans (per fan) | 1W | 3W | |
| Motherboard + chipset | 10W | 20W | |

### Example Builds

| Build | Components | Idle | Load | Recommended PSU |
|-------|-----------|------|------|----------------|
| Compact Docker server | N100, 16 GB, 1 NVMe | 12W | 20W | Pico PSU or 200W |
| Small NAS | i3-12100, 16 GB, 4 HDDs | 45W | 100W | 350–450W |
| Medium NAS | i3-12100, 32 GB, 8 HDDs, HBA | 65W | 150W | 450–550W |
| Proxmox server | Ryzen 5600G, 64 GB, 2 NVMe | 40W | 110W | 450W |
| Heavy NAS + compute | Ryzen 5700G, 64 GB, 12 HDDs, HBA, GPU | 100W | 300W | 550–650W |

### HDD Startup Current

**Important:** HDDs draw ~25W each during spinup (for 5–10 seconds). If you have 8 HDDs, that's 200W of startup current before settling to 40W idle. Your PSU needs enough 12V rail capacity to handle simultaneous spinup. Most modern PSUs handle this fine, but some undersized units can't start a full array.

To avoid startup issues, enable **staggered spinup** in BIOS (if available) or connect some drives to an HBA card which staggers spinup by default.

## 80 Plus Efficiency Ratings

| Rating | 20% Load | 50% Load | 100% Load | Price Premium |
|--------|----------|----------|-----------|---------------|
| 80 Plus | 80% | 80% | 80% | Baseline |
| 80 Plus Bronze | 82% | 85% | 82% | +$5–10 |
| 80 Plus Gold | 87% | 90% | 87% | +$15–25 |
| 80 Plus Platinum | 90% | 92% | 89% | +$30–50 |
| 80 Plus Titanium | 92% | 94% | 90% | +$60–100 |

### What This Means for Your Electricity Bill

A server drawing 60W at the wall with a Gold-rated PSU delivers ~54W to components (90% efficient at ~50% of 450W rating). With an unrated PSU at 70% efficiency, you'd draw 77W from the wall for the same 54W delivered.

**Annual cost difference (60W vs 77W, 24/7, $0.12/kWh):**
- Gold: 60W × 8,760 hours × $0.12 = $63/year
- Unrated: 77W × 8,760 hours × $0.12 = $81/year
- **Savings: $18/year**

Over 5 years, a $15 premium for Gold rating saves $90 in electricity. Gold is the sweet spot — Platinum and Titanium take years to pay back the premium.

## Top Picks

### Best for NAS Builds — Corsair RM550x (550W, Gold, Fully Modular)

- **Wattage:** 550W
- **Efficiency:** 80 Plus Gold
- **Modularity:** Fully modular
- **Fan:** 135mm, zero-RPM mode under low load
- **SATA connectors:** 8
- **Price:** ~$80

The RM550x is quiet (fan doesn't spin at all under ~200W load — your server will never hit that), efficient, and has enough SATA power connectors for 8 drives without adapters. Fully modular means you only install the cables you need — less clutter in the case.

**Pros:**
- Zero-RPM fan mode = silent at server loads
- Fully modular for clean cable management
- 10-year warranty
- Enough SATA connectors for most NAS builds

**Cons:**
- ~$80 is more than budget options
- Overkill wattage for low-power builds

### Best Budget — Seasonic Focus GX-450 (450W, Gold, Semi-Modular)

- **Wattage:** 450W
- **Efficiency:** 80 Plus Gold
- **Modularity:** Semi-modular
- **Fan:** 120mm, quiet operation
- **SATA connectors:** 6
- **Price:** ~$60

Great value. Semi-modular means the ATX 24-pin and CPU 8-pin are permanently attached (you'd use them anyway), while SATA and PCIe cables are modular.

**Pros:**
- Excellent price for Gold-rated
- Seasonic quality and reliability
- 10-year warranty
- Right-sized for most server builds

**Cons:**
- Semi-modular (minor inconvenience)
- 6 SATA connectors may not be enough for 8+ drive builds

### Best for Compact Builds — Corsair SF450 (450W, Gold, SFX)

- **Wattage:** 450W
- **Efficiency:** 80 Plus Gold
- **Form Factor:** SFX (smaller than ATX)
- **Fan:** 92mm
- **Price:** ~$85

For Mini-ITX NAS cases that require an SFX power supply. Same internals quality as the RM series in a smaller package.

**Pros:**
- Fits SFX cases (Fractal Node 304, Jonsbo N-series)
- Fully modular
- 7-year warranty

**Cons:**
- SFX premium price
- 92mm fan is louder than 120/140mm fans under load
- Fewer SATA connectors (4–6)

### Best for Ultra-Low-Power — PicoPSU-160-XT (160W, DC-DC)

- **Wattage:** 160W (with 12V adapter)
- **Efficiency:** ~95% (DC-DC conversion)
- **Form Factor:** Tiny board that plugs into ATX 24-pin
- **Price:** ~$35 (board) + $15–30 (12V adapter)

A Pico PSU is a tiny DC-DC converter board that replaces a full ATX PSU. It plugs into the 24-pin ATX connector and accepts 12V DC input from a laptop-style adapter. No fan, no moving parts, highest efficiency.

**Best for:** N100 builds, low-power ITX servers drawing under 100W. Not suitable for builds with multiple HDDs or dedicated GPUs.

**Pros:**
- Completely silent (no fan)
- Highest efficiency at low loads
- Tiny — frees up case space
- ~$50–65 total cost

**Cons:**
- Limited wattage (100–160W typical)
- Can't handle HDD startup surge for many drives
- Requires a separate 12V DC adapter
- No SATA power cables — need adapters

## Comparison Table

| PSU | Watts | Rating | Modular | Fan Noise | SATA | Price |
|-----|-------|--------|---------|-----------|------|-------|
| Corsair RM550x | 550W | Gold | Full | Silent (0 RPM mode) | 8 | ~$80 |
| Seasonic Focus GX-450 | 450W | Gold | Semi | Quiet | 6 | ~$60 |
| Corsair SF450 (SFX) | 450W | Gold | Full | Moderate | 4–6 | ~$85 |
| PicoPSU-160-XT | 160W | ~95% | N/A | None | 0 (need adapters) | ~$50 |
| Corsair CX450M | 450W | Bronze | Semi | Moderate | 6 | ~$45 |
| EVGA 450 BT | 450W | Bronze | No | Moderate | 6 | ~$35 |

*Prices approximate as of February 2026.*

## SATA Power Connectors: Don't Use Adapters

**Never use Molex-to-SATA power adapters** (the ones with thin injection-molded wires). These are a leading cause of fires in home server setups. The crimped connectors can arc and melt, especially under the sustained load of spinning drives.

Buy a PSU with enough native SATA power connectors for your drives. If you need more:
- Use a second SATA power cable from the PSU (most modular PSUs include extras)
- Get a PSU with more SATA connectors
- Use Molex-to-SATA adapters ONLY if they have individually crimped pins (not molded)

### Power Cable Planning

| Drive Count | SATA Connectors Needed | PSU Cables Needed |
|-------------|----------------------|-------------------|
| 1–4 drives | 4 | 1 SATA cable (most have 4 connectors) |
| 5–8 drives | 8 | 2 SATA cables |
| 9–12 drives | 12 | 3 SATA cables |

Also need SATA power for: some fans, some RGB controllers, some accessories. Account for these.

## Modular vs Non-Modular

| Type | Pros | Cons | Best For |
|------|------|------|----------|
| **Fully modular** | Only use needed cables, easy cable management | More expensive | NAS builds (clean routing matters) |
| **Semi-modular** | ATX/CPU cables pre-attached, rest modular | Minor cable management hassle | Most builds (best value) |
| **Non-modular** | Cheapest | All cables attached, messy | Budget builds where you don't care |

For a server/NAS, semi-modular is the sweet spot. You always use the ATX and CPU cables anyway. Fully modular is worth the $10–15 premium for dense NAS builds where cable management affects airflow over drives.

## PSU Reliability and Server Use

Home servers run 24/7. PSU quality matters more than in a desktop that runs 4 hours a day.

**Brands with proven server/24-7 reliability:**
- **Tier 1:** Seasonic, Corsair (RM/HX/AX series), be quiet! (Straight Power, Dark Power)
- **Tier 2:** EVGA (SuperNOVA G series), Corsair (CX series), Fractal Design (Ion series)
- **Avoid:** Unbranded, Raidmax, Diablotek, anything without 80 Plus certification

**Warranty as quality signal:** 10-year warranty (Corsair RM, Seasonic Focus) = manufacturer trusts it for continuous use. 3-year warranty = budget unit, may fail sooner under 24/7 load.

## FAQ

### Can I use a laptop charger instead of a PSU?

Only with a Pico PSU or DC-DC converter board. A laptop charger outputs 12V/19V DC — you need a converter board to provide the ATX voltages (3.3V, 5V, 12V) your motherboard expects. This works well for low-power builds under 100W.

### Is a higher wattage PSU bad for a low-power server?

Not bad, just slightly less efficient. A 750W PSU powering a 40W load is at ~5% utilization — below the 80 Plus efficiency curve. A 450W PSU at the same 40W load is at ~9% — still low but slightly better. The practical difference is 1–3W.

### Do I need a UPS with my PSU?

Strongly recommended for NAS builds. A power outage during a write to a ZFS pool or ext4 filesystem can cause data corruption. A UPS gives you 5–15 minutes to cleanly shut down. See our [UPS guide](/hardware/best-ups-home-server/).

### Should I buy a used server PSU?

Used enterprise PSUs (like HP 750W units) are cheap ($10–20) and reliable, but they're loud and use proprietary connectors. You'll need a breakout board ($10–20) to use standard ATX connectors. Only worth it for rack-mounted setups where noise isn't a concern.

## Related

- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Best UPS for Home Servers](/hardware/best-ups-home-server/)
- [DIY NAS Build Guide](/hardware/diy-nas-build/)
- [Best Server Cases for Homelab](/hardware/server-case-guide/)
- [Best Motherboards for Home Servers](/hardware/motherboard-guide/)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)

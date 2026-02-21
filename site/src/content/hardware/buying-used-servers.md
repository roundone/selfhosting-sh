---
title: "Buying Used Servers for Self-Hosting"
description: "How to buy used and refurbished servers for self-hosting. What to look for, where to buy, what to avoid, and best deals in 2026."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "used-servers", "home-server", "self-hosting", "refurbished"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Buy a used Dell OptiPlex 7060 Micro or Lenovo ThinkCentre M720q.** They cost $100–$150 on eBay, draw 15–20W idle, accept up to 64 GB RAM, and run completely silent. These are the best value in self-hosting hardware right now.

If you need more compute or drive bays, a used Dell OptiPlex 5080 SFF ($150–$200) gives you a full-size desktop with room for 3.5" drives and expansion cards.

Avoid used rack servers (Dell PowerEdge, HP ProLiant) unless you have a server rack, don't mind noise, and are prepared for 200–400W electricity bills. They're powerful but impractical for most home setups.

## Where to Buy

### Best Sources (Ranked)

| Source | Pros | Cons | Best For |
|--------|------|------|----------|
| **eBay (refurbished sellers)** | Largest selection, buyer protection, tested hardware | Variable quality, shipping costs | OptiPlex, ThinkCentre, rack servers |
| **Amazon Renewed** | Fast shipping, easy returns, quality guarantee | Higher prices than eBay | Hassle-free buying |
| **r/homelabsales** | Great prices, knowledgeable sellers | No buyer protection, limited selection | Specific parts, complete builds |
| **Facebook Marketplace** | Cheapest prices, no shipping | No protection, must inspect in person | Local deals |
| **IT asset disposition (ITAD) companies** | Bulk pricing, consistent quality | Minimum order quantities sometimes | Multiple systems |
| **Craigslist** | Cheap, local pickup | Cash only, no protection | Budget finds |

### eBay Tips

- **Buy from refurbished sellers** with 98%+ feedback and 1,000+ sales. Search for "Dell OptiPlex 7060 Micro refurbished."
- **Filter by condition:** "Refurbished" or "Seller refurbished" — these have been tested and usually come with a 30–90 day warranty.
- **Check what's included.** Some listings are barebones (CPU + board only). Look for "complete system" listings that include RAM, storage, and a power adapter.
- **Make offers.** Most eBay sellers accept offers 10–20% below listing price.

### What to Ask Before Buying

1. **Has it been tested?** Does it POST? Does it boot to an OS?
2. **What's included?** RAM? Storage? Power adapter? Wi-Fi card?
3. **Any known issues?** Dead USB ports, fan noise, cosmetic damage?
4. **Service tag number?** For Dell/HP/Lenovo, you can check the service tag on the manufacturer's support site to see original specs and warranty history.

## Best Used Systems by Use Case

### For Docker Self-Hosting (Most People)

| System | CPU | Max RAM | Form Factor | Price | Power |
|--------|-----|---------|-------------|-------|-------|
| **Dell OptiPlex 7060 Micro** | i5-8500T | 64 GB | Ultra-small | $100–$150 | 12–18W |
| **Lenovo ThinkCentre M720q** | i5-8500T | 64 GB | Tiny | $90–$130 | 12–18W |
| **Dell OptiPlex 7080 Micro** | i5-10500T | 64 GB | Ultra-small | $150–$200 | 12–18W |
| **HP EliteDesk 800 G4 Mini** | i5-8500T | 64 GB | Mini | $100–$140 | 12–18W |

**Why these?** T-series (low-power) CPUs, compact form factor, near-silent operation, enterprise reliability, and enough RAM for any Docker workload. The 7060 Micro is the sweet spot: widely available, well-priced, 8th gen i5 with QuickSync for Plex transcoding.

Detailed guides: [Dell OptiPlex](/hardware/used-dell-optiplex/) | [Lenovo ThinkCentre](/hardware/used-lenovo-thinkcentre/)

### For NAS + Docker (More Storage)

| System | CPU | Max RAM | Form Factor | Drive Bays | Price |
|--------|-----|---------|-------------|-----------|-------|
| **Dell OptiPlex 5080 SFF** | i5-10500 | 128 GB | Small form factor | 1x 3.5" + 1x 2.5" | $150–$200 |
| **Dell OptiPlex 7050 Tower** | i5-7500 | 64 GB | Tower | 2x 3.5" + 1x 2.5" | $100–$140 |
| **Lenovo ThinkCentre M920t** | i5-8500 | 64 GB | Tower | 2x 3.5" + 1x 2.5" | $120–$160 |
| **HP ProDesk 600 G4 SFF** | i5-8500 | 64 GB | Small form factor | 1x 3.5" + 1x 2.5" | $100–$140 |

These have room for 3.5" drives and PCIe expansion (add an HBA for more SATA ports). Good for running TrueNAS or Unraid with a few drives.

### For Proxmox / Heavy Compute

| System | CPU | Max RAM | Price | Power |
|--------|-----|---------|-------|-------|
| **Dell Precision 3630 Tower** | i7-8700 / Xeon E-2176G | 128 GB ECC | $200–$300 | 40–80W |
| **HP Z2 Tower G4** | i7-8700 / Xeon E-2176G | 128 GB ECC | $200–$300 | 40–80W |
| **Lenovo ThinkStation P330** | i7-8700 / Xeon E-2176G | 128 GB ECC | $180–$250 | 40–80W |

Used workstations are the hidden gem for Proxmox. ECC RAM support, Xeon CPUs, PCIe slots for GPUs and 10GbE, and tower cases that are quieter than rack servers.

See [Used Workstations Guide](/hardware/used-workstations-home-server/).

### For Rack Servers (Homelabs Only)

| System | CPU | Max RAM | Price | Power |
|--------|-----|---------|-------|-------|
| **Dell PowerEdge R730** | 2x Xeon E5-2680 v4 (28C/56T) | 768 GB | $200–$400 | 200–400W |
| **HP ProLiant DL380 Gen10** | 2x Xeon Silver 4114 (20C/40T) | 3 TB | $300–$600 | 150–300W |
| **Dell PowerEdge R640** | 2x Xeon Silver 4116 (24C/48T) | 1.5 TB | $400–$700 | 150–300W |

Rack servers offer extreme compute density but come with serious trade-offs:
- **Noise:** 50–70 dB under load. Louder than a vacuum cleaner.
- **Power:** 200–400W idle. $210–$420/year in electricity.
- **Size:** 19" wide, need a rack or shelf.
- **Weight:** 15–30 kg.

Only buy a rack server if you have a basement, garage, or dedicated server room. They're impractical in a living space.

See [Used Enterprise Servers](/hardware/used-enterprise-servers/).

## What to Check When Receiving Used Hardware

### Physical Inspection

1. **External damage** — dents that might affect internals, bent I/O ports
2. **All ports work** — test every USB port, Ethernet, display output
3. **Fan noise** — listen for bearing noise (grinding, clicking). Replace fans if needed ($5–$10).
4. **Power adapter** — verify correct wattage. Dell Micro uses 65W or 90W depending on model.
5. **Dust** — blow it out with compressed air. Heavy dust = poor cooling.

### BIOS and System Check

```bash
# Check CPU and RAM after OS install
lscpu                    # CPU model, cores, features
free -h                  # Total RAM
sudo dmidecode -t 17     # RAM module details (speed, size, ECC)
lspci                    # All PCI devices (network, storage, etc.)
lsblk                    # Storage devices
sudo smartctl -a /dev/sda  # Drive health (install smartmontools)
```

### Stress Test

Run a 30-minute stress test to catch thermal and stability issues:

```bash
# Install stress tools
sudo apt install stress-ng memtester

# CPU stress (all cores, 30 minutes)
stress-ng --cpu 0 --timeout 30m

# RAM test (test all available RAM — takes hours for 32+ GB)
sudo memtester $(free -m | awk '/Mem:/ {print int($7*0.9)}')M 1
```

Watch temperatures during the stress test:

```bash
# Install and run temperature monitoring
sudo apt install lm-sensors
sudo sensors-detect  # accept defaults
watch -n1 sensors
```

If temperatures exceed 85°C under stress, the cooling solution needs attention (reapply thermal paste, clean heatsink, replace fan).

## Cost Comparison: Used vs New

| Approach | Cost | Power (Idle) | Annual Electricity | Performance |
|----------|------|-------------|-------------------|-------------|
| New mini PC (N100) | $150–$200 | 6–10W | $6–$10 | Good for containers |
| **Used OptiPlex Micro** | **$100–$150** | **12–18W** | **$13–$19** | **Better than N100** |
| New mini PC (N305) | $300–$350 | 10–25W | $10–$26 | Great for containers |
| Used OptiPlex SFF | $150–$200 | 20–35W | $21–$37 | Great + expansion |
| Used workstation | $200–$300 | 40–80W | $42–$84 | Excellent + ECC |
| Used rack server | $200–$600 | 200–400W | $210–$420 | Massive overkill |

The sweet spot is the used OptiPlex Micro: better CPU than a new N100 mini PC, cheaper to buy, slightly more power draw but still under $20/year. The upgrade path to 64 GB RAM makes it more future-proof.

## What to Avoid

1. **Dell OptiPlex x010 and older** (7010, 9010) — Sandy Bridge/Ivy Bridge CPUs. No QuickSync worth using, DDR3 RAM, USB 3.0 only on some ports. Outdated.
2. **Anything with DDR3** — DDR3 is end of life. Limited capacity (usually 32 GB max), expensive to upgrade, higher power consumption.
3. **Rack servers without a plan for noise** — they will ruin your home office. Fan-swap mods exist but void warranty and aren't guaranteed quiet.
4. **HP MicroServers** (Gen8/Gen10) — popular on forums but overpriced and underpowered compared to OptiPlex alternatives. The Gen10 Plus is decent but costs more than an equivalent OptiPlex.
5. **Anything marketed as "gaming PC"** on eBay — overpriced, often poorly built, consumer-grade components.
6. **Systems without a power adapter** — OEM power adapters cost $20–$30. Budget for it if not included.

## Upgrade Priorities

When you receive a used system, upgrade in this order:

1. **RAM** — Most used systems ship with 8 GB. Upgrade to 16–32 GB DDR4 ($20–$50). This is the single biggest performance improvement.
2. **Storage** — Add an NVMe SSD if the system has an M.2 slot. A 500 GB NVMe ($30) transforms boot and container performance.
3. **Network** — If you need faster than 1 Gbps, add a USB 3.0 to 2.5GbE adapter ($15). See [2.5GbE Guide](/hardware/2.5gbe-networking/).
4. **Cooling** — Replace thermal paste on the CPU ($5) if the system is 3+ years old. Arctic MX-6 or Noctua NT-H1 are reliable choices.

## FAQ

### Are refurbished servers reliable?

Enterprise hardware (Dell OptiPlex, Lenovo ThinkCentre, HP EliteDesk) is designed for 5–7 year corporate lifespans with daily use. A 3-year-old refurbished unit typically has 60–70% of its expected lifespan remaining. These are more reliable than consumer desktops. Buy from sellers with good ratings and a return policy.

### How old is too old?

Stick to 8th gen Intel (2018) or newer for practical reasons: DDR4 support, USB-C, NVMe, decent QuickSync. 6th-7th gen works but you're paying similar prices for less capability. 5th gen and older: skip.

### Should I buy a warranty?

eBay's 30-day return policy is usually sufficient. If the system works for 30 days, it'll likely work for years. Extended warranties on used hardware are overpriced — the cost of the warranty often approaches the cost of just buying another used system.

### Desktop vs server hardware?

Desktop hardware (OptiPlex, ThinkCentre) is better for home self-hosting: quiet, low power, compact, cheap. Server hardware (PowerEdge, ProLiant) is better if you need ECC, hot-swap drive bays, redundant PSUs, or IPMI remote management. Most self-hosters should buy desktop-class used hardware.

## Related

- [Dell OptiPlex Home Server](/hardware/used-dell-optiplex/)
- [Lenovo ThinkCentre Home Server](/hardware/used-lenovo-thinkcentre/)
- [Used Workstations Guide](/hardware/used-workstations-home-server/)
- [Used Enterprise Servers](/hardware/used-enterprise-servers/)
- [Best Mini PCs](/hardware/best-mini-pc/)
- [Best CPUs for Home Server](/hardware/best-cpu-home-server/)
- [Home Server Build Guide](/hardware/home-server-build-guide/)
- [Power Consumption Guide](/hardware/power-consumption-guide/)
- [Best RAM for Home Server](/hardware/best-ram-home-server/)

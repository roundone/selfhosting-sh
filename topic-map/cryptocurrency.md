# Cryptocurrency & Blockchain [0/16 complete]
**Priority:** medium
**SEO notes:** Annotated by Marketing 2026-02-16. Self-hosted crypto is a strong niche driven by sovereignty and privacy concerns. BTCPay Server has high search volume from merchants wanting to accept Bitcoin without third-party processors. "Run your own Bitcoin node" queries are evergreen and growing with each halving cycle. Umbrel is a crossover hit — homelab users discover it for Bitcoin and stay for the app ecosystem. Ethereum node queries spike around protocol upgrades. Coinbase alternative queries carry high commercial intent. Lightning Network tooling (LNbits, LND) is a growing sub-niche with low competition from existing self-hosting sites. Mempool and Electrs serve the "verify don't trust" crowd — high engagement, loyal audience. Hardware wallet queries are monetizable via affiliate but fall under hardware category, not here.
**Category keyword cluster:** "btcpay server docker", "run bitcoin node", "self-hosted crypto wallet", "umbrel setup", "best self-hosted bitcoin tools"
**Pillar page:** /best/bitcoin-tools

---

## Apps

### Self-Host BTCPay Server — Accept Bitcoin Payments Without Third Parties
- **URL slug:** /apps/btcpay-server
- **Content type:** app-guide
- **Target keyword:** "btcpay server docker compose"
- **Secondary keywords:** "btcpay server setup", "self-hosted bitcoin payment processor", "btcpay server install"
- **Estimated volume:** high
- **Priority:** 1
- **Status:** planned

### Self-Host Umbrel — Personal Bitcoin and Home Server OS
- **URL slug:** /apps/umbrel
- **Content type:** app-guide
- **Target keyword:** "umbrel setup guide"
- **Secondary keywords:** "umbrel install", "umbrel bitcoin node", "umbrel home server"
- **Estimated volume:** high
- **Priority:** 2
- **Status:** planned

### Self-Host Bitcoin Core — Run a Full Bitcoin Node
- **URL slug:** /apps/bitcoin-core
- **Content type:** app-guide
- **Target keyword:** "bitcoin core docker compose"
- **Secondary keywords:** "bitcoin full node docker", "self-hosted bitcoin node", "bitcoind setup"
- **Estimated volume:** high
- **Priority:** 3
- **Status:** planned

### Self-Host Geth — Run an Ethereum Full Node
- **URL slug:** /apps/geth
- **Content type:** app-guide
- **Target keyword:** "geth docker compose"
- **Secondary keywords:** "ethereum node docker", "run ethereum node", "geth setup guide"
- **Estimated volume:** medium-high
- **Priority:** 4
- **Status:** planned

### Self-Host LNbits — Lightning Network Wallet and Payment Tools
- **URL slug:** /apps/lnbits
- **Content type:** app-guide
- **Target keyword:** "lnbits docker compose"
- **Secondary keywords:** "lnbits setup", "self-hosted lightning wallet", "lnbits install"
- **Estimated volume:** medium
- **Priority:** 5
- **Status:** planned

### Self-Host Mempool — Bitcoin Blockchain Explorer and Visualizer
- **URL slug:** /apps/mempool
- **Content type:** app-guide
- **Target keyword:** "mempool docker compose"
- **Secondary keywords:** "mempool self-hosted", "self-hosted blockchain explorer", "mempool space setup"
- **Estimated volume:** medium
- **Priority:** 6
- **Status:** planned

### Self-Host Electrs — Electrum Server for Your Own Bitcoin Node
- **URL slug:** /apps/electrs
- **Content type:** app-guide
- **Target keyword:** "electrs docker compose"
- **Secondary keywords:** "electrs setup", "self-hosted electrum server", "electrs bitcoin"
- **Estimated volume:** low-medium
- **Priority:** 7
- **Status:** planned

---

## Comparisons

### BTCPay Server vs Square — Self-Hosted vs Managed Crypto Payments
- **URL slug:** /compare/btcpay-server-vs-square
- **Content type:** comparison
- **Target keyword:** "btcpay server vs square"
- **Secondary keywords:** "btcpay vs square payments", "self-hosted payment processor vs square", "bitcoin payment processing comparison"
- **Estimated volume:** medium
- **Priority:** 8
- **Status:** planned

### Umbrel vs Start9 — Bitcoin Node OS Compared
- **URL slug:** /compare/umbrel-vs-start9
- **Content type:** comparison
- **Target keyword:** "umbrel vs start9"
- **Secondary keywords:** "umbrel or start9", "best bitcoin node os", "embassy os vs umbrel"
- **Estimated volume:** medium
- **Priority:** 9
- **Status:** planned

### Geth vs Nethermind — Ethereum Execution Clients Compared
- **URL slug:** /compare/geth-vs-nethermind
- **Content type:** comparison
- **Target keyword:** "geth vs nethermind"
- **Secondary keywords:** "best ethereum client", "nethermind or geth", "ethereum execution client comparison"
- **Estimated volume:** medium
- **Priority:** 10
- **Status:** planned

---

## Roundup

### Best Self-Hosted Bitcoin Tools in 2026
- **URL slug:** /best/bitcoin-tools
- **Content type:** roundup
- **Target keyword:** "best self-hosted bitcoin tools"
- **Secondary keywords:** "self-hosted bitcoin software", "bitcoin node tools", "best bitcoin self-hosting stack"
- **Estimated volume:** high
- **Priority:** 14 (write after all app guides)
- **Status:** planned

---

## Replace Guides

### Self-Hosted Alternative to Coinbase — Take Custody of Your Crypto
- **URL slug:** /replace/coinbase
- **Content type:** replace
- **Target keyword:** "self-hosted alternative to coinbase"
- **Secondary keywords:** "coinbase alternative self-hosted", "replace coinbase self custody", "self custody bitcoin tools"
- **Estimated volume:** high
- **Priority:** 11
- **Status:** planned

---

## Foundations

### Running a Bitcoin Full Node — Complete Guide
- **URL slug:** /foundations/bitcoin-full-node
- **Content type:** foundation
- **Target keyword:** "how to run a bitcoin full node"
- **Secondary keywords:** "bitcoin full node guide", "run bitcoin node at home", "why run a full node"
- **Estimated volume:** high
- **Priority:** 12
- **Status:** planned

---

## Troubleshooting

### Bitcoin Node Sync Issues — Fix Guide
- **URL slug:** /troubleshooting/bitcoin-node-sync
- **Content type:** troubleshooting
- **Target keyword:** "bitcoin node not syncing"
- **Secondary keywords:** "bitcoin core sync slow", "bitcoin node sync issues", "bitcoind stuck syncing"
- **Estimated volume:** medium
- **Priority:** 13
- **Status:** planned

---

## Internal Link Strategy

**Pillar page:** `/best/bitcoin-tools` (roundup) links down to all app guides, comparisons, and the replace guide.

**Cluster links (every app guide links UP to pillar):**
- All 7 app guides link to `/best/bitcoin-tools`
- Bitcoin Core guide links to Electrs guide and Mempool guide (they depend on a full node)
- LNbits guide links to Bitcoin Core (requires a Lightning node backend)
- Geth guide links to `/foundations/bitcoin-full-node` for conceptual overlap on running nodes

**Cross-category links:**
- All Docker-based guides link to `/foundations/docker-compose` (foundation)
- Umbrel guide links to `/apps/nextcloud`, `/apps/jellyfin` (Umbrel app ecosystem overlap)
- BTCPay Server guide links to `/apps/nginx-proxy-manager` or relevant reverse proxy guide
- Foundation guide links to `/best/hardware` or relevant hardware guides (node hardware requirements)

**Replace guide links:**
- `/replace/coinbase` links to BTCPay Server, Bitcoin Core, LNbits, Electrs, and the pillar roundup

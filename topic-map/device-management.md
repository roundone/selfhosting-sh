# Device & Fleet Management [0/10 complete]
**Priority:** medium-high
**SEO notes:** Device management and fleet management are growing search categories as remote work drives demand for self-hosted RMM (Remote Monitoring & Management) and remote desktop solutions. TeamViewer and ConnectWise are expensive SaaS tools with strong "alternative to" search intent. MeshCentral is the dominant open-source player with high search volume. FleetDM targets the osquery/endpoint visibility niche. Tactical RMM is rising fast in the MSP community. Strong commercial intent — IT teams and MSPs actively searching for self-hosted replacements to cut per-device licensing costs.
**Category keyword cluster:** "self-hosted remote desktop", "meshcentral docker compose", "best self-hosted rmm", "self-hosted device management", "self-hosted fleet management"
**Pillar page:** /best/device-management

## Apps

### Self-Host FleetDM — Open-Source Device Management with osquery
- **Type:** app-guide
- **Target keyword:** "fleetdm docker compose"
- **Secondary keywords:** "fleet device management self-hosted", "fleetdm setup", "self-hosted osquery manager", "fleetdm installation"
- **URL slug:** /apps/fleetdm
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Unique angle — osquery-based endpoint visibility. Appeals to security-conscious IT teams. Link to network-monitoring category for complementary tooling.

### Self-Host MeshCentral — Full Remote Desktop and Device Management
- **Type:** app-guide
- **Target keyword:** "meshcentral docker compose"
- **Secondary keywords:** "meshcentral setup", "self-hosted remote desktop", "meshcentral installation guide", "meshcentral remote management"
- **URL slug:** /apps/meshcentral
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Most popular open-source remote management tool. High search volume. Cover agent deployment, mesh groups, and remote desktop/terminal features.

### Self-Host Tactical RMM — Remote Monitoring and Management for MSPs
- **Type:** app-guide
- **Target keyword:** "tactical rmm docker compose"
- **Secondary keywords:** "tactical rmm setup", "self-hosted rmm tool", "tactical rmm installation", "open source rmm"
- **URL slug:** /apps/tactical-rmm
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Built on MeshCentral agent. Popular with MSPs and sysadmins. Cover scripting, patching, alerting features. Note dependency on MeshCentral — cross-link to /apps/meshcentral.

### Self-Host Remotely — Lightweight Remote Desktop and Support
- **Type:** app-guide
- **Target keyword:** "remotely app docker compose"
- **Secondary keywords:** "remotely remote desktop self-hosted", "remotely setup", "self-hosted remote support tool", "remotely installation"
- **URL slug:** /apps/remotely
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Lighter-weight alternative to MeshCentral. .NET-based. Good for teams that want simple remote support without full RMM features.

## Comparisons

### MeshCentral vs RustDesk — Self-Hosted Remote Desktop Compared
- **Type:** compare
- **Target keyword:** "meshcentral vs rustdesk"
- **Secondary keywords:** "meshcentral or rustdesk", "best self-hosted remote desktop", "rustdesk vs meshcentral comparison"
- **URL slug:** /compare/meshcentral-vs-rustdesk
- **Priority:** medium-high
- **Status:** planned
- **Notes:** High-interest comparison — both are top self-hosted remote desktop tools. RustDesk is covered as a standalone app (cross-link to /apps/rustdesk). Focus on remote desktop UX, protocol performance, client platforms, and agent management differences.

### FleetDM vs Tactical RMM — Endpoint Management Approaches Compared
- **Type:** compare
- **Target keyword:** "fleetdm vs tactical rmm"
- **Secondary keywords:** "fleet vs tactical rmm", "best self-hosted endpoint management", "osquery vs rmm"
- **URL slug:** /compare/fleetdm-vs-tactical-rmm
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Different philosophies — FleetDM is osquery-based visibility and compliance, Tactical RMM is traditional RMM with scripting and patching. Clarify which use case each serves best.

### MeshCentral vs Apache Guacamole — Remote Access Solutions Compared
- **Type:** compare
- **Target keyword:** "meshcentral vs guacamole"
- **Secondary keywords:** "meshcentral or apache guacamole", "self-hosted remote access comparison", "guacamole vs meshcentral"
- **URL slug:** /compare/meshcentral-vs-guacamole
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Different approaches — MeshCentral uses agents for full device management, Guacamole is a clientless remote desktop gateway (RDP/VNC/SSH via browser). Cross-link to /apps/guacamole. Clarify when to use each.

## Roundup

### Best Self-Hosted Remote Desktop & Device Management Tools in 2026
- **Type:** best
- **Target keyword:** "best self-hosted remote desktop tools"
- **Secondary keywords:** "best self-hosted device management", "best self-hosted rmm", "top remote desktop self-hosted 2026", "best open source remote management"
- **URL slug:** /best/device-management
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Pillar page for the category. Cover all apps: MeshCentral, Tactical RMM, FleetDM, Remotely, RustDesk, Apache Guacamole. Include comparison table with features, ease of setup, best-for use cases. Link down to every app guide and comparison in this category. Write after all app guides are done.

## Replace Guides

### Self-Hosted Alternative to TeamViewer
- **Type:** replace
- **Target keyword:** "self-hosted alternative to teamviewer"
- **Secondary keywords:** "teamviewer replacement self-hosted", "free teamviewer alternative", "open source teamviewer alternative", "replace teamviewer"
- **URL slug:** /replace/teamviewer
- **Priority:** medium-high
- **Status:** planned
- **Notes:** Very high commercial intent — TeamViewer's per-device pricing pushes users to search for alternatives. Recommend MeshCentral as primary replacement, RustDesk for simpler remote desktop needs. Cross-link to /apps/meshcentral, /apps/rustdesk, /apps/remotely.

### Self-Hosted Alternative to ConnectWise
- **Type:** replace
- **Target keyword:** "self-hosted alternative to connectwise"
- **Secondary keywords:** "connectwise replacement self-hosted", "free connectwise alternative", "open source connectwise alternative", "replace connectwise control"
- **URL slug:** /replace/connectwise
- **Priority:** medium-high
- **Status:** planned
- **Notes:** ConnectWise (ScreenConnect/Control + Automate) is expensive MSP tooling. Recommend Tactical RMM as the closest self-hosted replacement (RMM + remote access). Cross-link to /apps/tactical-rmm, /apps/meshcentral.

## Internal Link Map

**Cross-category links:**
- /apps/rustdesk (covered in vpn-remote-access or standalone) — cross-link into this category
- /apps/guacamole (covered in vpn-remote-access or standalone) — cross-link into comparisons
- /best/network-monitoring — complementary category for IT infrastructure
- Foundation guides: Docker Compose, reverse proxy setup — link from all app guides

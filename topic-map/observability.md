# Observability & APM [0/14 complete]
**Priority:** medium-high
**SEO notes:** Keyword cluster: "self-hosted observability", "self-hosted APM", "self-hosted tracing", "open source observability platform". This category covers distributed tracing, application performance monitoring, and full-stack observability platforms. SigNoz and Uptrace are the rising all-in-one OpenTelemetry-native platforms. Jaeger and Zipkin are established distributed tracing tools. Self-hosted Sentry is a dominant player in error tracking/APM. Replace guides targeting Datadog and New Relic have very high commercial intent (engineering teams evaluating cost reduction). Cross-links to monitoring and logging categories are strong — many users searching observability are already running Grafana/Prometheus and want tracing added. Strategy: lead with SigNoz and Jaeger (highest search interest, OpenTelemetry alignment), then Sentry self-hosted (massive brand recognition), then fill in Uptrace, Highlight.io, and Zipkin.

---

## App Guides

### Self-Host Jaeger — Distributed Tracing with Docker
- **Type:** app-guide
- **Target keyword:** "jaeger docker compose"
- **Secondary keywords:** "self-host jaeger", "jaeger tracing setup", "jaeger docker tutorial", "jaeger distributed tracing"
- **URL slug:** /apps/jaeger
- **Priority:** high
- **Status:** planned

### Self-Host SigNoz — Open Source Observability Platform
- **Type:** app-guide
- **Target keyword:** "signoz docker compose"
- **Secondary keywords:** "self-host signoz", "signoz setup guide", "signoz observability", "signoz docker install"
- **URL slug:** /apps/signoz
- **Priority:** high
- **Status:** planned

### Self-Host Sentry — Error Tracking and Performance Monitoring
- **Type:** app-guide
- **Target keyword:** "sentry self-hosted docker compose"
- **Secondary keywords:** "self-host sentry", "sentry on-premise setup", "sentry docker install", "sentry self-hosted guide"
- **URL slug:** /apps/sentry
- **Priority:** high
- **Status:** planned

### Self-Host Highlight.io — Full-Stack Observability and Session Replay
- **Type:** app-guide
- **Target keyword:** "highlight.io self-hosted"
- **Secondary keywords:** "highlight.io docker compose", "self-host highlight", "highlight.io setup", "open source session replay"
- **URL slug:** /apps/highlight
- **Priority:** medium
- **Status:** planned

### Self-Host Uptrace — OpenTelemetry APM with Docker
- **Type:** app-guide
- **Target keyword:** "uptrace docker compose"
- **Secondary keywords:** "self-host uptrace", "uptrace setup guide", "uptrace opentelemetry", "uptrace APM"
- **URL slug:** /apps/uptrace
- **Priority:** medium
- **Status:** planned

### Self-Host Zipkin — Distributed Tracing System
- **Type:** app-guide
- **Target keyword:** "zipkin docker compose"
- **Secondary keywords:** "self-host zipkin", "zipkin tracing setup", "zipkin docker tutorial", "zipkin distributed tracing"
- **URL slug:** /apps/zipkin
- **Priority:** medium
- **Status:** planned

---

## Comparisons

### SigNoz vs Jaeger — OpenTelemetry Observability Compared
- **Type:** compare
- **Target keyword:** "signoz vs jaeger"
- **Secondary keywords:** "signoz or jaeger", "best self-hosted tracing", "opentelemetry tracing comparison"
- **URL slug:** /compare/signoz-vs-jaeger
- **Priority:** high
- **Status:** planned

### Sentry Self-Hosted vs Highlight.io — Error Tracking and APM Compared
- **Type:** compare
- **Target keyword:** "sentry vs highlight.io"
- **Secondary keywords:** "sentry or highlight", "self-hosted error tracking comparison", "sentry alternative open source"
- **URL slug:** /compare/sentry-vs-highlight
- **Priority:** medium-high
- **Status:** planned

### SigNoz vs Grafana Stack — Full-Stack Observability Compared
- **Type:** compare
- **Target keyword:** "signoz vs grafana"
- **Secondary keywords:** "signoz or grafana stack", "signoz vs prometheus grafana", "all-in-one observability vs grafana"
- **URL slug:** /compare/signoz-vs-grafana-stack
- **Priority:** medium-high
- **Status:** planned

---

## Roundup

### Best Self-Hosted Observability Platforms in 2026
- **Type:** best
- **Target keyword:** "best self-hosted observability tools"
- **Secondary keywords:** "best self-hosted APM", "best open source observability", "self-hosted observability platforms 2026", "best self-hosted tracing"
- **URL slug:** /best/observability
- **Priority:** high (write after app guides complete)
- **Status:** planned

---

## Replace Guides

### Self-Hosted Alternative to Datadog — Observability Without the Bill
- **Type:** replace
- **Target keyword:** "self-hosted alternative to datadog"
- **Secondary keywords:** "datadog replacement self-hosted", "datadog alternative open source", "replace datadog self-hosted"
- **URL slug:** /replace/datadog-observability
- **Priority:** high
- **Status:** planned

### Self-Hosted Alternative to New Relic — APM You Own
- **Type:** replace
- **Target keyword:** "self-hosted alternative to new relic"
- **Secondary keywords:** "new relic replacement self-hosted", "new relic alternative open source", "self-hosted APM"
- **URL slug:** /replace/new-relic
- **Priority:** high
- **Status:** planned

### Self-Hosted Alternative to Sentry Cloud — Error Tracking On Your Terms
- **Type:** replace
- **Target keyword:** "self-hosted alternative to sentry"
- **Secondary keywords:** "sentry self-hosted vs cloud", "sentry alternative self-hosted", "run sentry yourself"
- **URL slug:** /replace/sentry-cloud
- **Priority:** medium-high
- **Status:** planned

---

## Foundation

### Self-Hosted Observability Stack Guide — Tracing, Metrics, and Logs
- **Type:** foundation
- **Target keyword:** "self-hosted observability stack"
- **Secondary keywords:** "observability stack docker compose", "opentelemetry self-hosted setup", "build your own observability stack", "tracing metrics logs self-hosted"
- **URL slug:** /guides/observability-stack
- **Priority:** medium-high
- **Status:** planned

---

## Internal Link Strategy

**Pillar page:** /best/observability (links down to all app guides, comparisons, and replace guides)

**Cross-category links:**
- All app guides link to /best/observability (pillar)
- All app guides link to the foundation guide (/guides/observability-stack)
- SigNoz and Jaeger guides link to /compare/signoz-vs-jaeger
- Sentry and Highlight guides link to /compare/sentry-vs-highlight
- SigNoz guide links to /compare/signoz-vs-grafana-stack
- Replace guides link to relevant app guides (Datadog replace -> SigNoz, Jaeger, Uptrace; New Relic replace -> SigNoz, Uptrace; Sentry Cloud replace -> Sentry self-hosted, Highlight.io)
- Cross-link to monitoring category: /apps/grafana, /apps/prometheus, /best/monitoring
- Cross-link to logging category: /apps/grafana-loki, /best/logging
- Foundation guide links to OpenTelemetry Collector docs and all app guides in this category

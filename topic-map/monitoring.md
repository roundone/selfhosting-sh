# Monitoring & Uptime [3/17 complete]
**Priority:** medium
**SEO notes:** Keyword cluster: "self-hosted monitoring", "self-hosted uptime monitoring", "grafana docker compose", "prometheus docker compose", "best self-hosted monitoring". Grafana and Prometheus together form the dominant monitoring stack in the self-hosting world with extremely high search volume. Uptime Kuma has surged in popularity as a lightweight uptime monitor. Netdata is a strong all-in-one alternative with growing interest. Replace guides for Datadog, UptimeRobot, Pingdom, and New Relic target high commercial intent (DevOps professionals evaluating self-hosted alternatives to expensive SaaS). Strategy: lead with Grafana and Prometheus (highest volume, cornerstone of the category), then Uptime Kuma (already done), then fill in Netdata, Zabbix, and niche tools.

## Apps
- [x] /apps/uptime-kuma — done 2026-02-16 | **Target:** "uptime kuma docker compose" | **Secondary:** "self-host uptime kuma", "uptime kuma setup" | **Volume:** Very High | **Priority:** done
- [x] /apps/grafana — done 2026-02-16 | **Target:** "grafana docker compose" | **Volume:** Very High | **Priority:** done
- [x] /apps/prometheus — done 2026-02-16 | **Target:** "prometheus docker compose" | **Volume:** Very High | **Priority:** done
- [ ] /apps/netdata — **Target:** "netdata docker compose" | **Secondary:** "self-host netdata", "netdata setup guide", "netdata monitoring" | **Volume:** High | **Priority:** 3
- [ ] /apps/zabbix — **Target:** "zabbix docker compose" | **Secondary:** "self-host zabbix", "zabbix setup guide", "zabbix monitoring docker" | **Volume:** High | **Priority:** 4
- [ ] /apps/beszel — **Target:** "beszel docker compose" | **Secondary:** "self-host beszel", "beszel setup guide", "beszel monitoring" | **Volume:** Low-Medium | **Priority:** 5
- [ ] /apps/checkmk — **Target:** "checkmk docker compose" | **Secondary:** "self-host checkmk", "checkmk setup guide", "checkmk monitoring" | **Volume:** Medium | **Priority:** 6

## Comparisons
- [ ] /compare/grafana-vs-netdata — **Target:** "grafana vs netdata" | **Secondary:** "grafana or netdata", "best self-hosted monitoring dashboard" | **Volume:** High | **Priority:** 1
- [ ] /compare/prometheus-vs-zabbix — **Target:** "prometheus vs zabbix" | **Secondary:** "prometheus or zabbix", "best self-hosted monitoring system" | **Volume:** High | **Priority:** 2
- [ ] /compare/uptime-kuma-vs-uptimerobot-alternatives — **Target:** "uptime kuma vs uptimerobot" | **Secondary:** "self-hosted uptime monitor", "uptimerobot alternative self-hosted" | **Volume:** High | **Priority:** 3
- [ ] /compare/grafana-prometheus-stack-guide — **Target:** "grafana prometheus stack docker" | **Secondary:** "grafana prometheus setup", "monitoring stack docker compose" | **Volume:** Medium-High | **Priority:** 4
- [ ] /compare/netdata-vs-beszel — **Target:** "netdata vs beszel" | **Secondary:** "netdata or beszel", "lightweight self-hosted monitoring" | **Volume:** Low | **Priority:** 5

## Roundup
- [ ] /best/monitoring — **Target:** "best self-hosted monitoring tools" | **Secondary:** "best self-hosted monitoring", "best self-hosted uptime monitor", "top self-hosted monitoring 2026" | **Volume:** Very High | **Priority:** write after all app guides done

## Replace Guides
- [ ] /replace/datadog — **Target:** "self-hosted alternative to datadog" | **Secondary:** "datadog replacement self-hosted", "self-hosted datadog alternative" | **Volume:** High | **Priority:** 1
- [ ] /replace/uptimerobot — **Target:** "self-hosted alternative to uptimerobot" | **Secondary:** "uptimerobot replacement self-hosted", "free uptimerobot alternative" | **Volume:** High | **Priority:** 2
- [ ] /replace/new-relic — **Target:** "self-hosted alternative to new relic" | **Secondary:** "new relic replacement self-hosted", "self-hosted APM" | **Volume:** Medium-High | **Priority:** 3
- [ ] /replace/pingdom — **Target:** "self-hosted alternative to pingdom" | **Secondary:** "pingdom replacement self-hosted", "free pingdom alternative" | **Volume:** Medium | **Priority:** 4

## Expanded Apps (Marketing iteration — topic map expansion)

### Self-Host Glances — System Monitoring at a Glance
- **URL slug:** /apps/glances
- **Content type:** app-guide
- **Target keyword:** "glances docker compose"
- **Secondary keywords:** "glances setup", "glances monitoring", "system monitoring self-hosted"
- **Estimated volume:** medium-high
- **Priority:** 7
- **Status:** planned

### Self-Host Healthchecks.io — Cron Job and Service Monitoring
- **URL slug:** /apps/healthchecks
- **Content type:** app-guide
- **Target keyword:** "healthchecks docker compose"
- **Secondary keywords:** "healthchecks.io self-hosted", "cron monitoring self-hosted", "healthchecks setup"
- **Estimated volume:** medium-high
- **Priority:** 8
- **Status:** planned

### Self-Host Gatus — Health Dashboard with Alerting
- **URL slug:** /apps/gatus
- **Content type:** app-guide
- **Target keyword:** "gatus docker compose"
- **Secondary keywords:** "gatus setup", "gatus health monitoring", "service health dashboard"
- **Estimated volume:** medium
- **Priority:** 9
- **Status:** planned

### Self-Host Monit — Process and System Monitoring
- **URL slug:** /apps/monit
- **Content type:** app-guide
- **Target keyword:** "monit docker setup"
- **Secondary keywords:** "monit monitoring setup", "monit process monitoring", "monit self-hosted"
- **Estimated volume:** medium
- **Priority:** 10
- **Status:** planned

## Expanded Comparisons

### Netdata vs Glances — Real-Time System Monitoring Compared
- **URL slug:** /compare/netdata-vs-glances
- **Content type:** comparison
- **Target keyword:** "netdata vs glances"
- **Secondary keywords:** "netdata or glances", "best system monitor self-hosted"
- **Estimated volume:** medium
- **Priority:** 6
- **Status:** planned

### Uptime Kuma vs Healthchecks — Uptime vs Cron Monitoring
- **URL slug:** /compare/uptime-kuma-vs-healthchecks
- **Content type:** comparison
- **Target keyword:** "uptime kuma vs healthchecks"
- **Secondary keywords:** "uptime kuma or healthchecks", "cron monitoring vs uptime monitoring"
- **Estimated volume:** medium
- **Priority:** 7
- **Status:** planned

### Uptime Kuma vs Gatus — Status Page Monitoring Compared
- **URL slug:** /compare/uptime-kuma-vs-gatus
- **Content type:** comparison
- **Target keyword:** "uptime kuma vs gatus"
- **Secondary keywords:** "uptime kuma or gatus", "health dashboard comparison"
- **Estimated volume:** low-medium
- **Priority:** 8
- **Status:** planned

### Checkmk vs Zabbix — Enterprise Monitoring Compared
- **URL slug:** /compare/checkmk-vs-zabbix
- **Content type:** comparison
- **Target keyword:** "checkmk vs zabbix"
- **Secondary keywords:** "checkmk or zabbix", "enterprise monitoring comparison"
- **Estimated volume:** medium-high
- **Priority:** 9
- **Status:** planned

## Expanded Troubleshooting

### Grafana Dashboard Not Loading Data — Fix Guide
- **URL slug:** /troubleshooting/grafana-no-data
- **Content type:** troubleshooting
- **Target keyword:** "grafana dashboard no data"
- **Secondary keywords:** "grafana not showing data", "grafana prometheus no data"
- **Estimated volume:** high
- **Priority:** 1
- **Status:** planned

### Prometheus High Memory Usage — Optimization Guide
- **URL slug:** /troubleshooting/prometheus-memory
- **Content type:** troubleshooting
- **Target keyword:** "prometheus high memory usage"
- **Secondary keywords:** "prometheus memory optimization", "prometheus storage retention"
- **Estimated volume:** medium-high
- **Priority:** 2
- **Status:** planned

### Uptime Kuma Notifications Not Sending — Fix Guide
- **URL slug:** /troubleshooting/uptime-kuma-notifications
- **Content type:** troubleshooting
- **Target keyword:** "uptime kuma notifications not working"
- **Secondary keywords:** "uptime kuma alert setup", "uptime kuma notification fix"
- **Estimated volume:** medium
- **Priority:** 3
- **Status:** planned

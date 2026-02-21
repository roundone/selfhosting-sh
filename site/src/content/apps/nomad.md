---
title: "How to Self-Host HashiCorp Nomad"
description: "Deploy HashiCorp Nomad for self-hosted workload orchestration — a simple, flexible alternative to Kubernetes for containers and more."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - nomad
tags:
  - self-hosted
  - nomad
  - hashicorp
  - container-orchestration
  - workload-orchestration
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nomad?

[Nomad](https://www.nomadproject.io/) is HashiCorp's workload orchestrator. Unlike Kubernetes (containers only), Nomad schedules containers, VMs, Java applications, and raw binaries. It's a single binary with no external dependencies — no etcd, no CNI plugins, no service mesh required. It integrates with Consul for service discovery and Vault for secrets, but both are optional.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- 512 MB of RAM minimum
- 1 CPU core minimum
- Docker installed (for container workloads)
- Ports: 4646 (HTTP API), 4647 (RPC), 4648 (Serf)

## Installation

### Single Binary Install

```bash
# Download Nomad
wget https://releases.hashicorp.com/nomad/1.11.2/nomad_1.11.2_linux_amd64.zip
unzip nomad_1.11.2_linux_amd64.zip
sudo mv nomad /usr/local/bin/
nomad version
```

### Dev Mode (Quick Start)

For testing, run Nomad in dev mode (server + client in one, no persistence):

```bash
nomad agent -dev -bind 0.0.0.0
```

Access the UI at `http://your-server:4646`.

### Production Setup

Create a configuration file:

```hcl
# /etc/nomad.d/nomad.hcl

datacenter = "dc1"
data_dir   = "/opt/nomad/data"
bind_addr  = "0.0.0.0"

# Server configuration (run on 1, 3, or 5 nodes)
server {
  enabled          = true
  bootstrap_expect = 1  # Set to 3 for HA
}

# Client configuration (run on all nodes that execute workloads)
client {
  enabled = true
}

# Enable the Docker driver
plugin "docker" {
  config {
    allow_privileged = false
    volumes {
      enabled = true
    }
  }
}

# Web UI
ui {
  enabled = true
}
```

Create a systemd service:

```ini
# /etc/systemd/system/nomad.service
[Unit]
Description=Nomad
Documentation=https://www.nomadproject.io/docs
Wants=network-online.target
After=network-online.target

[Service]
ExecReload=/bin/kill -HUP $MAINPID
ExecStart=/usr/local/bin/nomad agent -config /etc/nomad.d
KillMode=process
KillSignal=SIGINT
LimitNOFILE=65536
LimitNPROC=infinity
Restart=on-failure
RestartSec=2
TasksMax=infinity

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /opt/nomad/data /etc/nomad.d
sudo systemctl daemon-reload
sudo systemctl enable --now nomad
```

## Initial Setup

1. Access the Nomad UI at `http://your-server:4646`
2. Check cluster health: `nomad status`
3. Verify the node is ready: `nomad node status`

### Deploy Your First Job

Create a job file:

```hcl
# nginx.nomad.hcl
job "nginx" {
  datacenters = ["dc1"]
  type        = "service"

  group "web" {
    count = 2

    network {
      port "http" {
        static = 80
      }
    }

    task "nginx" {
      driver = "docker"

      config {
        image = "nginx:1.27"
        ports = ["http"]
      }

      resources {
        cpu    = 100  # MHz
        memory = 128  # MB
      }
    }
  }
}
```

```bash
nomad job run nginx.nomad.hcl
nomad job status nginx
```

## Configuration

### Job Types

| Type | Use Case |
|------|----------|
| `service` | Long-running services (web apps, databases) |
| `batch` | Short-lived jobs (data processing, scripts) |
| `system` | One instance per node (monitoring agents) |
| `sysbatch` | One-time execution per node |

### Task Drivers

Nomad supports multiple workload types:

```hcl
# Docker container
task "web" {
  driver = "docker"
  config {
    image = "nginx:1.27"
  }
}

# Raw binary
task "app" {
  driver = "raw_exec"
  config {
    command = "/usr/local/bin/myapp"
    args    = ["--port", "8080"]
  }
}

# Java application
task "api" {
  driver = "java"
  config {
    jar_path = "local/app.jar"
  }
}
```

### Service Discovery (with Consul)

For service discovery, install Consul alongside Nomad:

```hcl
# In the task group
service {
  name = "nginx"
  port = "http"

  check {
    type     = "http"
    path     = "/"
    interval = "10s"
    timeout  = "2s"
  }
}
```

### Templates and Secrets (with Vault)

```hcl
task "app" {
  template {
    data = <<EOH
DB_HOST={{ key "db/host" }}
DB_PASS={{ with secret "secret/data/db" }}{{ .Data.data.password }}{{ end }}
EOH
    destination = "secrets/env.txt"
    env         = true
  }
}
```

### Resource Constraints

```hcl
resources {
  cpu    = 500   # MHz
  memory = 256   # MB
}

constraint {
  attribute = "${attr.kernel.name}"
  value     = "linux"
}

affinity {
  attribute = "${node.datacenter}"
  value     = "dc1"
  weight    = 100
}
```

## Advanced Configuration (Optional)

### Multi-Node Cluster

On additional nodes, configure as clients pointing to the server:

```hcl
# /etc/nomad.d/nomad.hcl (client node)
datacenter = "dc1"
data_dir   = "/opt/nomad/data"

client {
  enabled = true
  servers = ["server-ip:4647"]
}
```

### High Availability

For HA, run 3 or 5 server nodes:

```hcl
server {
  enabled          = true
  bootstrap_expect = 3
  server_join {
    retry_join = ["server1-ip", "server2-ip", "server3-ip"]
  }
}
```

### ACL System

Enable access control for production:

```hcl
acl {
  enabled = true
}
```

Bootstrap the ACL system after enabling:

```bash
nomad acl bootstrap
```

## Backup

Back up Nomad's Raft data:

```bash
# Snapshot the state
nomad operator snapshot save nomad-backup.snap

# Restore
nomad operator snapshot restore nomad-backup.snap
```

For a full strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Job Stuck in Pending

**Symptom:** Job stays in "pending" state, allocations not placed.

**Fix:** Check evaluation details:

```bash
nomad job status nginx
nomad eval status <eval-id>
```

Common causes: insufficient resources on available nodes, or no nodes matching constraints.

### Docker Driver Not Available

**Symptom:** "No drivers for task" error when running Docker jobs.

**Fix:** Ensure Docker is installed and the Nomad client can access the Docker socket:

```bash
docker info
nomad node status -self -verbose | grep docker
```

### Node Not Joining Cluster

**Symptom:** Client node doesn't appear in `nomad node status`.

**Fix:** Verify network connectivity on ports 4647 (RPC) and 4648 (Serf). Check client logs:

```bash
journalctl -u nomad -f
```

## Resource Requirements

- **RAM:** 256 MB (Nomad server only), 512 MB with workloads
- **CPU:** 1 core minimum
- **Disk:** 50 MB for Nomad binary, plus data directory for state

## Verdict

Nomad is the simplest orchestrator available. A single binary, no dependencies, and a configuration language (HCL) that's more readable than Kubernetes YAML. If you're in the HashiCorp ecosystem (Consul, Vault, Terraform) or need to orchestrate non-container workloads, Nomad is excellent.

**Use Nomad if:** You want simple orchestration without Kubernetes complexity. You need to run mixed workloads (containers + binaries + Java). You're already using HashiCorp tools.

**Consider k3s instead if:** You want access to the Kubernetes ecosystem (Helm charts, operators). Most self-hosted apps ship Kubernetes manifests, not Nomad job files. See [Nomad vs Kubernetes](/compare/nomad-vs-kubernetes/).

**Note:** Nomad uses the BSL 1.1 license (source-available, not open source). Self-hosting for internal use is fine, but you cannot offer Nomad as a managed service.

## FAQ

### Is Nomad free?

Nomad is free to use for non-competitive purposes under BSL 1.1. Self-hosting for internal use is permitted. The Enterprise version adds namespace quotas, multi-region federation, and audit logging.

### Do I need Consul and Vault?

No. Nomad works standalone. Consul adds service discovery and health checking. Vault adds secret management. Both are optional but recommended for production.

### Can Nomad replace Kubernetes?

For workload scheduling, yes. Nomad lacks the Kubernetes ecosystem — no Helm, no operators, no CRDs. If your apps ship Kubernetes manifests (most do), you'd need to rewrite them as Nomad job files.

## Related

- [Nomad vs Kubernetes](/compare/nomad-vs-kubernetes/)
- [How to Self-Host k3s](/apps/k3s/)
- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes/)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration/)
- [Container Orchestration Basics](/foundations/container-orchestration-basics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)

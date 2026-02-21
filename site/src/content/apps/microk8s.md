---
title: "How to Self-Host MicroK8s: Snap-Based Kubernetes"
description: "Deploy MicroK8s on your server — a minimal, snap-packaged Kubernetes distribution by Canonical with built-in addons."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - microk8s
tags:
  - self-hosted
  - microk8s
  - kubernetes
  - canonical
  - container-orchestration
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is MicroK8s?

[MicroK8s](https://microk8s.io/) is Canonical's minimal Kubernetes distribution, installed as a snap package. It runs the full Kubernetes API with containerd, and adds functionality through addons — enable DNS, dashboard, ingress, storage, or GPU support with a single command. It's designed for developers, edge computing, and IoT.

## Prerequisites

- A Linux server with snap support (Ubuntu recommended, works on 42+ distros)
- 540 MB of RAM minimum (4 GB recommended for workloads)
- 20 GB of free disk space
- 2 CPU cores (practical minimum)
- Root or sudo access

## Installation

```bash
# Install MicroK8s
sudo snap install microk8s --classic --channel=1.35/stable

# Add your user to the microk8s group (avoids sudo for commands)
sudo usermod -a -G microk8s $USER
newgrp microk8s

# Wait for MicroK8s to be ready
microk8s status --wait-ready
```

Verify the installation:

```bash
microk8s kubectl get nodes
microk8s kubectl get pods -A
```

## Initial Setup

### Enable Essential Addons

MicroK8s starts minimal. Enable the addons you need:

```bash
# DNS (required for most workloads)
microk8s enable dns

# Storage (local path provisioner)
microk8s enable hostpath-storage

# Dashboard (web UI)
microk8s enable dashboard

# Ingress (nginx controller)
microk8s enable ingress

# Metrics server (for kubectl top)
microk8s enable metrics-server
```

### Configure kubectl Alias

```bash
# Option 1: Use the built-in alias
alias kubectl='microk8s kubectl'

# Option 2: Export kubeconfig for standard kubectl
microk8s config > ~/.kube/config
```

### Access the Dashboard

```bash
# Get the dashboard token
microk8s kubectl create token default

# Port-forward to access
microk8s kubectl port-forward -n kube-system svc/kubernetes-dashboard 10443:443
```

Access at `https://localhost:10443` with the token.

### Deploy Your First Application

```bash
microk8s kubectl create deployment nginx --image=nginx:1.27
microk8s kubectl expose deployment nginx --port=80 --type=NodePort
microk8s kubectl get svc nginx
```

## Configuration

### Available Addons

| Addon | Command | Purpose |
|-------|---------|---------|
| `dns` | `microk8s enable dns` | CoreDNS for cluster DNS |
| `dashboard` | `microk8s enable dashboard` | Kubernetes Dashboard UI |
| `ingress` | `microk8s enable ingress` | Nginx ingress controller |
| `hostpath-storage` | `microk8s enable hostpath-storage` | Local storage provisioner |
| `metallb` | `microk8s enable metallb:10.0.0.100-10.0.0.200` | Load balancer (bare metal) |
| `cert-manager` | `microk8s enable cert-manager` | TLS certificate automation |
| `helm3` | `microk8s enable helm3` | Helm package manager |
| `prometheus` | `microk8s enable prometheus` | Monitoring stack |
| `registry` | `microk8s enable registry` | Private image registry (localhost:32000) |
| `gpu` | `microk8s enable gpu` | NVIDIA GPU support |
| `rbac` | `microk8s enable rbac` | Role-based access control |
| `community` | `microk8s enable community` | Access community addons |

### Multi-Node Cluster

On the first node, generate a join token:

```bash
microk8s add-node
```

This outputs a join command. On each additional node:

```bash
# Install MicroK8s on the new node first
sudo snap install microk8s --classic --channel=1.35/stable

# Join the cluster
microk8s join <master-ip>:25000/<token>
```

### Using Helm

```bash
microk8s enable helm3
microk8s helm3 repo add bitnami https://charts.bitnami.com/bitnami
microk8s helm3 install my-app bitnami/wordpress
```

### Private Registry

MicroK8s includes a built-in registry addon:

```bash
microk8s enable registry

# Push images to localhost:32000
docker tag myimage localhost:32000/myimage
docker push localhost:32000/myimage

# Use in deployments
# image: localhost:32000/myimage
```

## Advanced Configuration (Optional)

### High Availability

Enable HA for multi-node clusters:

```bash
microk8s enable ha-cluster
```

Requires 3+ nodes. Uses Dqlite (distributed SQLite) for consensus.

### GPU Workloads

For AI/ML workloads with NVIDIA GPUs:

```bash
# Install NVIDIA drivers first
sudo ubuntu-drivers autoinstall

# Enable GPU addon
microk8s enable gpu
```

### Cilium Networking

Replace the default Calico CNI with Cilium:

```bash
microk8s enable community
microk8s enable cilium
```

### Custom Configuration

MicroK8s stores configuration in `/var/snap/microk8s/current/args/`:

```bash
# Edit kube-apiserver arguments
sudo nano /var/snap/microk8s/current/args/kube-apiserver

# Restart after changes
microk8s stop && microk8s start
```

## Backup

```bash
# Export cluster state
microk8s kubectl get all -A -o yaml > cluster-backup.yaml

# Back up persistent data
sudo tar czf microk8s-data.tar.gz /var/snap/microk8s/common/

# Back up Dqlite (HA mode)
sudo cp -r /var/snap/microk8s/current/var/kubernetes/backend/ ./dqlite-backup/
```

For a full strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### MicroK8s Status Shows "Not Running"

**Symptom:** `microk8s status` shows services not running.

**Fix:** Inspect and restart:

```bash
microk8s inspect
microk8s stop && microk8s start
```

Check `/var/snap/microk8s/common/var/log/` for component logs.

### DNS Not Working

**Symptom:** Pods can't resolve service names.

**Fix:** Ensure the DNS addon is enabled:

```bash
microk8s enable dns
microk8s kubectl get pods -n kube-system -l k8s-app=kube-dns
```

If pods show errors, restart:

```bash
microk8s kubectl rollout restart deployment/coredns -n kube-system
```

### Storage PVC Stuck in Pending

**Symptom:** PersistentVolumeClaims stay in Pending state.

**Fix:** Enable the storage addon:

```bash
microk8s enable hostpath-storage
```

Verify the storage class:

```bash
microk8s kubectl get sc
```

### Snap Refresh Breaks Cluster

**Symptom:** After a snap auto-refresh, MicroK8s stops working.

**Fix:** Hold the snap to prevent auto-updates:

```bash
sudo snap refresh --hold microk8s
```

Manually update when ready:

```bash
sudo snap refresh microk8s --channel=1.35/stable
```

## Resource Requirements

- **RAM:** 540 MB minimum (MicroK8s only), 4 GB for running workloads
- **CPU:** 2 cores recommended
- **Disk:** 20 GB recommended (snap + images + data)

## Verdict

MicroK8s is a solid Kubernetes distribution with a unique addon-based architecture. The `microk8s enable` commands make it easy to add functionality incrementally. However, the snap dependency is a dealbreaker for some — it doesn't work on distros without snap, and snap auto-updates can break your cluster.

**Use MicroK8s if:** You're on Ubuntu and want a Kubernetes distribution with easy addon management. The built-in registry, GPU support, and HA clustering are well-integrated.

**Consider k3s instead if:** You want a lighter, snap-free Kubernetes distribution that works on any Linux. k3s uses fewer resources and installs without package manager dependencies. See [k3s vs MicroK8s](/compare/k3s-vs-microk8s/).

## FAQ

### Does MicroK8s require snap?

Yes. MicroK8s is distributed exclusively as a snap package. There's no APT/YUM/binary option.

### Can MicroK8s run on Raspberry Pi?

Yes. MicroK8s supports ARM64 and runs on Raspberry Pi 4 and later with Ubuntu.

### Is MicroK8s production-ready?

Yes, with caveats. Canonical positions MicroK8s for production edge computing. For multi-node production clusters, enable HA and disable snap auto-refresh.

## Related

- [k3s vs MicroK8s](/compare/k3s-vs-microk8s/)
- [How to Self-Host k3s](/apps/k3s/)
- [k3s vs Kubernetes](/compare/k3s-vs-k8s/)
- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes/)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration/)
- [Container Orchestration Basics](/foundations/container-orchestration-basics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)

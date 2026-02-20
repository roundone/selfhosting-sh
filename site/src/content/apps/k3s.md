---
title: "How to Self-Host k3s: Lightweight Kubernetes Setup"
description: "Deploy k3s on your server — a lightweight, certified Kubernetes distribution that installs in 30 seconds and runs in 512 MB RAM."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - k3s
tags:
  - self-hosted
  - k3s
  - kubernetes
  - container-orchestration
  - lightweight
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is k3s?

[k3s](https://k3s.io/) is a lightweight, CNCF-certified Kubernetes distribution built by Rancher Labs (now SUSE). It packages the entire Kubernetes control plane into a single ~70 MB binary, replaces etcd with SQLite for single-node setups, and bundles Traefik, CoreDNS, Flannel, and a local path provisioner. It's real Kubernetes — every Helm chart and kubectl command works — just without the operational overhead.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- 512 MB of RAM minimum (1 GB recommended)
- 1 CPU core minimum (2 recommended)
- 2 GB of free disk space
- Root or sudo access
- Ports 6443 (API server) and 443/80 (Traefik ingress) open

## Installation

k3s installs with a single command:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.35.1+k3s1" sh -
```

That's it. In ~30 seconds you have a fully functional single-node Kubernetes cluster.

Verify the installation:

```bash
# Check node status
sudo k3s kubectl get nodes

# Check system pods
sudo k3s kubectl get pods -A
```

### Configure kubectl Access

k3s writes its kubeconfig to `/etc/rancher/k3s/k3s.yaml`. To use standard `kubectl`:

```bash
# Copy kubeconfig to your user's home
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# Now kubectl works without sudo
kubectl get nodes
```

## Initial Setup

After installation, k3s is running with these defaults:

| Component | Status |
|-----------|--------|
| **API Server** | Running on port 6443 |
| **Traefik** | Ingress controller running |
| **CoreDNS** | Cluster DNS running |
| **Flannel** | CNI networking running |
| **Local Path Provisioner** | Default storage class |
| **ServiceLB (Klipper)** | Load balancer for bare metal |

### Deploy Your First Application

```yaml
# app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  type: LoadBalancer
  ports:
  - port: 80
  selector:
    app: nginx
```

```bash
kubectl apply -f app.yaml
kubectl get pods
kubectl get svc
```

## Configuration

### k3s Server Configuration

Create `/etc/rancher/k3s/config.yaml` for persistent configuration:

```yaml
# /etc/rancher/k3s/config.yaml
write-kubeconfig-mode: "0644"
tls-san:
  - "k3s.example.com"
  - "192.168.1.100"
# Disable Traefik if using a different ingress
# disable:
#   - traefik
```

Restart k3s after config changes:

```bash
sudo systemctl restart k3s
```

### Adding Worker Nodes

On the server node, get the join token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

On each worker node, run:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.35.1+k3s1" \
  K3S_URL=https://server-ip:6443 \
  K3S_TOKEN=your-token-here \
  sh -
```

### Using Helm

k3s includes Helm support via `HelmChart` CRDs, or install Helm normally:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-app bitnami/wordpress
```

### Storage

The default `local-path` provisioner creates PVs on the node's filesystem. For multi-node clusters, consider Longhorn:

```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.7.0/deploy/longhorn.yaml
```

## Advanced Configuration (Optional)

### High Availability (Multi-Server)

For HA, run 3+ server nodes with embedded etcd:

```bash
# First server
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.35.1+k3s1" \
  sh -s - server --cluster-init

# Additional servers
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.35.1+k3s1" \
  K3S_TOKEN=token-from-first-server \
  sh -s - server --server https://first-server:6443
```

### Disabling Default Components

If you prefer different networking or ingress:

```yaml
# /etc/rancher/k3s/config.yaml
disable:
  - traefik       # Use your own ingress controller
  - servicelb     # Use MetalLB instead
flannel-backend: none  # Use Cilium or Calico
```

### Private Registry

Configure k3s to use private registries:

```yaml
# /etc/rancher/k3s/registries.yaml
mirrors:
  "registry.example.com":
    endpoint:
      - "https://registry.example.com"
configs:
  "registry.example.com":
    auth:
      username: user
      password: pass
```

## Backup

Back up k3s data:

```bash
# SQLite database (single node)
sudo cp /var/lib/rancher/k3s/server/db/state.db ./k3s-backup.db

# Full etcd snapshot (HA setup)
sudo k3s etcd-snapshot save --name backup-$(date +%Y%m%d)
```

Back up your workload manifests and Helm releases independently. For a full strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Node NotReady

**Symptom:** `kubectl get nodes` shows a node as NotReady.

**Fix:** Check the k3s agent logs:

```bash
sudo journalctl -u k3s-agent -f
```

Common causes: network connectivity between server and agent lost, or the agent can't reach the API server on port 6443.

### Pods Stuck in Pending

**Symptom:** Pods stay in Pending state.

**Fix:** Check events:

```bash
kubectl describe pod <pod-name>
```

Usually caused by insufficient resources (CPU/memory limits too high for the node) or no available PersistentVolumes.

### Traefik Not Routing Traffic

**Symptom:** Ingress resources created but traffic doesn't reach services.

**Fix:** Check Traefik pods are running:

```bash
kubectl get pods -n kube-system | grep traefik
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik
```

Verify your Ingress resource has the correct `ingressClassName: traefik`.

### k3s Service Won't Start

**Symptom:** `systemctl status k3s` shows failed.

**Fix:** Check logs:

```bash
sudo journalctl -u k3s --no-pager -n 50
```

Common causes: port 6443 already in use, missing kernel modules (older kernels), or filesystem issues with `/var/lib/rancher/k3s`.

## Resource Requirements

- **RAM:** 512 MB minimum (control plane only), 1+ GB recommended with workloads
- **CPU:** 1 core minimum, 2+ for running applications
- **Disk:** 2 GB for k3s itself, plus space for container images and persistent volumes

## Verdict

k3s is the best way to run Kubernetes for self-hosting. It gives you the full Kubernetes API and ecosystem in a package that runs on a Raspberry Pi. If you've been avoiding Kubernetes because of complexity, k3s removes every excuse — it installs in 30 seconds and runs in 512 MB RAM.

**Use k3s if:** You want Kubernetes but don't want the operational overhead of kubeadm. You're deploying Helm charts to a home server. You want a lightweight orchestrator that scales from one node to a production cluster.

**Consider Docker Compose instead if:** You're running a few containers on a single server and don't need Kubernetes features like rolling updates, service discovery, or declarative scaling. See [Docker Compose Basics](/foundations/docker-compose-basics).

## FAQ

### Is k3s production-ready?

Yes. k3s is used in production by thousands of organizations, including edge computing and IoT deployments. It's CNCF-certified and maintained by SUSE.

### Can I use k3s for learning Kubernetes?

Absolutely. k3s is CNCF-certified — the same API, same kubectl commands, same concepts. Skills transfer directly to any Kubernetes distribution.

### Does k3s support Helm charts?

Yes. k3s includes a HelmChart CRD for auto-deploying charts, and standard Helm CLI works perfectly.

## Related

- [k3s vs Kubernetes](/compare/k3s-vs-k8s)
- [k3s vs MicroK8s](/compare/k3s-vs-microk8s)
- [k3s vs k0s](/compare/k3s-vs-k0s)
- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes)
- [How to Self-Host Rancher](/apps/rancher)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration)
- [Container Orchestration Basics](/foundations/container-orchestration-basics)
- [Docker Compose Basics](/foundations/docker-compose-basics)

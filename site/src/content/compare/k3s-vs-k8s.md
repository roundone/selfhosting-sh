---
title: "k3s vs Kubernetes (k8s): Which Should You Self-Host?"
description: "Comparing k3s and standard Kubernetes for self-hosting — resource usage, features, setup complexity, and which fits your needs."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - k3s
tags:
  - comparison
  - k3s
  - kubernetes
  - self-hosted
  - container-orchestration
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

k3s is the right choice for most self-hosters. It's a certified Kubernetes distribution that runs in 512 MB RAM, installs in 30 seconds, and is fully compatible with the Kubernetes API. Standard Kubernetes (kubeadm/vanilla k8s) only makes sense if you need specific features k3s strips out — like etcd clustering or custom CNI plugins for large-scale production.

## Overview

**k3s** is a lightweight Kubernetes distribution built by Rancher Labs (now SUSE). It packages the entire Kubernetes control plane into a single binary (~70 MB), replaces etcd with SQLite by default, and bundles Traefik, CoreDNS, and a local storage provisioner. It's CNCF-certified — any Kubernetes workload runs on it without modification.

**Kubernetes (k8s)** refers to the standard upstream Kubernetes distribution, typically installed via kubeadm. It runs etcd for state storage, requires manual CNI installation, and has a multi-binary control plane (kube-apiserver, kube-controller-manager, kube-scheduler, etcd). It's designed for large-scale production clusters.

## Feature Comparison

| Feature | k3s | Kubernetes (k8s) |
|---------|-----|-------------------|
| **Install time** | ~30 seconds | 15-30 minutes |
| **Binary size** | ~70 MB (single binary) | ~300 MB (multiple binaries) |
| **Control plane RAM** | ~512 MB | ~2 GB minimum |
| **Default datastore** | SQLite (single node) or etcd | etcd (required) |
| **Bundled CNI** | Flannel | None (manual install) |
| **Bundled ingress** | Traefik | None (manual install) |
| **Bundled DNS** | CoreDNS | CoreDNS |
| **Bundled load balancer** | ServiceLB (Klipper) | None |
| **Bundled storage** | Local path provisioner | None |
| **ARM support** | Full (arm64, armhf) | Limited (community images) |
| **CNCF certified** | Yes | Yes |
| **HA support** | Yes (embedded etcd or external DB) | Yes (stacked or external etcd) |
| **Auto-upgrades** | system-upgrade-controller | Manual or custom |
| **License** | Apache 2.0 | Apache 2.0 |

## Installation Complexity

**k3s** installs with a single command:

```bash
curl -sfL https://get.k3s.io | sh -
```

That's it. In 30 seconds you have a working single-node Kubernetes cluster with Traefik, CoreDNS, and local storage ready to go. Adding worker nodes is one command per node.

**Kubernetes via kubeadm** requires:

1. Install container runtime (containerd)
2. Install kubeadm, kubelet, kubectl
3. Disable swap
4. Run `kubeadm init` with configuration
5. Install a CNI plugin (Calico, Flannel, Cilium)
6. Install an ingress controller
7. Install a storage provisioner
8. Configure kubectl access

**Winner: k3s.** Not even close. k3s gets you from zero to cluster in 30 seconds. kubeadm takes 15-30 minutes even for experienced operators.

## Performance and Resource Usage

| Metric | k3s | Kubernetes (kubeadm) |
|--------|-----|---------------------|
| **Control plane RAM** | 512 MB | 2+ GB |
| **Control plane CPU** | 1 core | 2+ cores |
| **Minimum disk** | 2 GB | 10+ GB |
| **Worker node RAM** | 256 MB | 1+ GB |
| **Startup time** | ~5 seconds | ~30 seconds |
| **Runs on Raspberry Pi** | Yes (officially supported) | Technically possible, not recommended |

k3s achieves this by:
- Using SQLite instead of etcd (for single-node setups)
- Bundling everything into one binary
- Removing legacy/alpha APIs and cloud provider code
- Using containerd directly (no Docker shim)

## Community and Support

| Metric | k3s | Kubernetes |
|--------|-----|-----------|
| **GitHub stars** | 29k+ | 115k+ |
| **Maintained by** | SUSE/Rancher Labs | CNCF / Many companies |
| **Documentation** | docs.k3s.io | kubernetes.io/docs |
| **Release cadence** | Tracks upstream k8s releases | ~3 releases/year |
| **Commercial support** | SUSE Rancher | Many vendors |
| **Ecosystem** | Full k8s ecosystem compatibility | The ecosystem itself |

k3s tracks upstream Kubernetes closely — typically within weeks of each upstream release. The full Kubernetes ecosystem (Helm charts, operators, tools) works identically on k3s.

## Use Cases

### Choose k3s If...

- You're self-hosting on a single server or small cluster
- You want Kubernetes on a Raspberry Pi or edge device
- You want a working cluster in under a minute
- You want batteries-included (ingress, DNS, storage, load balancer)
- You're running on ARM hardware
- You want low resource overhead
- You're learning Kubernetes

### Choose Standard Kubernetes If...

- You need etcd for multi-master HA in large clusters (50+ nodes)
- You need custom CNI (Cilium, Calico with advanced network policies)
- You need specific API features k3s doesn't enable by default
- You're training for CKA/CKAD certification and want vanilla experience
- You're running a production cluster with dedicated infrastructure
- Your organization mandates upstream Kubernetes

## Final Verdict

**k3s is Kubernetes for the real world.** It's the same API, the same workloads, the same ecosystem — just without the operational overhead of vanilla Kubernetes. For self-hosters, homelab users, and small teams, there's no reason to run standard kubeadm Kubernetes.

The only legitimate reasons for vanilla k8s are large-scale production requirements (50+ nodes, custom networking with Cilium) or certification training. For everything else, **k3s is the answer**.

## FAQ

### Is k3s "real" Kubernetes?

Yes. k3s is CNCF-certified Kubernetes. It passes the same conformance tests as any other distribution. Helm charts, kubectl, operators, and the entire Kubernetes ecosystem work identically.

### Can I upgrade from k3s to standard Kubernetes later?

Your workloads (Deployments, Services, ConfigMaps) are portable — you can apply the same YAML to any Kubernetes cluster. The upgrade path is to deploy a new cluster and migrate workloads, not an in-place upgrade.

### Does k3s support multi-node clusters?

Yes. k3s supports multi-node clusters with dedicated server (control plane) and agent (worker) nodes. For HA, you can use embedded etcd (3+ server nodes) or an external database (MySQL, PostgreSQL).

### What did k3s remove from Kubernetes?

Legacy and alpha APIs, in-tree cloud provider code, and in-tree storage drivers. It replaces etcd with SQLite (single-node) and bundles containerd directly. No features that self-hosters need were removed.

## Related

- [How to Self-Host k3s](/apps/k3s)
- [k3s vs MicroK8s](/compare/k3s-vs-microk8s)
- [k3s vs k0s](/compare/k3s-vs-k0s)
- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes)
- [Nomad vs Kubernetes](/compare/nomad-vs-kubernetes)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration)
- [Container Orchestration Basics](/foundations/container-orchestration-basics)

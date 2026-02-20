---
title: "Nomad vs Kubernetes: Which Orchestrator to Self-Host?"
description: "Comparing HashiCorp Nomad and Kubernetes for self-hosted container orchestration — complexity, features, and which fits your needs."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - nomad
tags:
  - comparison
  - nomad
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

Kubernetes is the better choice for most container orchestration needs — it has the larger ecosystem, more community support, and better tooling. Nomad wins on simplicity: it's a single binary with no dependencies, supports non-container workloads (VMs, Java, binaries), and is dramatically easier to operate. If Kubernetes feels like overkill, Nomad is the practical alternative.

## Overview

**Nomad** is HashiCorp's workload orchestrator. It schedules containers, VMs, binaries, and Java applications across a cluster. It's a single binary with no external dependencies — no etcd, no CNI plugins, no mandatory service mesh. It integrates with HashiCorp's ecosystem (Consul for service discovery, Vault for secrets).

**Kubernetes** is the industry-standard container orchestration platform. It manages containerized workloads with declarative configuration, self-healing, auto-scaling, and a massive ecosystem of tools and extensions.

## Feature Comparison

| Feature | Nomad | Kubernetes |
|---------|-------|-----------|
| **Workload types** | Containers, VMs, Java, binaries | Containers only |
| **Dependencies** | None (single binary) | etcd, CNI, container runtime |
| **Complexity** | Low | High |
| **Service discovery** | Via Consul (optional) | Built-in (Services, DNS) |
| **Secret management** | Via Vault (optional) | Built-in (Secrets) |
| **Networking** | Basic; Consul Connect for service mesh | Sophisticated (Services, Ingress, NetworkPolicy) |
| **Storage** | Host volumes, CSI plugins | PV/PVC, StorageClasses, CSI |
| **Auto-scaling** | Auto-scaler plugin | HPA, VPA, Cluster Autoscaler |
| **Rolling updates** | Built-in | Built-in |
| **Health checks** | Built-in | Built-in (liveness, readiness, startup) |
| **Multi-region** | Native federation | Requires federation setup |
| **Ecosystem** | Small (HashiCorp tools) | Massive (Helm, operators, CNCF projects) |
| **License** | BSL 1.1 (source-available) | Apache 2.0 |
| **Learning curve** | Low-Medium | High |

## Installation Complexity

**Nomad** installs as a single binary:

```bash
# Install Nomad
curl -fsSL https://releases.hashicorp.com/nomad/1.9.7/nomad_1.9.7_linux_amd64.zip -o nomad.zip
unzip nomad.zip && mv nomad /usr/local/bin/

# Start in dev mode (single node)
nomad agent -dev

# Or production mode with a config file
nomad agent -config=/etc/nomad.d/nomad.hcl
```

For production with service discovery, you also need Consul. For secrets, add Vault. Each is a single binary — but now you're managing three services.

**Kubernetes via k3s** (the recommended self-hosted approach):

```bash
curl -sfL https://get.k3s.io | sh -
```

One command, everything bundled. Standard kubeadm is more complex (see [k3s vs k8s](/compare/k3s-vs-k8s)).

**Verdict:** Nomad alone is simpler. Nomad + Consul + Vault approaches Kubernetes complexity. k3s makes Kubernetes almost as simple as standalone Nomad.

## Performance and Resource Usage

| Metric | Nomad | Kubernetes (k3s) |
|--------|-------|-------------------|
| **Control plane RAM** | ~100 MB (Nomad only) | ~512 MB |
| **With service discovery** | ~300 MB (+ Consul) | Included |
| **CPU** | Very low | Low |
| **Disk** | ~50 MB binary | ~70 MB binary |
| **Cluster overhead** | Minimal | Moderate (CoreDNS, Traefik, etc.) |

Nomad is lighter in raw resource usage. Kubernetes (via k3s) bundles more functionality in that overhead — ingress, DNS, storage provisioning.

## Community and Support

| Metric | Nomad | Kubernetes |
|--------|-------|-----------|
| **GitHub stars** | 15k+ | 115k+ |
| **Job market demand** | Low | Very high |
| **Documentation** | Good (developer.hashicorp.com) | Extensive (kubernetes.io) |
| **Community tools** | Limited | Thousands (Helm charts, operators) |
| **Commercial support** | HashiCorp | Many vendors |
| **Certifications** | None | CKA, CKAD, CKS |

The ecosystem gap is the biggest differentiator. Most self-hosted apps ship Helm charts or Kubernetes manifests. Very few ship Nomad job specs.

## Use Cases

### Choose Nomad If...

- You find Kubernetes too complex for your needs
- You need to orchestrate non-container workloads (VMs, Java, raw binaries)
- You're already invested in HashiCorp's ecosystem (Consul, Vault, Terraform)
- You want the simplest possible orchestrator
- You have a small team and don't want Kubernetes operational overhead
- Multi-region federation is a core requirement

### Choose Kubernetes If...

- You want the largest ecosystem and community support
- You need to run Helm charts (most self-hosted apps provide these)
- You want career-relevant skills (Kubernetes experience is in demand)
- You need sophisticated networking (NetworkPolicies, service mesh)
- You want built-in service discovery and secret management
- You plan to scale beyond a few nodes

## Final Verdict

**For most self-hosters, Kubernetes (via k3s) is the better choice.** The ecosystem advantage is decisive — Helm charts, operators, and community guides assume Kubernetes. k3s solves Kubernetes' complexity problem, making it almost as easy to deploy as Nomad.

**Nomad is best for teams already using HashiCorp tools** or for niche use cases like mixed workloads (containers + VMs + binaries). It's also a valid choice if you have a strong opinion that Kubernetes is overengineered for your needs — Nomad's job spec format is genuinely simpler than Kubernetes YAML.

Note the licensing difference: Nomad uses BSL 1.1 (source-available, not open source), while Kubernetes is Apache 2.0.

## FAQ

### Can I migrate from Nomad to Kubernetes?

Not directly. Nomad job specs and Kubernetes manifests are completely different formats. You'd need to rewrite your workload definitions. The container images themselves are portable.

### Does Nomad need Consul?

No, but it's recommended for production. Without Consul, Nomad can still schedule and run jobs, but you lose service discovery, health-check-based routing, and service mesh capabilities.

### Is Nomad's BSL license a problem?

For self-hosting, no. BSL 1.1 allows all non-competitive use. You cannot offer Nomad as a managed service, but running it internally is fine. If licensing matters to you, Kubernetes (Apache 2.0) has no restrictions.

### Which should I learn for my career?

Kubernetes, overwhelmingly. It dominates the job market for container orchestration.

## Related

- [How to Self-Host Nomad](/apps/nomad)
- [How to Self-Host k3s](/apps/k3s)
- [k3s vs Kubernetes](/compare/k3s-vs-k8s)
- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration)
- [Container Orchestration Basics](/foundations/container-orchestration-basics)

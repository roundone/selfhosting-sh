---
title: "How to Use Portainer for Kubernetes Management"
description: "Deploy Portainer on Kubernetes for visual cluster management — deploy apps, manage workloads, and monitor resources via web UI."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - portainer
tags:
  - self-hosted
  - portainer
  - kubernetes
  - cluster-management
  - container-orchestration
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Portainer for Kubernetes?

[Portainer](https://www.portainer.io/) is best known as a Docker management UI, but it also supports Kubernetes. When deployed on a Kubernetes cluster, Portainer provides a web interface for managing workloads, deploying Helm charts, viewing logs, managing namespaces, and monitoring resource usage — without needing to memorize kubectl commands.

## Prerequisites

- A running Kubernetes cluster ([k3s](/apps/k3s/), [MicroK8s](/apps/microk8s/), or standard Kubernetes)
- `kubectl` configured and connected to your cluster
- Helm installed (recommended)
- 512 MB of RAM available for Portainer
- A domain name (optional, for remote access)

## Installation via Helm

The recommended way to deploy Portainer on Kubernetes:

```bash
# Add the Portainer Helm repo
helm repo add portainer https://portainer.github.io/k8s/
helm repo update

# Install Portainer CE (Community Edition)
helm install portainer portainer/portainer \
  --namespace portainer --create-namespace \
  --set service.type=NodePort \
  --set service.nodePort=30443 \
  --set tls.force=true
```

Portainer is now accessible at `https://<node-ip>:30443`.

### Alternative: kubectl Manifest

If you prefer not to use Helm:

```bash
kubectl apply -n portainer -f https://raw.githubusercontent.com/portainer/k8s/ce-2.25.1/deploy/manifests/portainer/portainer.yaml
```

### LoadBalancer Service (Cloud/MetalLB)

If your cluster has a load balancer:

```bash
helm install portainer portainer/portainer \
  --namespace portainer --create-namespace \
  --set service.type=LoadBalancer
```

## Initial Setup

1. Access Portainer at `https://<node-ip>:30443`
2. Create the initial admin account (username + password)
3. The local Kubernetes cluster is auto-detected as an environment
4. Click on the environment to start managing it

## Configuration

### Managing Workloads

From the Portainer dashboard:

| Section | What You Can Do |
|---------|----------------|
| **Applications** | View, deploy, and manage Deployments, StatefulSets, DaemonSets |
| **Services** | View and manage Services, Ingresses |
| **Config & Secrets** | Create and manage ConfigMaps and Secrets |
| **Volumes** | View PersistentVolumeClaims and storage |
| **Namespaces** | Create and manage namespaces |
| **Helm** | Browse and deploy Helm charts from the UI |

### Deploying Applications

**Via form:**
1. Go to **Applications** → **Create from form**
2. Set name, image, port, and replicas
3. Configure environment variables, volumes, resource limits
4. Click **Deploy**

**Via YAML:**
1. Go to **Applications** → **Create from manifest**
2. Paste your Kubernetes YAML
3. Click **Deploy**

**Via Helm:**
1. Go to **Helm** → **Browse charts**
2. Search for the chart (Bitnami, official repos)
3. Configure values and install

### Adding External Clusters

Portainer can manage multiple Kubernetes clusters:

1. Go to **Environments** → **Add environment**
2. Select **Kubernetes via agent**
3. Deploy the Portainer agent on the remote cluster:

```bash
kubectl apply -f https://downloads.portainer.io/ce-2.25/portainer-agent-k8s-nodeport.yaml
```

4. Enter the agent URL in Portainer

### Resource Quotas and Limits

Set namespace-level resource quotas:

1. Go to a namespace → **Resource Quotas**
2. Set CPU and memory limits
3. All deployments in the namespace are bounded by these quotas

## Advanced Configuration (Optional)

### Ingress Access

Instead of NodePort, use an Ingress for Portainer:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portainer
  namespace: portainer
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx  # or traefik
  rules:
  - host: portainer.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: portainer
            port:
              number: 9443
  tls:
  - hosts:
    - portainer.example.com
    secretName: portainer-tls
```

### LDAP/OAuth Authentication

Portainer Business Edition supports LDAP and OAuth. The Community Edition uses local user management.

### Edge Environments

Portainer can manage remote edge clusters via the Edge Agent — useful for managing distributed clusters without exposing Kubernetes APIs.

## Backup

Back up Portainer's data PVC:

```bash
# Find the PVC
kubectl get pvc -n portainer

# Back up via a temporary pod
kubectl run backup --rm -it --image=alpine \
  --overrides='{"spec":{"containers":[{"name":"backup","image":"alpine","command":["tar","czf","/backup/portainer.tar.gz","-C","/data","."],"volumeMounts":[{"name":"data","mountPath":"/data"},{"name":"backup","mountPath":"/backup"}]}],"volumes":[{"name":"data","persistentVolumeClaim":{"claimName":"portainer"}},{"name":"backup","hostPath":{"path":"/tmp"}}]}}'
```

For a full strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Portainer Can't Connect to Kubernetes API

**Symptom:** Dashboard shows "Unable to reach Kubernetes API."

**Fix:** Check the Portainer pod's service account permissions:

```bash
kubectl get clusterrolebinding -l app.kubernetes.io/name=portainer
```

Portainer needs cluster-admin or equivalent RBAC permissions.

### Helm Charts Not Loading

**Symptom:** Helm section shows no charts or times out.

**Fix:** Portainer fetches chart indexes from configured repositories. If your cluster has restricted egress, add the Helm repo URL to your network policy's allowlist.

### Slow Dashboard Loading

**Symptom:** The UI is slow when managing a cluster with many resources.

**Fix:** Portainer CE queries the Kubernetes API for all resources. On large clusters, this can be slow. Limit the namespaces displayed or increase Portainer's resource allocation:

```bash
helm upgrade portainer portainer/portainer \
  --namespace portainer \
  --set resources.requests.memory=256Mi \
  --set resources.requests.cpu=250m
```

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB under active use
- **CPU:** Low
- **Disk:** 100 MB for Portainer data (persistent volume)

## Verdict

Portainer makes Kubernetes more accessible. If you're comfortable with Docker Compose but new to Kubernetes, Portainer's UI is a gentle on-ramp — you can deploy apps, view logs, and manage resources without memorizing kubectl commands.

**Use Portainer on Kubernetes if:** You want a web UI for day-to-day cluster management, especially if you also manage Docker environments and want one tool for both.

**Consider Rancher instead if:** You manage multiple clusters and need provisioning, monitoring, and GitOps. See [Rancher vs Portainer](/compare/rancher-vs-portainer/).

**Consider Lens or k9s instead if:** You prefer a desktop app (Lens) or terminal UI (k9s) over a web interface.

## FAQ

### Is Portainer CE enough for Kubernetes?

For single-cluster management, yes. Business Edition adds RBAC, GitOps, registry management, and multi-user access — which matter more for teams.

### Does Portainer replace kubectl?

For common tasks (deploy, scale, view logs), yes. For advanced operations (custom CRDs, debugging, scripting), you'll still need kubectl.

### Can Portainer manage both Docker and Kubernetes?

Yes. A single Portainer instance can manage Docker hosts, Docker Swarm clusters, and Kubernetes clusters — all from one UI. Each is an "environment" in Portainer.

## Related

- [Rancher vs Portainer](/compare/rancher-vs-portainer/)
- [How to Self-Host Portainer](/apps/portainer/)
- [How to Self-Host Rancher](/apps/rancher/)
- [How to Self-Host k3s](/apps/k3s/)
- [Portainer vs Dockge](/compare/portainer-vs-dockge/)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration/)
- [Best Self-Hosted Docker Management](/best/docker-management/)
- [Container Orchestration Basics](/foundations/container-orchestration-basics/)

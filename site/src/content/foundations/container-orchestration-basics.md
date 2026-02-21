---
title: "Container Orchestration Basics for Self-Hosting"
description: "Learn container orchestration for self-hosting — when you need it, when you don't, and how to set up k3s or Docker Swarm."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: []
tags: ["foundations", "kubernetes", "k3s", "docker-swarm", "orchestration", "containers"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Container Orchestration?

Container orchestration is the automation of deploying, scaling, networking, and managing containers across one or more machines. If you run a single server with Docker Compose, you are already doing basic container orchestration for self-hosting -- defining services, networks, and volumes in a YAML file and letting Docker manage the lifecycle. Full orchestration platforms like Kubernetes and Docker Swarm extend this to multi-node clusters with automatic failover, load balancing, rolling updates, and service discovery.

The honest recommendation: **most self-hosters do not need a full orchestration platform.** A single machine running [Docker Compose](/foundations/docker-compose-basics/) handles dozens of self-hosted apps without breaking a sweat. Orchestration becomes valuable when you have multiple physical machines and want services to survive a node failure, or when you are running workloads that genuinely need horizontal scaling.

This guide covers what orchestration is, when it matters, the main options available, and how to set up k3s and Docker Swarm for a home lab.

## Prerequisites

- Familiarity with Docker and Docker Compose ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Understanding of Docker networking concepts ([Docker Networking](/foundations/docker-networking/))
- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- SSH access to your server(s) -- see [SSH Setup](/foundations/ssh-setup/)
- For multi-node setups: two or three Linux machines on the same network
- Basic command-line skills ([Linux Basics](/foundations/linux-basics-self-hosting/))

## Docker Compose vs Kubernetes vs Docker Swarm

These three tools solve overlapping but different problems. Here is how they compare for self-hosting:

### Docker Compose

Docker Compose is a single-host tool. It reads a YAML file, creates containers, networks, and volumes on one machine, and keeps them running. It does not do multi-node clustering, automatic failover, or load balancing across machines.

**Strengths for self-hosting:**
- Zero learning curve beyond the Compose file syntax
- Every self-hosted app ships with a `docker-compose.yml`
- No cluster overhead -- all resources go to your apps
- Simple backup and migration (copy your Compose files and volumes)

**Limitations:**
- Single point of failure -- if the machine dies, everything is down
- No built-in rolling updates across multiple instances
- Scaling means manually running more containers on the same host

### Kubernetes (K8s)

Kubernetes is the industry standard for container orchestration. It manages containers across a cluster of nodes with sophisticated scheduling, self-healing, service discovery, and configuration management. It was designed for large-scale production workloads at Google.

**Strengths:**
- Automatic rescheduling of containers when a node fails
- Built-in load balancing and service discovery
- Rolling updates with zero downtime
- Massive ecosystem of tools, operators, and Helm charts

**Limitations for self-hosting:**
- Enormous complexity -- the learning curve is steep
- Full Kubernetes (kubeadm) consumes 1-2 GB of RAM just for the control plane
- Most self-hosted apps do not ship Kubernetes manifests or Helm charts
- Overkill for a home lab running Jellyfin and Pi-hole
- Debugging is harder than Docker Compose

### Docker Swarm

Docker Swarm is Docker's built-in clustering mode. It turns a group of Docker hosts into a single virtual host. You deploy services using a syntax nearly identical to Docker Compose, and Swarm handles scheduling, load balancing, and failover.

**Strengths for self-hosting:**
- Familiar syntax -- Compose files work with minimal changes
- Lightweight -- negligible overhead compared to Kubernetes
- Built into Docker Engine -- no additional installation
- Easy to set up (a few commands to join nodes)

**Limitations:**
- Docker Inc. has deprioritized Swarm development in favor of Kubernetes
- Smaller ecosystem -- fewer tools and community resources
- Less sophisticated scheduling and networking than Kubernetes
- No equivalent to Helm charts or Kubernetes operators

### The Verdict

| Factor | Docker Compose | Docker Swarm | Kubernetes (k3s) |
|--------|---------------|--------------|-------------------|
| Setup complexity | Trivial | Easy | Moderate |
| RAM overhead | ~0 MB | ~50 MB | ~500 MB |
| Multi-node support | No | Yes | Yes |
| Auto-failover | No | Yes | Yes |
| Learning curve | Minimal | Low | High |
| App compatibility | Excellent | Good | Varies |
| Best for | Single-server setups | Simple HA clusters | Complex multi-node labs |

**Use Docker Compose** if you have one server. This covers 90% of self-hosters.

**Use Docker Swarm** if you have 2-3 machines and want simple high availability with minimal learning.

**Use k3s** if you genuinely want Kubernetes capabilities -- multi-node scheduling, Helm charts, Kubernetes operators -- and are willing to invest the time to learn it.

## When You Need Orchestration (and When You Don't)

### You probably do not need orchestration if:

- You run a single server (even a powerful one)
- Your apps tolerate a few minutes of downtime during reboots or updates
- You have fewer than 30 self-hosted services
- You do not have multiple physical machines to distribute workloads across
- You are not running apps that need horizontal scaling (multiple replicas)

Docker Compose on a single machine with `restart: unless-stopped` on every service handles all of this. A machine reboot brings everything back up automatically. For most home labs, this is sufficient.

### You should consider orchestration if:

- You have 2+ servers and want services to survive a hardware failure
- You are running services that genuinely need high availability (a family photo server that cannot go down)
- You want to practice Kubernetes for career development (a legitimate reason)
- You are running workloads that benefit from horizontal scaling
- You want automated rolling updates across a fleet of machines

The key question: **does the operational overhead of orchestration justify the benefit?** For a Pi-hole and a Jellyfin server, the answer is no. For a home lab with three nodes running 50+ services where uptime matters, the answer might be yes.

## Lightweight Kubernetes for Home Labs

Full Kubernetes (kubeadm) is heavy -- multiple control plane components, etcd as a separate cluster, and significant RAM consumption. Three lightweight distributions strip Kubernetes down to something reasonable for home labs.

### k3s (Recommended)

[k3s](https://k3s.io/) is a CNCF-certified Kubernetes distribution from Rancher (now SUSE) that replaces etcd with SQLite (single-node) or an embedded etcd, bundles all control plane components into a single binary, and strips out cloud-provider-specific features you do not need at home.

- **RAM:** ~500 MB for the server process
- **Binary size:** ~70 MB
- **Includes:** Traefik as default ingress, CoreDNS, local-path storage provisioner, Flannel CNI
- **Install:** One command
- **Best for:** Home labs that want real Kubernetes with minimal overhead

### k0s

[k0s](https://k0sproject.io/) is a zero-dependency Kubernetes distribution from Mirantis. It packages the entire control plane as a single binary with no host-level dependencies beyond the kernel.

- **RAM:** ~500-700 MB
- **Includes:** kube-router for CNI, CoreDNS
- **Notable:** Clean separation between control plane and worker roles
- **Best for:** Users who want a vanilla Kubernetes experience without distribution-specific opinions

### MicroK8s

[MicroK8s](https://microk8s.io/) is Canonical's Kubernetes distribution, installed and managed through snap.

- **RAM:** ~500-700 MB
- **Includes:** Large addon ecosystem (Istio, Knative, GPU support) enabled with `microk8s enable <addon>`
- **Notable:** Requires snap, which some users dislike; addon system makes it easy to add features
- **Best for:** Ubuntu users who want a batteries-included experience with optional addons

### Which to Choose

**Pick k3s.** It has the largest community among lightweight distributions, the best documentation, the lowest resource overhead, and ships with sensible defaults (Traefik for ingress, Flannel for networking). The one-command install means you can have a functioning Kubernetes cluster in under a minute.

## Setting Up k3s with a Single Command

### Single-Node Cluster

On a fresh Linux server (Ubuntu 22.04+, Debian 12+, or RHEL 9+):

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.31.6+k3s1" sh -
```

This installs k3s `v1.31.6+k3s1`, starts the server, and registers it as a systemd service. The process takes about 30 seconds.

Verify the cluster is running:

```bash
sudo k3s kubectl get nodes
```

Expected output:

```
NAME         STATUS   ROLES                  AGE   VERSION
your-host    Ready    control-plane,master   30s   v1.31.6+k3s1
```

The `kubeconfig` file is at `/etc/rancher/k3s/k3s.yaml`. To use `kubectl` without `sudo`:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
```

Add the `export` line to your `~/.bashrc` to make it persistent.

### Adding Worker Nodes

On the server (control plane) node, get the join token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

On each worker node, run:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.31.6+k3s1" \
  K3S_URL="https://SERVER_IP:6443" \
  K3S_TOKEN="YOUR_NODE_TOKEN" sh -
```

Replace `SERVER_IP` with the control plane node's IP address and `YOUR_NODE_TOKEN` with the token from the previous step.

Verify from the server node:

```bash
kubectl get nodes
```

```
NAME         STATUS   ROLES                  AGE    VERSION
server       Ready    control-plane,master   10m    v1.31.6+k3s1
worker-01    Ready    <none>                 30s    v1.31.6+k3s1
worker-02    Ready    <none>                 15s    v1.31.6+k3s1
```

### Uninstalling k3s

If you decide orchestration is not for you:

```bash
# On the server node
/usr/local/bin/k3s-uninstall.sh

# On worker nodes
/usr/local/bin/k3s-agent-uninstall.sh
```

This removes k3s completely, including all cluster data.

## Deploying Your First Service on k3s

Deploy Uptime Kuma as a test workload. Create a file called `uptime-kuma.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uptime-kuma
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: uptime-kuma
  template:
    metadata:
      labels:
        app: uptime-kuma
    spec:
      containers:
        - name: uptime-kuma
          image: louislam/uptime-kuma:1.23.16
          ports:
            - containerPort: 3001
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: uptime-kuma-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uptime-kuma-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: uptime-kuma
  namespace: default
spec:
  selector:
    app: uptime-kuma
  ports:
    - port: 3001
      targetPort: 3001
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: uptime-kuma
  namespace: default
spec:
  rules:
    - host: uptime.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: uptime-kuma
                port:
                  number: 3001
```

Apply it:

```bash
kubectl apply -f uptime-kuma.yaml
```

Check the deployment status:

```bash
kubectl get pods -w
```

Wait until the pod shows `Running` status. The app is now accessible through k3s's built-in Traefik ingress at `uptime.example.com` (assuming DNS points to your server).

Compare this to the Docker Compose equivalent -- a six-line YAML file versus a 60+ line manifest with four separate resource definitions. This is the trade-off: Kubernetes gives you more control and features at the cost of significantly more configuration.

### Useful kubectl Commands

```bash
# List all pods
kubectl get pods

# View logs for a pod
kubectl logs uptime-kuma-xxxxx

# Describe a pod (detailed status and events)
kubectl describe pod uptime-kuma-xxxxx

# Execute a command inside a pod
kubectl exec -it uptime-kuma-xxxxx -- sh

# Delete a deployment and all its resources
kubectl delete -f uptime-kuma.yaml

# View all services
kubectl get svc

# View ingress routes
kubectl get ingress
```

## Docker Swarm Quick Start

Docker Swarm is the lower-friction option for multi-node self-hosting. If you already know Docker Compose, Swarm feels familiar.

### Initialize the Swarm

On your first node (which becomes the manager):

```bash
docker swarm init --advertise-addr YOUR_SERVER_IP
```

This outputs a join command with a token. Run that command on each worker node:

```bash
docker swarm join --token SWMTKN-1-xxxxx YOUR_SERVER_IP:2377
```

Verify the cluster from the manager node:

```bash
docker node ls
```

```
ID             HOSTNAME    STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
abc123 *       manager     Ready     Active         Leader           27.5.1
def456         worker-01   Ready     Active                          27.5.1
ghi789         worker-02   Ready     Active                          27.5.1
```

### Deploying a Service

Swarm uses "stack" files that are nearly identical to Docker Compose files. Create `uptime-kuma-stack.yml`:

```yaml
version: "3.8"

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1.23.16
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    deploy:
      replicas: 1
      restart_policy:
        condition: any
      placement:
        constraints:
          - node.role == manager
    networks:
      - app-network

volumes:
  uptime-kuma-data:
    driver: local

networks:
  app-network:
    driver: overlay
```

Deploy the stack:

```bash
docker stack deploy -c uptime-kuma-stack.yml monitoring
```

Check the service:

```bash
docker service ls
docker service ps monitoring_uptime-kuma
```

The key differences from a regular Compose file:

- **`deploy` section** controls replica count, restart policy, and node placement constraints
- **`overlay` network driver** enables cross-node communication (bridge networks only work on a single host)
- **`docker stack deploy`** replaces `docker compose up`
- **Placement constraints** let you pin services to specific nodes (useful for services that need local volumes)

### Scaling a Service

```bash
docker service scale monitoring_uptime-kuma=3
```

Swarm distributes the replicas across available nodes and load-balances incoming traffic automatically through its built-in routing mesh.

### Removing a Stack

```bash
docker stack rm monitoring
```

### Leaving the Swarm

On worker nodes:

```bash
docker swarm leave
```

On the manager node:

```bash
docker swarm leave --force
```

## Common Mistakes

### Jumping to Kubernetes Too Early

The most common mistake. Running k3s on a single Raspberry Pi to host Pi-hole adds complexity with zero benefit. Docker Compose does the same job with a fraction of the configuration. Start with Compose. Move to orchestration only when you have a concrete problem that Compose cannot solve -- typically multi-node failover or workload distribution.

### Ignoring Storage in Kubernetes

Kubernetes pods are ephemeral. If you deploy an app without a PersistentVolumeClaim, your data disappears when the pod restarts. k3s includes the `local-path` storage provisioner by default, which stores data on the node where the pod runs. For multi-node setups where pods might move between nodes, you need a distributed storage solution like Longhorn or NFS.

### Using Docker Swarm's Default Overlay Encryption

Swarm's overlay networks do not encrypt traffic between nodes by default. If your nodes communicate over an untrusted network, enable encryption:

```yaml
networks:
  secure-net:
    driver: overlay
    driver_opts:
      encrypted: "true"
```

This adds IPsec encryption between nodes at the cost of some performance overhead.

### Mixing Docker Compose and Swarm Commands

`docker compose up` and `docker stack deploy` are separate systems. Do not try to manage a Swarm service with `docker compose` commands or vice versa. If you deployed with `docker stack deploy`, manage with `docker service` commands.

### Not Planning for Persistent Storage on Multi-Node Clusters

When a service moves to a different node (due to failover or rebalancing), local volumes do not follow it. The service starts fresh on the new node with empty storage. Plan for this by either constraining stateful services to specific nodes or using shared storage (NFS, Longhorn, Ceph).

## FAQ

### Can I run Docker Compose and Kubernetes on the same machine?

Yes, but carefully. k3s uses containerd as its runtime, not Docker. Your Docker Compose containers and k3s pods run on separate runtimes and cannot directly communicate without explicit networking configuration. Running both is fine for experimentation but adds confusion for production setups. Pick one.

### How many nodes do I need for high availability?

For Kubernetes (k3s), the minimum for HA is three server nodes -- etcd requires an odd number for quorum. For Docker Swarm, three manager nodes is the recommended minimum (one manager works but is a single point of failure). Worker nodes can be any number.

### Is Docker Swarm dead?

Not dead, but on maintenance mode. Docker Inc. focuses on Docker Desktop and Docker Compose. Swarm still works, receives security patches, and is stable. It is not getting new features. For simple multi-node setups it remains a perfectly viable option. For long-term investment, k3s is the safer bet.

### Can I migrate from Docker Compose to Kubernetes later?

Yes. Tools like Kompose (`kompose convert`) can translate Docker Compose files into Kubernetes manifests. The conversion is not always perfect -- you will need to manually add PersistentVolumeClaims, adjust networking, and configure ingress -- but it gives you a starting point. The bigger migration effort is learning Kubernetes concepts and tooling.

### Should I use Helm charts or plain manifests?

For self-hosting, start with plain manifests. Helm charts add a templating layer that is powerful but adds complexity. Once you are comfortable with Kubernetes basics and find yourself repeating the same manifest patterns, Helm charts become useful for managing complex apps with many configuration options.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Linux Systemd Basics](/foundations/linux-systemd/)
- [Monitoring Basics](/foundations/monitoring-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)

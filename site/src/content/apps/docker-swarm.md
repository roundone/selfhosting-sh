---
title: "How to Set Up Docker Swarm for Self-Hosting"
description: "Deploy Docker Swarm for container orchestration — built into Docker, simple clustering, and service management without Kubernetes."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "container-orchestration"
apps:
  - docker-swarm
tags:
  - self-hosted
  - docker-swarm
  - docker
  - container-orchestration
  - clustering
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docker Swarm?

Docker Swarm is Docker's built-in container orchestration mode. It turns a group of Docker hosts into a single virtual host, with service discovery, load balancing, rolling updates, and secret management. Unlike Kubernetes, there's nothing extra to install — if you have Docker, you have Swarm. It's the simplest path from "docker compose up" to multi-node orchestration.

## Prerequisites

- Two or more Linux servers (Ubuntu 22.04+ recommended) for a cluster, or one for testing
- Docker installed on each node ([Docker install guide](/foundations/docker-compose-basics/))
- 512 MB of RAM minimum per node
- Ports open between nodes: 2377/TCP (management), 7946/TCP+UDP (node communication), 4789/UDP (overlay network)
- All nodes must be able to reach each other on these ports

## Setup

### Initialize Swarm Mode

On your first (manager) node:

```bash
docker swarm init --advertise-addr <MANAGER-IP>
```

This outputs a `docker swarm join` command with a token. Save this command.

```
Swarm initialized: current node (abc123) is now a manager.
To add a worker to this swarm, run the following command:
    docker swarm join --token SWMTKN-1-xxx <MANAGER-IP>:2377
```

### Add Worker Nodes

On each worker node, run the join command from the init output:

```bash
docker swarm join --token SWMTKN-1-xxx <MANAGER-IP>:2377
```

### Verify the Cluster

On the manager node:

```bash
docker node ls
```

You should see all nodes listed with their status and role (Manager/Worker).

## Initial Setup

### Deploy Your First Service

```bash
# Deploy nginx with 3 replicas
docker service create \
  --name web \
  --replicas 3 \
  --publish published=80,target=80 \
  nginx:1.27

# Check service status
docker service ls
docker service ps web
```

Swarm automatically distributes replicas across nodes and load balances incoming traffic.

### Deploy a Stack (Compose in Swarm)

Create a `docker-compose.yml` (Swarm uses the same format with a `deploy` section):

```yaml
# stack.yml
version: "3.8"
services:
  web:
    image: nginx:1.27
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "80:80"

  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      placement:
        constraints:
          - node.role == manager
```

Deploy the stack:

```bash
docker stack deploy -c stack.yml myapp
docker stack services myapp
```

## Configuration

### Manager High Availability

For HA, promote additional nodes to manager:

```bash
# Get manager join token
docker swarm join-token manager

# On additional manager nodes
docker swarm join --token SWMTKN-1-manager-token <MANAGER-IP>:2377
```

Run 3 or 5 manager nodes for fault tolerance (Raft consensus requires a majority).

### Overlay Networks

Create encrypted overlay networks for inter-service communication:

```bash
docker network create \
  --driver overlay \
  --opt encrypted \
  --attachable \
  my-network
```

Services on the same overlay network can reach each other by service name.

### Secrets Management

Store sensitive data securely:

```bash
# Create a secret
echo "my-password" | docker secret create db_password -

# Use in a service
docker service create \
  --name db \
  --secret db_password \
  postgres:16
```

Inside the container, the secret is available at `/run/secrets/db_password`.

### Configs

Store non-sensitive configuration files:

```bash
# Create a config from a file
docker config create nginx-conf nginx.conf

# Mount in a service
docker service create \
  --name web \
  --config source=nginx-conf,target=/etc/nginx/nginx.conf \
  nginx:1.27
```

### Rolling Updates

```bash
# Update service image with zero-downtime rolling update
docker service update \
  --image nginx:1.28 \
  --update-parallelism 1 \
  --update-delay 10s \
  web
```

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.25'
      memory: 128M
```

## Advanced Configuration (Optional)

### Drain a Node for Maintenance

```bash
# Prevent scheduling on a node
docker node update --availability drain node-2

# Bring it back
docker node update --availability active node-2
```

### Placement Constraints

Control where services run:

```yaml
deploy:
  placement:
    constraints:
      - node.role == worker
      - node.labels.disk == ssd
```

Add labels to nodes:

```bash
docker node update --label-add disk=ssd node-2
```

### Global Services

Run one instance per node (useful for monitoring agents):

```yaml
deploy:
  mode: global
```

## Backup

Back up the Swarm state:

```bash
# On a manager node — back up the Swarm Raft data
sudo cp -r /var/lib/docker/swarm/raft ./swarm-backup

# Also back up secrets and configs
docker secret ls
docker config ls
```

For application data, back up the volumes used by your services. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Service Replicas Stuck at 0/N

**Symptom:** `docker service ls` shows 0 running replicas.

**Fix:** Check service logs:

```bash
docker service logs web
docker service ps web --no-trunc
```

Common causes: image pull failures, port conflicts, or placement constraints that no node satisfies.

### Nodes Not Joining the Cluster

**Symptom:** Worker node join command hangs or fails.

**Fix:** Verify port connectivity between nodes:

```bash
# From worker, test manager port
nc -zv <MANAGER-IP> 2377
```

Ensure ports 2377, 7946, and 4789 are open in firewalls on all nodes.

### Overlay Network Connectivity Issues

**Symptom:** Services on the same overlay network can't reach each other.

**Fix:** Check that UDP port 4789 is open between all nodes. Some cloud providers block VXLAN traffic by default. Also verify the overlay network is attached to both services.

### Manager Node Lost Quorum

**Symptom:** `docker node ls` fails with "Error response from daemon: rpc error: code = Unknown desc = The swarm does not have a leader."

**Fix:** If the majority of managers are down, you need to force a new cluster:

```bash
docker swarm init --force-new-cluster --advertise-addr <IP>
```

This recovers from the current node's Raft state. Re-join other nodes afterward.

## Resource Requirements

- **RAM:** 512 MB per node minimum, plus your workload requirements
- **CPU:** 1 core per node minimum
- **Disk:** Minimal overhead — Docker Swarm adds negligible storage beyond standard Docker
- **Network:** Reliable connectivity between all nodes. Low latency between managers is important.

## Verdict

Docker Swarm is the simplest container orchestrator. If you already use Docker Compose and want to scale to multiple nodes without learning Kubernetes, Swarm is the natural next step — same Docker CLI, same Compose files (with a `deploy` section), zero new tools to install.

**Use Docker Swarm if:** You want simple multi-node container orchestration, you already know Docker well, and you don't need the full Kubernetes ecosystem (Helm charts, operators, CRDs).

**Consider k3s instead if:** You want access to the Kubernetes ecosystem (Helm, operators, community manifests) or you're planning to scale beyond a handful of nodes. See [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes/).

## FAQ

### Is Docker Swarm dead?

No. Docker continues to maintain Swarm mode. It receives updates with each Docker release. However, it's not getting major new features — Docker's orchestration focus has shifted to Kubernetes support.

### Can I use Docker Compose files with Swarm?

Yes. `docker stack deploy -c docker-compose.yml` deploys Compose files to Swarm. The `deploy` section in the Compose file controls Swarm-specific settings (replicas, update policy, placement).

### How many manager nodes do I need?

One manager works for testing. For production, use 3 (tolerates 1 failure) or 5 (tolerates 2 failures). Never use an even number — Raft consensus needs an odd count.

## Related

- [Docker Swarm vs Kubernetes](/compare/docker-swarm-vs-kubernetes/)
- [How to Self-Host k3s](/apps/k3s/)
- [Docker Compose vs Swarm](/compare/docker-compose-vs-swarm/)
- [How to Self-Host Portainer](/apps/portainer/)
- [Best Self-Hosted Container Orchestration](/best/container-orchestration/)
- [Container Orchestration Basics](/foundations/container-orchestration-basics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)

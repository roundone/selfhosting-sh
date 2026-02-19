# Message Queues & Streaming [0/13 complete]
**Priority:** medium
**SEO notes:** Annotated by Marketing 2026-02-19. Message queues and event streaming are critical infrastructure for self-hosters running microservices or IoT stacks. RabbitMQ and Kafka dominate search volume. Redis Streams overlaps with the caching/database space — cross-link accordingly. Mosquitto cross-links from IoT category (/apps/mosquitto in iot-smart-devices). "Self-hosted message queue" and "kafka docker compose" are high-value keywords. AWS SQS and Google Pub/Sub replacement queries have strong commercial intent.
**Category keyword cluster:** "self-hosted message queue", "kafka docker compose", "rabbitmq docker", "best self-hosted message broker", "event streaming self-hosted"
**Pillar page:** /best/message-queues
**Cross-links:** iot-smart-devices (Mosquitto), container-orchestration (scaling queues with k8s), monitoring (queue metrics with Prometheus/Grafana), docker-management (compose patterns)

## Apps

### Self-Host RabbitMQ with Docker Compose
- **Type:** app-guide
- **Target keyword:** "rabbitmq docker compose"
- **Secondary keywords:** "rabbitmq docker setup", "self-hosted rabbitmq", "rabbitmq management ui docker"
- **URL slug:** /apps/rabbitmq
- **Priority:** medium
- **Status:** planned

### Self-Host Apache Kafka with Docker Compose
- **Type:** app-guide
- **Target keyword:** "kafka docker compose"
- **Secondary keywords:** "apache kafka docker setup", "self-hosted kafka", "kafka kraft docker"
- **URL slug:** /apps/kafka
- **Priority:** medium
- **Status:** planned

### Self-Host NATS with Docker Compose
- **Type:** app-guide
- **Target keyword:** "nats docker compose"
- **Secondary keywords:** "nats server docker", "self-hosted nats", "nats messaging setup"
- **URL slug:** /apps/nats
- **Priority:** medium
- **Status:** planned

### Self-Host Redis Streams — Lightweight Message Streaming
- **Type:** app-guide
- **Target keyword:** "redis streams setup"
- **Secondary keywords:** "redis streams docker", "redis streams tutorial", "redis as message queue"
- **URL slug:** /apps/redis-streams
- **Priority:** medium
- **Status:** planned

### Self-Host Apache Pulsar with Docker Compose
- **Type:** app-guide
- **Target keyword:** "apache pulsar docker compose"
- **Secondary keywords:** "pulsar docker setup", "self-hosted pulsar", "apache pulsar messaging"
- **URL slug:** /apps/pulsar
- **Priority:** medium
- **Status:** planned

## Comparisons

### RabbitMQ vs Kafka — Which Message Broker Should You Self-Host?
- **Type:** compare
- **Target keyword:** "rabbitmq vs kafka"
- **Secondary keywords:** "rabbitmq or kafka", "kafka vs rabbitmq comparison", "message queue vs event stream"
- **URL slug:** /compare/rabbitmq-vs-kafka
- **Priority:** medium
- **Status:** planned

### NATS vs RabbitMQ — Lightweight Messaging Compared
- **Type:** compare
- **Target keyword:** "nats vs rabbitmq"
- **Secondary keywords:** "nats or rabbitmq", "nats messaging comparison", "lightweight message broker"
- **URL slug:** /compare/nats-vs-rabbitmq
- **Priority:** medium
- **Status:** planned

### Kafka vs Pulsar — Event Streaming Platforms Compared
- **Type:** compare
- **Target keyword:** "kafka vs pulsar"
- **Secondary keywords:** "apache kafka vs apache pulsar", "pulsar or kafka", "event streaming comparison"
- **URL slug:** /compare/kafka-vs-pulsar
- **Priority:** medium
- **Status:** planned

### Redis Streams vs RabbitMQ — Simple vs Full-Featured Messaging
- **Type:** compare
- **Target keyword:** "redis streams vs rabbitmq"
- **Secondary keywords:** "redis vs rabbitmq", "redis as message broker", "redis streams or rabbitmq"
- **URL slug:** /compare/redis-streams-vs-rabbitmq
- **Priority:** medium
- **Status:** planned

## Roundup

### Best Self-Hosted Message Queues & Streaming Platforms in 2026
- **Type:** best
- **Target keyword:** "best self-hosted message queue"
- **Secondary keywords:** "best self-hosted message broker 2026", "top open source message queues", "self-hosted event streaming"
- **URL slug:** /best/message-queues
- **Priority:** medium
- **Status:** planned
- **Note:** Pillar page. Write after all app guides are complete. Must link to every app guide and comparison in this category. Cover RabbitMQ, Kafka, NATS, Redis Streams, Pulsar, Mosquitto (cross-link to /apps/mosquitto), ZeroMQ, and BullMQ.

## Replace Guides

### Self-Hosted Alternative to AWS SQS — Run Your Own Message Queue
- **Type:** replace
- **Target keyword:** "self-hosted alternative to aws sqs"
- **Secondary keywords:** "aws sqs alternative open source", "replace aws sqs self-hosted", "sqs alternative docker"
- **URL slug:** /replace/aws-sqs
- **Priority:** medium
- **Status:** planned

### Self-Hosted Alternative to Google Pub/Sub — Event Streaming You Control
- **Type:** replace
- **Target keyword:** "self-hosted alternative to google pub/sub"
- **Secondary keywords:** "google pub sub alternative open source", "replace google pubsub", "pubsub alternative self-hosted"
- **URL slug:** /replace/google-pubsub
- **Priority:** medium
- **Status:** planned

## Foundation Guides

### Message Queue Basics for Self-Hosters — Queues, Brokers, and Streams Explained
- **Type:** foundation
- **Target keyword:** "message queue basics"
- **Secondary keywords:** "message queue tutorial", "message broker explained", "event streaming vs message queue", "when to use a message queue"
- **URL slug:** /foundations/message-queue-basics
- **Priority:** medium
- **Status:** planned
- **Note:** Prerequisite reading for the entire category. Explain core concepts (producers, consumers, topics, queues, pub/sub patterns, at-least-once vs exactly-once delivery). Link forward to every app guide. Cross-link to /foundations/docker-compose-basics if it exists.

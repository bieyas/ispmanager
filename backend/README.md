# Backend

Baseline backend ISP Manager.

## Target Arsitektur

- Runtime: Node.js + NestJS
- Pola: Modular monolith (microservice-ready)
- Data: PostgreSQL
- Queue/Cache: Redis

## Struktur Awal

- `src/modules/` : bounded context per domain

## Domain Prioritas Sprint Awal

- auth_access
- customer
- service_package
- billing_payment

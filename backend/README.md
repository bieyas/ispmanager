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

## Day 3 Setup (Prisma + PostgreSQL)

1. Start PostgreSQL dev container:
   - `docker compose -f ../infra/docker/postgres.dev.yml up -d`
2. Copy env:
   - `cp .env.example .env`
3. Run migration:
   - `npm run prisma:migrate:dev -- --name init_auth_customer`
4. Start API:
   - `npm run dev`

## API ID Convention

- `id` adalah UUID (internal/public API identifier, canonical untuk lookup endpoint).
- Untuk kebutuhan display/operator, gunakan business ID terpisah per domain:
  - Customer: `customerCode` (alias response: `customerIdBusiness`)
  - Package: `packageCode` (alias response: `packageIdBusiness`)
  - PPP Profile: `profileCode` (alias response: `profileIdBusiness`)

Catatan:
- Alias ditambahkan untuk transisi naming yang lebih eksplisit.
- Field lama (`customerCode`, `packageCode`, `profileCode`) tetap dipertahankan untuk backward compatibility.

## Contoh Field Response

- `GET /api/customers/:id`
  - `id`, `customerCode`, `customerIdBusiness`, ...
- `GET /api/packages/:id`
  - `id`, `packageCode`, `packageIdBusiness`, ...
- `GET /api/ppp-profiles/:id`
  - `id`, `profileCode`, `profileIdBusiness`, ...

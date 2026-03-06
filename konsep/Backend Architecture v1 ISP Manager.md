# Backend Architecture v1 ISP Manager

Dokumen ini merancang arsitektur backend tahap awal yang:
- Stabil saat trafik tinggi
- Meminimalkan ketergantungan langsung antar modul
- Mudah dipecah menjadi microservice
- Mudah scaling horizontal

Tanggal: **6 Maret 2026**

---

# 1) Prinsip Arsitektur

## 1. Modular Monolith, Microservice-Ready

Tahap awal menggunakan **modular monolith** agar delivery cepat dan operasional stabil.
Batas modul dibuat ketat sejak awal agar bisa dipisah menjadi microservice tanpa refactor besar.

## 2. Database-Per-Boundary (Logical Ownership)

Masih satu cluster PostgreSQL, tetapi tiap modul hanya boleh write ke tabel miliknya.
Akses lintas domain melalui:
- API internal (sync)
- Event (async)
- Read model/materialized view (jika diperlukan)

## 3. Event-Driven Internal

Semua perubahan bisnis penting mem-publish domain event via Outbox Pattern.
Ini mengurangi coupling dan mencegah lost-event saat failure.

## 4. Stateless Compute

API server stateless, tidak menyimpan session/state lokal.
State disimpan di PostgreSQL/Redis sehingga horizontal scaling aman.

---

# 2) Bounded Context (Module Boundary)

## Modul Inti v1

- `auth_access`
- `customer`
- `service_package`
- `billing_payment`
- `radius_provisioning`
- `network_monitoring`
- `ticketing_operation`
- `wa_gateway`
- `ai_cs_assistant`

## Aturan Boundary

- Dilarang query langsung tabel modul lain dari repository/data layer.
- Komunikasi antar modul lewat application service atau event handler.
- Setiap modul punya contract (input/output DTO) yang versi-able.

---

# 3) Struktur Layer per Modul

Gunakan pola konsisten per modul:

- `domain/`
  - entity, value object, domain service, domain event
- `application/`
  - use case, command/query handler, transaction boundary
- `infrastructure/`
  - repository impl, external adapter (WA provider, RouterOS, payment)
- `interface/`
  - REST controller, webhook endpoint, mapper

Prinsip:
- Controller tipis, business logic di application/domain.
- Tidak ada logic bisnis di SQL raw/controller.

---

# 4) Komunikasi Antar Modul

## Sync (Request-Response)

Dipakai hanya untuk kebutuhan real-time kecil.
Contoh:
- `ticketing_operation` cek profil customer ringkas.
- `wa_gateway` validasi customer by phone.

Gunakan anti-corruption layer:
- Interface internal stabil
- DTO terpisah dari entity DB

## Async (Event-Driven)

Dipakai untuk proses lintas modul dan side-effect.
Contoh event utama:
- `customer.created`
- `service.assigned`
- `invoice.generated`
- `invoice.paid`
- `customer.suspended`
- `ticket.created`
- `wa.message.received`
- `ai.reply.suggested`

Transport awal:
- PostgreSQL Outbox + Redis queue worker
- Bisa migrasi ke Kafka/RabbitMQ tanpa ubah domain logic

---

# 5) Reliability Pattern (Wajib)

## 1. Outbox Pattern

Setiap perubahan data + event outbox ditulis dalam satu transaksi DB.
Publisher worker membaca outbox dan publish ke queue/event bus.

## 2. Idempotency

Wajib untuk:
- webhook WA
- callback payment
- generate invoice bulanan

Gunakan `idempotency_key` + unique index + dedupe window.

## 3. Retry + DLQ

Job async wajib punya:
- retry exponential backoff
- max attempt
- dead-letter queue untuk investigasi manual

## 4. Circuit Breaker + Timeout

Untuk dependency eksternal (WA provider, payment gateway, Router API).

---

# 6) Data & Query Strategy

## Database

- PostgreSQL sebagai source of truth transaksi.
- Tabel high-volume dipartisi waktu:
  - `radius_accounting`
  - `wa_messages` (opsional saat volume tinggi)
  - `device_metrics`, `traffic_metrics`, `device_status_logs`

## Caching

Redis untuk:
- hot read cache (read-heavy endpoint)
- rate limiting
- distributed lock (job invoice/suspend)

## Read Model

Untuk dashboard berat (NOC/CS), gunakan read model terdenormalisasi agar query API ringan.

---

# 7) Deployment Topology v1

## Komponen Runtime

- `api` (NestJS) stateless, bisa multi-instance
- `worker-jobs` (billing, notification, retry, outbox publisher)
- `worker-ai` (intent/suggestion/summary)
- `postgres`
- `redis`
- `reverse-proxy/load-balancer`

## Horizontal Scaling

- Scale `api` berdasarkan CPU/RPS
- Scale `worker-jobs` berdasarkan queue depth
- Scale `worker-ai` terpisah agar lonjakan AI tidak ganggu API inti

---

# 8) Security Baseline

- JWT access + refresh rotation
- RBAC middleware per endpoint/use-case
- Secret via env manager/vault, bukan hardcoded
- Encrypt sensitive fields (radius password, snmp community)
- Audit log untuk aksi kritikal
- Rate limit endpoint publik/webhook

---

# 9) Observability & SLO

## Observability

- Structured logs (JSON) + correlation id (`x-request-id`)
- Metrics:
  - API latency/error rate
  - queue depth, retry count, DLQ count
  - webhook success/failure
  - AI suggestion acceptance rate
- Tracing untuk alur lintas modul

## SLO Awal

- API p95 < 300 ms (endpoint non-heavy)
- Webhook WA acknowledge < 2 detik
- Invoice generation job success > 99%
- MTTR incident prioritas tinggi < 60 menit

---

# 10) Kontrak Event Awal (Ringkas)

## `invoice.paid`

Payload minimum:
- `event_id`
- `occurred_at`
- `invoice_id`
- `customer_id`
- `amount`
- `payment_method`

Consumer:
- `billing_payment` (status update)
- `radius_provisioning` (unsuspend rule)
- `wa_gateway` (notifikasi pembayaran diterima)

## `ticket.created`

Payload minimum:
- `event_id`
- `occurred_at`
- `ticket_id`
- `customer_id`
- `category`
- `priority`

Consumer:
- `wa_gateway` (acknowledgement)
- `ai_cs_assistant` (summary/reply context)

---

# 11) Roadmap Transisi ke Microservice

## Trigger Pemecahan Service (berbasis data)

Pecah modul jadi service terpisah jika salah satu terjadi konsisten:
- Throughput modul jauh lebih tinggi dari modul lain
- Deploy cadence modul terhambat coupling
- SLA modul butuh skala/isolasi berbeda

## Urutan Kandidat Split

1. `wa_gateway`
2. `ai_cs_assistant`
3. `network_monitoring`
4. `billing_payment`

Alasan: workload asinkron tinggi dan pola scaling berbeda dari core CRUD.

## Cara Split Aman

- Tetapkan API contract publik internal lebih dulu
- Pindahkan consumer event terlebih dahulu
- Lalu pindahkan write path
- Gunakan strangler pattern, bukan big-bang rewrite

---

# 12) Risiko Arsitektur & Mitigasi

- Coupling tersembunyi via query lintas tabel
  - Mitigasi: code review rule + linting dependency per module

- Queue overload saat campaign/notifikasi massal
  - Mitigasi: rate control, priority queue, worker autoscaling

- AI workload mengganggu operasional inti
  - Mitigasi: pisah worker AI + resource quota

- Event drift (schema event berubah liar)
  - Mitigasi: event versioning + schema registry sederhana

---

# 13) Keputusan Teknis Awal

- Arsitektur: Modular monolith
- Runtime: Node.js + NestJS
- DB: PostgreSQL
- Cache/queue: Redis
- Event internal: Outbox + worker publisher
- Observability: Prometheus + Grafana + centralized logging

Dokumen ini menjadi baseline sebelum implementasi service dan migration code.

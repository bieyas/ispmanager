# Frontend Architecture v1 ISP Manager

Dokumen ini menjadi acuan arsitektur frontend agar pengembangan bisa paralel dengan backend tanpa kehilangan konsistensi platform.

Tanggal: **6 Maret 2026**

---

# 1) Tujuan Arsitektur Frontend

- Mendukung delivery cepat untuk MVP 90 hari.
- Menjaga modularitas per domain bisnis.
- Memudahkan integrasi bertahap dari mock API ke API backend nyata.
- Menjaga performa dan maintainability saat jumlah fitur bertambah.

---

# 2) Prinsip Utama

## 1. Domain-Driven Frontend

Frontend dipisah berdasarkan domain yang sama dengan backend:
- auth_access
- customer
- service_package
- billing_payment
- network_monitoring
- ticketing_operation
- wa_gateway
- ai_cs_assistant

## 2. API-Contract First

UI dibangun dari contract API (OpenAPI/schema typed client), bukan hardcoded response shape.

## 3. Parallel Development Friendly

Semua fitur harus bisa berjalan dengan:
- mock adapter (dev mode)
- real adapter (staging/prod)

## 4. Shared UX System

Komponen, token, dan pola interaksi konsisten lintas modul.

---

# 3) Tech Stack Frontend (v1)

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind + design tokens CSS variables
- State:
  - Server state: TanStack Query
  - UI state lokal: Zustand/Context (minimal)
- Form: React Hook Form + Zod
- Table: TanStack Table
- Chart: ECharts/Recharts (sesuai kebutuhan NOC dashboard)
- Realtime: WebSocket/SSE untuk notifikasi status penting

---

# 4) Struktur Folder (Rekomendasi)

```txt
src/
  app/
    (dashboard)/
      customers/
      billing/
      tickets/
      network/
      wa/
      ai-cs/
    login/
  modules/
    auth/
    customer/
    billing/
    ticketing/
    network/
    wa-gateway/
    ai-cs/
  shared/
    components/
    layout/
    hooks/
    lib/
    types/
    constants/
    api/
      client.ts
      interceptors.ts
      adapters/
        mock/
        real/
```

Aturan:
- Kode domain ditempatkan di `modules/*`.
- `shared/*` hanya untuk reusable generic logic.
- Dilarang impor lintas domain secara langsung jika bisa lewat contract/hook.

---

# 5) Routing & Navigation

## Route Group Utama

- `/login`
- `/dashboard/customers`
- `/dashboard/packages`
- `/dashboard/billing`
- `/dashboard/tickets`
- `/dashboard/network`
- `/dashboard/wa`
- `/dashboard/ai-cs`
- `/dashboard/settings`

## Role-Based Navigation

Menu dan akses route berdasarkan role RBAC dari backend.
Contoh:
- Finance: billing
- NOC: network
- CS: tickets + wa + ai-cs

---

# 6) Data Flow & State Strategy

## Server State (TanStack Query)

- Semua fetch API melalui query hook per domain.
- Gunakan cache key konsisten, contoh:
  - `['customers', filters]`
  - `['invoices', period, status]`
  - `['wa-conversations', queueFilter]`

## Mutation Pattern

- Gunakan optimistic update hanya untuk aksi low-risk.
- Untuk aksi kritikal (payment, suspend/unsuspend), gunakan pessimistic update + refetch.

## Error Handling

- Error level domain ditangani di hook/domain UI.
- Error global (401/403/500) ditangani interceptor + global boundary.

---

# 7) Auth & Security Frontend

- Access token disimpan aman (httpOnly cookie jika memungkinkan).
- Refresh flow transparan via interceptor.
- Guard route berbasis role + permission.
- Masking data sensitif di UI (KTP, credential teknis).
- Audit action ID ditampilkan untuk aksi kritikal (billing/ticket admin).

---

# 8) UX Pattern Wajib

- Semua halaman list memiliki:
  - search
  - filter
  - sort
  - pagination
  - empty/loading/error states
- Semua aksi penting punya:
  - confirmation dialog
  - success/error toast yang jelas
- Form panjang memiliki:
  - autosave draft (jika relevan)
  - validasi inline

---

# 9) Integrasi Realtime

Gunakan realtime untuk event operasional:
- status device berubah
- ticket updated
- pesan WA masuk
- delivery/read status WA

Mekanisme:
- Prioritas awal: polling adaptif + invalidation query
- Upgrade: WebSocket/SSE pada modul WA dan NOC saat traffic meningkat

---

# 10) Performance Baseline

- Code splitting per route/domain.
- Virtualized table untuk data besar.
- Debounce search/filter.
- Batasi rerender dengan selector state dan memoization.
- Target web vitals internal:
  - LCP < 2.5s (dashboard utama)
  - CLS < 0.1
  - TTI tetap responsif pada device mid-range.

---

# 11) Testing Strategy Frontend

- Unit test untuk util/hook kritikal.
- Component test untuk form dan table behaviour.
- E2E smoke untuk alur utama:
  - login
  - create customer
  - generate invoice
  - create ticket
  - send WA message (mock/provider sandbox)

---

# 12) Delivery Plan Selaras Roadmap 12 Minggu

## Minggu 1-2

- Setup project FE, layout shell, auth guard, design token dasar.

## Minggu 3-5

- Modul auth, customer, paket.

## Minggu 6-8

- Modul billing dan aksi suspend/unsuspend flow.

## Minggu 9-10

- Modul network monitoring, ticketing, WA inbox.

## Minggu 11-12

- Modul AI CS panel (suggested reply/summary), hardening UX, UAT fix.

---

# 13) Definition of Done Frontend

- UI mengikuti role/permission backend.
- Semua halaman punya loading/error/empty state yang jelas.
- Aksi kritikal punya guard + feedback.
- API contract typed dan tidak ada hardcoded shape liar.
- Lulus smoke E2E untuk flow MVP.

---

# 14) Risiko & Mitigasi

- FE blocked karena backend endpoint belum siap
  - Mitigasi: mock adapter + contract-first

- UI tidak konsisten antar modul
  - Mitigasi: shared component + review checklist UI

- Performa drop di data besar
  - Mitigasi: server pagination + virtualization

- Drift antara contract FE-BE
  - Mitigasi: schema sync rutin per sprint

---

# 15) Keputusan Teknis Awal

- Arsitektur: domain-modular frontend
- Integrasi data: typed API contract + query layer
- Realtime: polling adaptif dulu, lalu websocket/sse untuk domain kritikal
- Delivery: paralel dengan backend, bukan menunggu backend selesai total

Dokumen ini menjadi baseline frontend sebelum pembuatan task FE detail per modul.

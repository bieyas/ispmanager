# Kickoff Execution Plan (Stack Owner Workflow)

Dokumen ini mengunci persiapan teknis tahap awal sebelum coding sprint berjalan penuh.

Tanggal: **6 Maret 2026**

---

# 1) Stack Lock (Keputusan Final)

## Backend

- Language/runtime: Node.js 20 LTS
- Framework: NestJS
- ORM/query: **Prisma** (keputusan final v1)
- Validation: **class-validator + class-transformer** (keputusan final v1)
- Queue: Redis (BullMQ)

Alasan keputusan:
- Prisma mempercepat delivery awal (migration + type-safe client + ergonomi developer baik).
- `class-validator` paling native untuk NestJS DTO/pipe, minim friction implementasi.
- Untuk query sangat kompleks/performa spesifik, gunakan raw SQL terukur tanpa mengganti ORM utama.

## Frontend

- Framework: Next.js 15+ (App Router)
- Language: TypeScript strict
- Server state: TanStack Query
- Styling: Tailwind + shared design tokens
- Form: React Hook Form + Zod

## Data & Infra

- DB utama: PostgreSQL 16
- Observability: Prometheus + Grafana + centralized logging
- Container local: Docker Compose

## Rule Lock

- Semua keputusan di atas dianggap default sampai ada ADR perubahan.
- Perubahan stack lintas domain butuh approval Tech Lead + PM.

---

# 2) Owner Mapping (Keputusan Awal)

Catatan:
- Karena nama personel final belum ditetapkan, dipakai **acting owner** berbasis fungsi.
- Wajib diganti ke nama nyata sebelum Sprint 3.

| Domain | PIC Utama | Backup | Catatan |
|---|---|---|---|
| Auth & Access | Backend Lead (Acting) | Platform Engineer (Acting) | Prioritas tinggi Sprint 1-3 |
| Customer | Backend Lead (Acting) | Fullstack Engineer (Acting) | Modul fondasi operasional |
| Service & Package | Backend Lead (Acting) | Fullstack Engineer (Acting) | Bergantung customer module |
| Billing & Payment | Backend Lead (Acting) | Finance Product Owner (Acting) | Butuh validasi aturan billing |
| Radius Provisioning | Network Integrations Engineer (Acting) | Backend Lead (Acting) | Integrasi vendor-dependent |
| Network Monitoring | Network Integrations Engineer (Acting) | Fullstack Engineer (Acting) | Koordinasi erat dengan NOC |
| Ticketing Operation | Frontend Lead (Acting) | Backend Lead (Acting) | UX CS jadi fokus utama |
| WA Gateway | Integrations Engineer (Acting) | Backend Lead (Acting) | Webhook + idempotency wajib |
| AI CS Assistant | AI Engineer (Acting) | Frontend Lead (Acting) | Human approval wajib |
| Frontend Shared Platform | Frontend Lead (Acting) | Fullstack Engineer (Acting) | Guardrail UI lintas domain |
| DevOps/Infra | DevOps Lead (Acting) | Backend Lead (Acting) | CI/CD + env + observability |
| QA Lead | QA Lead (Acting) | Frontend Lead (Acting) | Risk-based testing MVP |

Aturan:
- Satu domain harus punya satu PIC accountable.
- Backup wajib ditentukan untuk menjaga continuity.

---

# 3) Branching & PR Workflow

## Branch Model

- `main` : branch stabil
- `develop` : integration branch sprint aktif
- `feature/<domain>-<short-desc>`
- `fix/<domain>-<short-desc>`

## Pull Request Rule

- Minimal 1 reviewer dari domain terkait.
- Untuk perubahan lintas domain: wajib reviewer tambahan dari owner domain terdampak.
- PR wajib isi template (summary, risk, validation).
- Squash merge untuk menjaga histori bersih.

## Commit Convention

Format:
- `feat(<domain>): ...`
- `fix(<domain>): ...`
- `refactor(<domain>): ...`
- `docs(...): ...`
- `chore(...): ...`

Contoh:
- `feat(billing): add manual payment endpoint`
- `fix(wa-gateway): prevent duplicate webhook processing`

---

# 4) Sprint 1-2 Minimum Technical Outcome

- [ ] Repo baseline siap (`backend`, `frontend`, `infra`, `.github`).
- [ ] CI placeholder aktif.
- [ ] Keputusan stack final ditandatangani tim.
- [ ] Owner domain terisi nama nyata.
- [ ] API contract auth/customer v1 dipublikasikan.

---

# 5) Exit Criteria Sebelum Sprint 3

- [ ] Tidak ada area domain tanpa PIC.
- [ ] Build backend/frontend dapat dijalankan lokal.
- [ ] DDL baseline tervalidasi di environment dev.
- [ ] PR workflow dan review discipline sudah berjalan 1 sprint.

---

# 6) Dokumen Eksekusi Harian

Untuk task harian Sprint 1-2, gunakan dokumen turunan berikut:

- `konsep/Sprint 1-2 Task Assignment (Fullstack + Codex).md`

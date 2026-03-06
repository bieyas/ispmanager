# Sprint 1-2 Task Assignment (Fullstack + Codex)

Dokumen ini memecah eksekusi Sprint 1-2 menjadi tugas harian yang bisa dikerjakan langsung secara fullstack dengan bantuan Codex.

Tanggal acuan: **6 Maret 2026**

---

# 1) Operating Model

- Developer utama: **Anda (Fullstack)**
- Copilot implementasi: **Codex**
- Pola kerja: daily micro-sprint, merge kecil, verifikasi cepat

Prinsip:
- Satu hari maksimal 1-3 deliverable yang bisa diverifikasi.
- Semua task harus menghasilkan artefak jelas (kode/dokumen/config).

---

# 2) Sprint 1 (Minggu 1) - Foundation & Repo Hygiene

## Day 1 - Workspace Bootstrap

- [ ] Inisialisasi backend NestJS project skeleton di `backend/`
- [ ] Inisialisasi frontend Next.js project skeleton di `frontend/`
- [ ] Tambahkan `Makefile` atau skrip `npm run dev:all`

Output:
- Struktur codebase bisa dijalankan lokal (`backend` dan `frontend` up)

## Day 2 - Tooling & Quality Gate

- [ ] Setup ESLint + Prettier backend/frontend
- [ ] Setup TypeScript strict mode
- [ ] Setup Husky/lint-staged (opsional tapi direkomendasikan)

Output:
- `lint` dan `typecheck` bisa jalan konsisten

## Day 3 - Backend Core Setup

- [ ] Setup NestJS module awal: `auth_access`, `customer`
- [ ] Setup Prisma + koneksi PostgreSQL
- [ ] Buat migration pertama minimal (`admin_users`, `roles`, `permissions`, `customers`)

Output:
- Backend boot + DB migration pertama sukses

## Day 4 - Frontend Core Setup

- [ ] Setup App Router + dashboard layout + login page
- [ ] Setup TanStack Query provider
- [ ] Setup API client + adapter mock/real

Output:
- UI login + dashboard shell tampil stabil

## Day 5 - CI Minimum + Docs Lock

- [ ] Upgrade workflow CI dari placeholder ke lint + typecheck
- [ ] Tambah script standar di root/backend/frontend (`lint`, `test`, `build`)
- [ ] Review ulang dokumen konsep, pastikan link silang konsisten

Output:
- PR minimal check otomatis berjalan

---

# 3) Sprint 2 (Minggu 2) - Auth & Customer Baseline

## Day 6 - Auth Backend v1

- [ ] Endpoint `POST /auth/login`
- [ ] Endpoint `GET /auth/me`
- [ ] JWT access + refresh basic flow
- [ ] Seed role default (Super Admin, NOC, Finance, CS, Teknisi)

Output:
- Login dan fetch profile user dari token berjalan

## Day 7 - Auth Frontend v1

- [ ] Integrasi form login ke endpoint nyata
- [ ] Route guard untuk halaman dashboard
- [ ] Menu role-based minimal

Output:
- Login/logout FE-BE terhubung end-to-end

## Day 8 - Customer Backend v1

- [ ] Endpoint customer list/create/update/detail
- [ ] Validasi DTO via `class-validator`
- [ ] Pagination + search dasar

Output:
- API customer siap dipakai FE

## Day 9 - Customer Frontend v1

- [ ] Halaman list customer (search + pagination)
- [ ] Form create/edit customer
- [ ] Detail customer sederhana

Output:
- CRUD customer FE-BE berjalan

## Day 10 - Stabilization & Sprint Review

- [ ] Smoke test flow: login -> customer CRUD
- [ ] Fix bug prioritas tinggi
- [ ] Catat tech debt & action Sprint 3

Output:
- Demo Sprint 1-2 siap

---

# 4) Definition of Done Sprint 1-2

Sprint 1-2 selesai jika:
- [ ] Backend dan frontend bisa dijalankan lokal dengan 1 perintah ringkas.
- [ ] CI menjalankan lint + typecheck + build minimal.
- [ ] Login + session basic berjalan end-to-end.
- [ ] Customer CRUD basic berjalan end-to-end.
- [ ] Tidak ada blocker kritikal untuk mulai Sprint 3.

---

# 5) Cara Kolaborasi dengan Codex (Praktis)

Untuk tiap hari kerja:
1. Minta Codex buatkan rencana task hari itu (1-3 item maksimal).
2. Minta Codex implement langsung sampai test/verification.
3. Minta Codex ringkas hasil + next action.

Prompt pattern yang bisa dipakai:
- "Kerjakan Day 1 sesuai dokumen assignment."
- "Lanjut Day 2, pastikan lint/typecheck beres."
- "Review hasil Day 6, cek risiko sebelum lanjut Day 7."

---

# 6) Risiko Sprint 1-2 dan Mitigasi

- Scope melebar terlalu cepat
  - Mitigasi: tahan fitur di luar auth/customer hingga Sprint 3

- Waktu habis di setup tooling
  - Mitigasi: pakai baseline sederhana dulu, optimasi belakangan

- Integrasi FE-BE tersendat
  - Mitigasi: mock adapter tetap aktif sampai endpoint stabil

- Drift keputusan teknis
  - Mitigasi: semua perubahan stack harus update dokumen kickoff

---

# 7) Next Step Setelah Sprint 2

Mulai Sprint 3 fokus:
- Package assignment
- Billing fondasi
- Suspend/unsuspend flow

Dokumen ini adalah task-level execution layer dari roadmap utama.

# Roadmap & Checklist Pengembangan Aplikasi ISP Manager

Dokumen ini adalah versi eksekusi 90 hari (12 minggu) untuk menyiapkan ISP Manager dari tahap fondasi sampai siap dipakai operasional awal.

Tanggal acuan kickoff: **9 Maret 2026**.
Rentang 90 hari: **9 Maret 2026 - 6 Juni 2026**.

---

# 1) Sasaran 90 Hari

## Sasaran Utama

- Sistem dipakai operasional harian untuk customer, paket, billing, dan kontrol suspend/unsuspend.
- Admin internal bisa bekerja sesuai role (Super Admin, NOC, Finance, CS, Teknisi).
- Integrasi awal Radius/PPPoE berjalan untuk vendor prioritas.
- Monitoring dasar dan alerting aktif untuk perangkat inti.

## MVP Go-Live (Wajib Ada)

- Auth admin + RBAC + audit log aksi penting.
- Customer management (create/update/search/status).
- Paket internet + assignment paket ke pelanggan.
- Billing invoice bulanan + pembayaran manual + ledger.
- Suspend/unsuspend manual dan otomatis berbasis status invoice.
- Monitoring perangkat dasar (ping/status) + notifikasi alert.
- WA Gateway operasional (inbound/outbound, template notifikasi, webhook delivery status).
- CS AI Assistant v1 (suggested reply, ringkasan tiket, intent dasar dengan human approval).

## Out of Scope 90 Hari

- Microservice penuh.
- Sharding database.
- AI autopilot penuh tanpa human review.

---

# 2) Arsitektur Tahap Awal (Pragmatis)

## Stack yang Dipakai untuk Fase 90 Hari

Backend
- Node.js + NestJS (modular monolith)

Database
- PostgreSQL

Cache + Queue ringan
- Redis (cache + job queue)

Frontend
- Next.js

Observability
- Prometheus + Grafana + Loki (atau log aggregator setara)

Catatan:
- Untuk 0-5.000 pelanggan, modular monolith lebih cepat stabil daripada langsung microservice.
- Event bus besar (Kafka/RabbitMQ) dipertimbangkan setelah bottleneck terukur.

---

# 3) Definition of Done (DoD) Per Domain

## Platform & DevOps

- [ ] CI lint, unit test, dan build jalan otomatis di setiap pull request.
- [ ] Environment `dev`, `staging`, `prod` terdokumentasi dan tervalidasi.
- [ ] Backup database harian + 1x uji restore sukses.

## Security

- [ ] JWT access token + refresh token rotation.
- [ ] RBAC tervalidasi oleh test minimal untuk endpoint kritikal.
- [ ] Password terenkripsi kuat (Argon2/Bcrypt cost policy jelas).
- [ ] Audit log untuk login, perubahan paket, suspend/unsuspend, dan pembayaran.

## Billing

- [ ] Invoice idempotent (tidak duplikat pada retry job).
- [ ] Grace period, denda (jika dipakai), dan cutoff date terdokumentasi.
- [ ] Rekonsiliasi pembayaran manual bisa dilacak (siapa, kapan, bukti).

## Integrasi Radius/PPPoE

- [ ] Adapter vendor prioritas selesai dan lolos contract test.
- [ ] Aksi disconnect/suspend/unsuspend memiliki retry policy + audit.
- [ ] Status online pelanggan dapat diambil dan ditampilkan.

## Operasional

- [ ] Alerting aktif ke Telegram/WhatsApp untuk device down.
- [ ] Runbook incident dasar tersedia untuk NOC.
- [ ] SLA internal support terdokumentasi (contoh: respons tiket <= 15 menit jam kerja).

## WA Gateway

- [ ] Inbound webhook tervalidasi signature dan idempotent.
- [ ] Outbound queue dengan retry policy dan dead-letter handling.
- [ ] Template notifikasi billing/tiket bisa dikelola dan diaudit.
- [ ] Delivery/read status tersimpan untuk histori komunikasi CS.

## CS AI Assistant

- [ ] AI hanya memberi rekomendasi, bukan auto-send default.
- [ ] Prompt guardrail + redaksi data sensitif aktif.
- [ ] Semua respons AI tercatat pada `ai_assist_logs` untuk audit.
- [ ] Tombol fallback ke balasan manual selalu tersedia untuk agent.

---

# 4) Data Model Minimum (Wajib Sebelum Feature Besar)

## Entitas Inti

- `admin_users`, `roles`, `permissions`, `audit_logs`
- `customers`, `customer_documents`, `customer_tags`
- `packages`, `package_histories`
- `invoices`, `invoice_items`, `payments`, `payment_audit`
- `network_devices`, `device_status_logs`
- `tickets`, `ticket_histories`, `installation_jobs`
- `wa_conversations`, `wa_messages`, `wa_templates`, `wa_delivery_logs`
- `ai_assist_logs`, `kb_articles`, `kb_article_embeddings`

## Standar Kolom Wajib

- [ ] `created_at`, `updated_at`, `created_by`, `updated_by`
- [ ] Soft delete (`deleted_at`) untuk entitas bisnis sensitif
- [ ] Foreign key dan index untuk query utama (customer, invoice, status)

## Migrasi & Data Governance

- [ ] Gunakan migration versioning tool konsisten.
- [ ] Seed data role/permission default.
- [ ] Data retention policy untuk log dan metrik.

---

# 5) Rencana Eksekusi 12 Minggu

## Legenda Owner

- BE: Backend Engineer
- FE: Frontend Engineer
- DEVOPS: DevOps/Infra
- QA: QA/Tester
- PM: Product/Project Manager
- NOC: Subject Matter Expert Operasional

## Sprint Plan

| Minggu | Fokus | Deliverable | Dependency | Owner | Risiko Utama | Mitigasi |
|---|---|---|---|---|---|---|
| 1 | Kickoff + scope lock | BRD ringkas, MVP final, backlog prioritas | Keputusan bisnis paket & SOP | PM, BE, FE, NOC | Scope creep | Freeze scope MVP dan change request board |
| 2 | Setup fondasi project | Repo, struktur monorepo/polyrepo, CI basic, env dev/staging | Akses server/staging | DEVOPS, BE | Delay infra | Pakai staging minimal di awal |
| 3 | Auth + RBAC | Login admin, role matrix, seed role default | Final role policy | BE, FE | Role ambigu | Sign-off role matrix per divisi |
| 4 | Customer module v1 | CRUD customer, search, status, import awal | Final field customer | BE, FE, QA | Data tidak konsisten | Validasi form + constraint DB |
| 5 | Paket & assignment | CRUD paket, assign paket, riwayat perubahan | Customer module v1 | BE, FE | Perubahan paket tanpa jejak | Wajib audit trail |
| 6 | Billing v1 | Generate invoice bulanan, pembayaran manual, ledger | Paket & customer stabil | BE, FE, QA | Bug perhitungan | Test case edge billing + approval finance |
| 7 | Integrasi Radius/PPPoE v1 | Provision user PPPoE, suspend/unsuspend manual, status online | Kredensial lab/perangkat uji | BE, NOC | Variasi vendor | Adapter interface + mock test |
| 8 | Otomasi billing | Auto suspend/unsuspend, reminder jatuh tempo | Billing v1 + scheduler | BE, QA | Job duplikat | Idempotency key + distributed lock |
| 9 | Device management + monitoring | CRUD device, ping monitor, alert Telegram/WhatsApp | Akses device NOC | BE, FE, NOC | False alarm tinggi | Threshold dan cooldown alert |
| 10 | Ticketing + WA Gateway | Ticket lifecycle, assign teknisi, inbound/outbound WA, template notifikasi | Role teknisi dan CS siap | BE, FE, QA | Workflow CS tidak cocok | UAT harian dengan CS + template review |
| 11 | CS AI Assistant v1 + hardening | Suggested reply, ringkasan tiket, guardrail, structured log, dashboard metrik | Ticketing + WA stabil | DEVOPS, BE, FE, QA | Respons AI tidak akurat | Human approval wajib + evaluasi intent mingguan |
| 12 | UAT + go-live terbatas | UAT checklist lulus, training user, pilot production, evaluasi kualitas AI awal | Semua modul MVP stabil | PM, QA, BE, FE, NOC | Defect kritikal saat launch | Pilot bertahap + rollback plan |

---

# 6) Dependency Kritis Antar Modul

- Auth + RBAC harus selesai sebelum ticketing dan billing approval.
- Customer dan paket harus stabil sebelum billing otomatis.
- Billing status harus jadi single source untuk suspend/unsuspend otomatis.
- Integrasi Radius harus punya contract test sebelum automation aktif.
- Monitoring + alert wajib aktif sebelum pilot go-live.
- Ticketing harus stabil sebelum CS AI Assistant diaktifkan untuk agent.
- WA Gateway harus idempotent sebelum notifikasi dan AI CS dipakai luas.

---

# 7) Risk Register Awal

| Risiko | Dampak | Probabilitas | Pemilik | Rencana Mitigasi |
|---|---|---|---|---|
| Scope berubah terus | Timeline mundur | Tinggi | PM | Scope freeze mingguan + approval CR |
| Integrasi vendor Radius/OLT berbeda-beda | Fitur suspend gagal | Tinggi | BE, NOC | Adapter per vendor + sandbox lab |
| Formula billing tidak disepakati | Dispute finansial | Tinggi | Finance, PM | Dokumen aturan billing + test UAT finance |
| Kualitas data pelanggan buruk | Operasional kacau | Sedang | CS, BE | Data cleanup script + mandatory field |
| Monitoring noisy | Alert fatigue | Sedang | NOC | Tuning threshold + escalation policy |
| Keterbatasan tim QA | Bug lolos ke produksi | Sedang | PM, QA | Risk-based testing + test automation smoke |
| Respons AI CS keliru/hallucination | Salah informasi ke pelanggan | Sedang | PM, CS Lead | Human-in-the-loop + confidence threshold + FAQ grounding |

---

# 8) Checklist Go-Live Readiness

## Teknis

- [ ] Semua migration production tervalidasi.
- [ ] Backup & restore drill berhasil.
- [ ] P95 API utama sesuai target internal.
- [ ] Alerting dan dashboard operasional aktif.

## Keamanan

- [ ] Secret management tidak hardcoded.
- [ ] Akses admin produksi berbasis least privilege.
- [ ] Audit log kritikal bisa ditelusuri.

## Operasional

- [ ] SOP CS/NOC/Finance terdokumentasi.
- [ ] Training user internal selesai.
- [ ] Incident runbook dan rollback plan tersedia.

## Kesiapan WA & AI CS

- [ ] Nomor WA gateway dan webhook failover tervalidasi.
- [ ] Template pesan disetujui tim CS/Legal (jika ada).
- [ ] AI guardrail dan daftar intent terlarang tervalidasi.
- [ ] Sampel 100 percakapan pertama direview manual untuk quality gate.

---

# 9) Tahap Lanjutan Setelah 90 Hari

Jika MVP stabil 4-8 minggu pasca go-live:

- Customer self service portal.
- Payment gateway full automation.
- NOC dashboard geospasial dan trafik backbone.
- Refactor ke service terpisah berdasarkan bottleneck terukur.
- CS AI Assistant phase 2 (auto-triage tiket, rekomendasi tindakan teknis).
- Advanced analytics (churn prediction dan upgrade recommendation).

---

# 10) Target Skalabilitas

Tahap awal
- 0-500 pelanggan

Tahap menengah
- 500-5.000 pelanggan

Tahap besar
- 5.000-50.000+ pelanggan

Prinsip skalabilitas:
- Mulai dari sistem sederhana yang reliabel.
- Ukur bottleneck secara objektif.
- Scale up/scale out bertahap berdasarkan data nyata.

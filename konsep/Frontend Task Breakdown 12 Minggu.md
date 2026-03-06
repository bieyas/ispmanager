# Frontend Task Breakdown 12 Minggu

Dokumen ini menurunkan `Frontend Architecture v1 ISP Manager` menjadi backlog eksekusi mingguan yang siap dipindah ke board kerja.

Tanggal acuan: **6 Maret 2026**
Periode implementasi: **9 Maret 2026 - 6 Juni 2026**

---

# 1) Cara Pakai Dokumen

- Setiap minggu berisi deliverable FE minimum.
- Task ditulis agar dapat dikerjakan paralel dengan backend (mock-first).
- Kolom `Dependency` menandai kebutuhan dari BE/produk sebelum merge final.

Legenda:
- FE = Frontend Engineer
- BE = Backend Engineer
- QA = QA/Tester
- PM = Product/Project Manager

---

# 2) Sprint Backlog FE (12 Minggu)

| Minggu | Fokus FE | Task Utama | Deliverable | Dependency | Owner | Acceptance Criteria |
|---|---|---|---|---|---|---|
| 1 | FE foundation setup | Inisialisasi Next.js + TS + linting + folder modular; setup Tailwind token; setup query client; setup API client + adapter mock/real | Project FE bootstrap siap dev | Keputusan stack final | FE | Build jalan, lint pass, route dasar render |
| 2 | App shell & auth baseline | Layout dashboard; route guard; login page; state sesi; global error/loading boundary | Shell aplikasi + login flow mock | Kontrak auth minimal (login/me) | FE | User role mock bisa login/logout + akses route sesuai guard |
| 3 | Auth/RBAC integration | Integrasi endpoint auth nyata; role-based menu; forbidden page 403; session refresh flow | Auth production-ready v1 | Endpoint auth staging | FE, BE | Role menu benar, token refresh stabil, no hardcoded role |
| 4 | Customer module v1 | Halaman list customer (search/filter/pagination), detail customer, form create/edit + validasi | Customer CRUD UI v1 | Kontrak customer CRUD | FE, BE | CRUD end-to-end lolos smoke test |
| 5 | Package module & assignment | Halaman paket internet, assign paket ke customer, riwayat perubahan paket | Package UI v1 | Kontrak package + assignment | FE, BE | Assign paket terekam dan tampil di histori |
| 6 | Billing module v1 | Invoice list, detail invoice, payment form manual, status badge, export dasar | Billing UI v1 | Endpoint invoice/payment | FE, BE, QA | Update status invoice real-time via refetch sukses |
| 7 | Operational actions | UI suspend/unsuspend dari context billing/customer; confirmation modal + audit hint | Suspend/unsuspend action panel | Endpoint suspend/unsuspend | FE, BE | Aksi kritikal wajib konfirmasi + feedback sukses/gagal jelas |
| 8 | Hardening billing UX | Filter periode/status, bulk select aman (opsional), error-state edge case, skeleton loading konsisten | Billing UX hardening | Stabilitas endpoint billing | FE, QA | Tidak ada blocking issue di UAT finance |
| 9 | Network monitoring UI | Device list, status card, grafik dasar metrik, status POP, polling adaptif | Network dashboard v1 | Endpoint device + metrics | FE, BE, NOC | Device down terlihat <= 1 interval polling |
| 10 | Ticketing + WA inbox | Ticket list/detail/update; WA conversation list/chat panel; link chat ke ticket/customer | CS workspace v1 | Endpoint ticket + WA gateway | FE, BE, QA | Agent bisa balas chat dan buat tiket dari percakapan |
| 11 | AI CS panel | Suggested reply panel, confidence badge, summary panel, approve/edit/send flow | AI copilot UI v1 | Endpoint AI suggestion/summary | FE, BE, QA | Tidak ada auto-send; approval flow wajib sebelum kirim |
| 12 | UAT fix + go-live prep | Bugfix prioritas, optimasi performa route berat, audit UX final, training material screenshot | FE release candidate | UAT lintas tim | FE, QA, PM | Smoke E2E lulus untuk flow MVP utama |

---

# 3) Task Breakdown Detail per Domain

## A. Shared Platform FE

- [ ] `src/modules/*` scaffold untuk semua domain utama.
- [ ] `src/shared/api/client.ts` + interceptor auth/error.
- [ ] Adapter switch `mock` vs `real` berbasis environment.
- [ ] Komponen reusable: table, filter bar, form field, modal konfirmasi, empty/error state.
- [ ] Standard toast/notification pattern.

## B. Auth & RBAC

- [ ] Login form + validation schema.
- [ ] Session bootstrap (`/me`) saat app init.
- [ ] Route guard per role/permission.
- [ ] Menu gating berdasarkan permission map.

## C. Customer & Package

- [ ] Customer list + detail + edit form.
- [ ] Upload dokumen customer (UI + progress).
- [ ] Package list + create/edit.
- [ ] Assign package from customer detail.

## D. Billing

- [ ] Invoice table + status chips.
- [ ] Invoice detail drawer/page.
- [ ] Manual payment form + proof input.
- [ ] Suspend/unsuspend action UI.

## E. Network & Monitoring

- [ ] Device table + health indicator.
- [ ] POP summary cards.
- [ ] Traffic chart basic.
- [ ] Auto refresh interval control.

## F. Ticketing + WA

- [ ] Ticket board/list + detail timeline.
- [ ] WA conversation queue + chat thread.
- [ ] Quick action: create/update ticket from chat context.
- [ ] Delivery/read status indicator.

## G. AI CS

- [ ] Suggested reply panel + edit box.
- [ ] Confidence indicator & warning UI.
- [ ] Summary card untuk handover shift.
- [ ] Explicit approve action sebelum send.

---

# 4) Definition of Ready (DoR) per Task FE

Task FE boleh dikerjakan jika:
- [ ] Ada user flow jelas (PM/produk).
- [ ] Ada contract response minimal (real atau mock schema).
- [ ] Ada acceptance criteria yang terukur.
- [ ] Dependency lintas tim tercatat.

---

# 5) Definition of Done (DoD) per Task FE

Task FE dianggap selesai jika:
- [ ] UI sesuai role/permission yang benar.
- [ ] Loading, empty, error state tersedia.
- [ ] Validasi form berjalan.
- [ ] Tidak ada hardcoded API shape di komponen.
- [ ] Unit/component test minimal untuk logic penting.
- [ ] Lulus QA checklist modul.

---

# 6) QA Checklist FE (MVP)

- [ ] Login/logout + refresh token flow.
- [ ] Customer CRUD tidak regress.
- [ ] Payment submit aman dari double click.
- [ ] Suspend/unsuspend menampilkan status terbaru.
- [ ] Ticket create/update dari WA berjalan.
- [ ] AI suggestion tidak auto-send.
- [ ] Layout usable di desktop dan mobile.

---

# 7) Risiko Eksekusi FE & Mitigasi

- Endpoint BE terlambat tersedia
  - Mitigasi: mock adapter + contract review mingguan

- Perubahan shape response berulang
  - Mitigasi: typed client + schema validation di adapter

- UI debt karena kejar target
  - Mitigasi: hardening week (minggu 8 & 12) wajib

- Modul WA/AI berat di performa
  - Mitigasi: virtualized list + split panel lazy load

---

# 8) Artefak yang Harus Dihasilkan FE

- Board task FE mingguan (import dari dokumen ini)
- Mock API schema per domain
- Komponen shared library internal
- QA checklist hasil eksekusi per sprint
- Changelog UI untuk UAT

---

# 9) Prioritas Jika Resource FE Terbatas

Urutan prioritas delivery:
1. Auth + Customer + Billing core
2. Suspend/Unsuspend + Ticketing
3. WA inbox
4. AI CS panel
5. Enhancement visual non-kritis

Prinsip: fitur operasional inti selalu didahulukan dibanding polishing.

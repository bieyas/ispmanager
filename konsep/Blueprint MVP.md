# Blueprint MVP Aplikasi Manajemen ISP

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan kerja produk dan teknis yang sinkron dengan kode saat ini, bukan hanya blueprint ideal.

Targetnya:

- menjaga konsep tetap sejalan dengan implementasi
- membedakan fitur yang sudah jalan, sebagian jalan, dan masih disiapkan
- menentukan urutan prioritas agar pekerjaan coding berikutnya lebih terstruktur

Tanggal sinkronisasi dokumen ini: `2026-04-17`

## 2. Kondisi Repository Saat Ini

Struktur yang benar-benar sudah ada saat ini:

```txt
ispmanager/
  apps/
    api/
    admin-web/
    customer-portal/
  packages/
    db/
  konsep/
```

Kesimpulan:

- aplikasi sudah berjalan melewati tahap konsep awal
- fondasi monorepo sudah ada, tetapi masih parsial
- `apps/customer-portal/` sudah discaffold sebagai portal pelanggan minimum
- `packages/auth`, `packages/ui`, `packages/config`, `packages/types`, dan `packages/utils` belum dipisah menjadi package sendiri
- sumber kebenaran domain saat ini tersebar di:
  - `packages/db/prisma/schema.prisma`
  - `packages/db/src/seed-data.ts`
  - `apps/api/src/modules/*`
  - `apps/admin-web/src/*`

## 3. Evaluasi Kesesuaian dengan Konsep

Jawaban singkat: aplikasi sudah berjalan sesuai arah konsep inti, dan pada beberapa area sudah berkembang lebih jauh dari blueprint awal. Tetapi perkembangan itu belum sepenuhnya tercermin di dokumen, sehingga dokumen sekarang perlu diubah dari "rencana" menjadi "status kerja aktual".

### 3.1 Area yang Sudah Jalan

- autentikasi internal dan `auth/me`
- RBAC berbasis role dan permission
- master `service_plans`
- prospect / PSB
- aktivasi prospect menjadi customer + subscription
- customers
- subscriptions `list`
- invoices `list/detail`
- payments dan verifikasi pembayaran
- renewals
- cash categories dan cash transactions
- dashboard dan report summary dasar
- pengaturan umum aplikasi untuk default map center

### 3.2 Area yang Sudah Disiapkan di Database dan RBAC, Tapi Belum Lengkap di API/UI

- users management
- roles management
- customer addresses CRUD mandiri
- customer portal account flow sisi pelanggan
- tickets
- work orders
- installation verifications
- notification logs dan workflow WhatsApp reminder
- audit log viewer
- dashboard khusus per role yang lebih lengkap

### 3.3 Area yang Belum Masuk Implementasi Nyata

- customer portal app terpisah
- payment gateway
- integrasi WhatsApp dua arah
- isolir otomatis
- integrasi Mikrotik / RADIUS / PPPoE provisioning
- manajemen OLT/ODP detail
- mobile app native

## 4. Status Modul MVP

| Modul | Status | Catatan Sinkronisasi |
|---|---|---|
| Auth | Sudah jalan | Login, token, `auth/me`, permission sudah aktif |
| RBAC | Sudah jalan | Seed permission dan middleware `authorize()` sudah aktif |
| Prospect / PSB | Sudah jalan | Ada list, detail, create, update, status workflow, aktivasi |
| Customer | Sudah jalan | Ada list, detail, update, delete soft-delete |
| Service Plan | Sudah jalan | CRUD dasar sudah aktif |
| Subscription | Sebagian | `list`, `detail`, dan UI admin minimum untuk invoice sudah ada |
| Billing / Invoice | Sebagian | Listing, detail, create manual, generate periodik, dan cancel sudah ada |
| Payment | Sudah jalan | Create, verify, reject sudah aktif |
| Renewal | Sudah jalan dasar | Create dan list sudah ada |
| Cashflow | Sudah jalan | Cash category dan cash transaction cukup maju |
| Dashboard / Report | Sudah jalan dasar | Summary operasional dan finance sudah ada |
| Settings | Sudah jalan dasar | Baru general settings map center |
| Customer Accounts | Sebagian | API ada dan auth customer flow minimum sudah ada |
| Ticketing | Sebagian | API minimum dan UI admin minimum sudah ada |
| Work Order | Sebagian | API minimum dan UI admin minimum sudah ada |
| Installation Verification | Sebagian | API minimum dan UI admin minimum sudah ada |
| Notifications | Belum aktif | Sudah ada schema dan permission seed, belum ada route/UI/job |
| Audit Logs | Sebagian backend | Penulisan log sudah dipakai di beberapa modul, viewer belum ada |

## 5. Keputusan Sinkronisasi Konsep

Mulai sekarang, konsep kerja disepakati sebagai berikut:

### 5.1 Sumber Kebenaran

- struktur data: `packages/db/prisma/schema.prisma`
- daftar permission dan role default: `packages/db/src/seed-data.ts`
- fitur backend yang benar-benar aktif: `apps/api/src/modules`
- fitur admin yang benar-benar aktif: `apps/admin-web/src`
- dokumen konsep: merangkum dan menjelaskan, bukan mendahului implementasi tanpa penanda status

### 5.2 Definisi Status

Gunakan tiga label ini pada review berikutnya:

- `Sudah jalan`: schema + seed bila perlu + route/service + UI atau endpoint benar-benar aktif
- `Sebagian`: fondasi data ada, tetapi API/UI belum lengkap
- `Direncanakan`: baru ada di konsep atau seed, belum menjadi fitur aktif

### 5.3 Prinsip Kerja Berikutnya

- jangan menambah domain baru sebelum workflow domain inti rapi
- tiap modul baru harus sinkron minimal di 4 titik:
  - schema
  - permission
  - route/service
  - UI / konsumsi endpoint
- jika sebuah key permission belum dipakai route atau UI, tandai sebagai `seeded, not active`

## 6. Prioritas Pengembangan

Urutan ini dipilih supaya coding berikutnya lancar dan tidak membangun fitur di atas fondasi yang belum utuh.

### Prioritas 1: Rapikan Fondasi yang Sudah Dipakai Setiap Hari

Harus ada dulu:

- sinkronkan seluruh permission aktif antara seed, route API, dan menu frontend
- rapikan definisi akses `settings`
- lengkapi contract dashboard/report yang dipakai admin web
- pastikan seluruh modul aktif punya validasi, audit log, dan scope RBAC yang konsisten
- rapikan dokumentasi status implementasi per modul

Alasan:

- tanpa fondasi ini, penambahan fitur berikutnya akan cepat tidak sinkron

### Prioritas 2: Lengkapi Workflow Revenue Inti

Harus ada berikutnya:

- detail subscription
- create/generate invoice manual dan periodik
- status transition invoice yang konsisten
- integrasi pembayaran ke efek bisnis yang lengkap
- penyempurnaan renewal agar tidak tumpang tindih dengan invoice/payment

Alasan:

- domain inilah inti arus bisnis ISP dan paling sering dipakai operasional

### Prioritas 3: Selesaikan Workflow Operasional Lapangan

Harus ada setelah billing inti stabil:

- work order API
- installation verification API
- ticketing API
- halaman admin untuk teknisi
- attachment / dokumentasi pekerjaan lapangan

Alasan:

- schema dan permission sudah siap, jadi ini ekspansi yang paling natural

### Prioritas 4: Customer-Facing Layer

Dikerjakan setelah prioritas 1-3 stabil:

- customer portal app
- login customer
- halaman layanan, invoice, pembayaran, tiket
- reset/ganti password customer

Alasan:

- portal pelanggan bergantung pada domain billing, subscription, dan ticket yang sudah rapi

### Prioritas 5: Otomasi dan Integrasi

- job generate invoice otomatis
- mark overdue otomatis
- reminder WhatsApp
- provisioning customer account saat aktivasi
- integrasi jaringan dan payment gateway

## 7. Checklist Review Pekerjaan yang Sudah Dikerjakan

- [x] monorepo dasar sudah dibuat
- [x] package database sudah memakai Prisma
- [x] role dan permission sudah di-seed
- [x] autentikasi internal sudah berjalan
- [x] middleware otorisasi backend sudah aktif
- [x] prospect/PSB sudah punya workflow dasar
- [x] aktivasi prospect ke customer sudah ada
- [x] customer dan subscription dasar sudah terbentuk saat aktivasi
- [x] service plan sudah bisa dikelola
- [x] invoice list/detail sudah ada
- [x] subscription detail dan invoice tools minimum di admin web sudah ada
- [x] payment create/verify/reject sudah ada
- [x] renewal dasar sudah ada
- [x] cash in/out dan kategori kas sudah ada
- [x] dashboard summary dasar sudah ada
- [x] general settings untuk map center sudah ada
- [x] audit log backend sudah mulai dipakai
- [ ] route users management belum ada
- [ ] route roles management belum ada
- [x] route ticketing minimum sudah ada
- [x] route work order minimum sudah ada
- [x] route installation verification minimum sudah ada
- [x] UI admin minimum untuk ticketing/work order/verification sudah ada
- [ ] notification/job layer belum ada
- [x] customer portal app minimum sudah ada

## 8. Checklist Prioritas Pekerjaan Berikutnya

### Fase A - Wajib Sebelum Ekspansi Fitur

- [x] audit semua permission aktif vs route aktif vs menu aktif
- [x] perbaiki ketidaksinkronan permission finance di frontend
- [x] tetapkan permission khusus untuk `settings` atau batasi aksesnya secara eksplisit
- [x] buat daftar status modul: `sudah jalan`, `sebagian`, `direncanakan`
- [ ] pastikan scope `OWN` untuk teknisi konsisten di seluruh domain aktif

### Fase B - Revenue Core

- [x] tambah endpoint detail subscription
- [x] tambah endpoint create invoice manual
- [x] tambah endpoint generate invoice periodik
- [x] rapikan transisi invoice `draft -> issued -> paid/overdue/cancelled`
- [x] pastikan payment, invoice, renewal, dan cash posting tidak konflik
- [x] buat UI admin minimum untuk subscription dan invoice tools

### Fase C - Operasional Lapangan

- [x] implementasi route work order
- [x] implementasi route installation verification
- [x] implementasi route tickets
- [x] buat halaman admin minimum untuk work order, verification, dan tickets
- [x] ganti input ID mentah di operations menjadi picker berbasis data utama
- [ ] siapkan upload attachment pekerjaan

### Fase D - Customer Layer

- [x] scaffold `apps/customer-portal`
- [x] hubungkan `customer_accounts` dengan flow login customer minimum
- [x] tampilkan layanan aktif, invoice, dan tiket customer secara read-only
- [x] siapkan flow ganti password customer

### Fase E - Otomasi

- [ ] job generate invoice otomatis
- [ ] job mark overdue
- [ ] job reminder WhatsApp
- [ ] provisioning akun customer saat aktivasi

## 9. Kesimpulan Kerja

Aplikasi tidak lagi berada di tahap konsep mentah. Fondasi bisnis inti sudah nyata dan sudah mulai berkembang menjadi sistem operasional. Tantangan utama saat ini bukan "membangun dari nol", tetapi menjaga agar domain, permission, API, UI, dan dokumen tetap bergerak bersama.

Karena itu, fokus berikutnya harus: rapikan fondasi aktif dulu, tuntaskan revenue core, lalu masuk ke operasional lapangan dan portal pelanggan.

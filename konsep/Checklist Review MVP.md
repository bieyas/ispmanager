# Checklist Review MVP ISP Manager

Dokumen ini dipakai untuk review rutin setelah coding dan sebelum memulai batch pekerjaan besar berikutnya.

Tanggal sinkronisasi: `2026-04-17`

## 1. Review Hasil yang Sudah Dikerjakan

### Arsitektur dan Fondasi

- [x] monorepo dasar `apps/` dan `packages/` sudah dipakai
- [x] `packages/db` menjadi pusat schema, migration, dan seed
- [x] admin web dan API sudah dipisah sebagai aplikasi terpisah
- [x] scaffold `apps/customer-portal` minimum sudah ada
- [ ] package bersama selain database belum dipisah
- [ ] customer portal belum matang sebagai produk penuh

### Auth dan RBAC

- [x] login internal sudah aktif
- [x] `auth/me` sudah aktif
- [x] role default sudah ada
- [x] permission key sudah di-seed
- [x] middleware `authorize()` sudah dipakai di backend
- [x] matriks permission aktif vs route aktif mulai terdokumentasi rapi
- [x] permission untuk `settings` sudah eksplisit di kode dan dokumen

### Domain Operasional Inti

- [x] service plan CRUD dasar sudah ada
- [x] prospect/PSB sudah berjalan
- [x] aktivasi prospect menjadi customer + subscription sudah ada
- [x] customer list/detail/update sudah ada
- [x] subscription list dasar sudah ada
- [x] subscription detail dasar sudah ada
- [x] invoice list/detail sudah ada
- [x] invoice tool minimum untuk create manual dan generate periodik sudah ada di admin web
- [x] payment create/verify/reject sudah ada
- [x] renewal dasar sudah ada
- [x] cash categories dan cash transactions sudah ada
- [x] dashboard/report summary dasar sudah ada
- [x] operations page sudah memakai picker data utama, bukan input ID mentah
- [x] upload attachment work order minimum sudah ada
- [ ] workflow invoice lengkap belum selesai
- [ ] detail subscription belum lengkap

### Domain yang Masih Disiapkan

- [ ] users management
- [ ] roles management
- [ ] tickets masih minimum, belum matang
- [ ] work orders masih minimum, belum matang
- [ ] installation verifications masih minimum, belum matang
- [ ] notification logs dan job reminder
- [ ] audit log viewer
- [ ] customer portal masih minimum dan read-only

## 2. Checklist Review per Selesai Mengerjakan Fitur

- [ ] schema database sudah benar-benar mendukung flow bisnisnya
- [ ] seed permission ditambah atau diperbarui bila domain berubah
- [ ] route backend sudah memakai permission yang benar
- [ ] scope data `OWN` dan `ALL` sudah diperiksa
- [ ] response API cukup untuk kebutuhan UI
- [ ] UI hanya menampilkan aksi yang memang diizinkan
- [ ] audit log ditulis untuk aksi penting
- [ ] status entity dan transisi status terdokumentasi
- [ ] istilah di kode, schema, dan dokumen konsisten
- [ ] checklist ini diperbarui setelah fitur selesai

## 3. Prioritas Pekerjaan Berikutnya

### Prioritas 1 - Harus Ada Dulu

- [x] sinkronkan permission aktif antara `seed-data.ts`, route API, dan admin web
- [x] perbaiki guard menu finance yang masih memakai key yang tidak sinkron
- [x] tetapkan policy akses untuk halaman/settings backend
- [x] rapikan dokumentasi status modul agar backlog tidak campur dengan fitur aktif
- [x] lengkapi kontrak domain revenue yang sudah dipakai: subscription, invoice, payment, renewal
- [x] buat UI admin minimum untuk surface revenue dan operations

Kenapa didahulukan:

- ini fondasi yang mempengaruhi hampir semua coding berikutnya

### Prioritas 2 - Revenue Core

- [x] endpoint detail subscription
- [x] create invoice manual
- [x] generate invoice periodik
- [x] konsistensi status invoice
- [x] integrasi efek payment ke invoice, renewal, dan cashflow

Kenapa sesudah prioritas 1:

- ini domain bisnis paling kritis untuk operasional dan pendapatan

### Prioritas 3 - Operasional Lapangan

- [x] work order module minimum
- [x] installation verification module minimum
- [x] ticketing module minimum
- [x] halaman admin minimum untuk workflow lapangan
- [x] upload attachment / bukti kerja minimum

Kenapa sesudah revenue core:

- schema dan permission sudah siap, tetapi akan jauh lebih stabil jika billing core sudah rapi

### Prioritas 4 - Customer Portal

- [ ] scaffold app customer portal
- [x] login customer minimum
- [x] daftar layanan aktif minimum
- [x] invoice pelanggan minimum
- [x] tiket pelanggan read-only minimum

Kenapa belum lebih awal:

- portal pelanggan bergantung pada domain internal yang harus matang dulu

### Prioritas 5 - Otomasi dan Integrasi

- [ ] job generate invoice otomatis
- [ ] job overdue otomatis
- [ ] reminder WhatsApp
- [ ] provisioning customer account saat aktivasi
- [ ] integrasi jaringan dan payment gateway

## 4. Aturan Kerja Supaya Tetap Sinkron

- satu fitur dianggap selesai hanya jika schema, permission, route, dan UI sama-sama sinkron
- dokumen konsep harus diubah saat status implementasi berubah
- permission baru tidak boleh dibuat tanpa pemilik route yang jelas
- domain yang baru disiapkan di schema harus diberi label `belum aktif`

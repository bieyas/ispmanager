# Permission Keys Aplikasi ISP

## 1. Tujuan

Dokumen ini merangkum permission key yang dipakai sistem dan menjelaskan status implementasinya.

Tujuan praktisnya:

- RBAC backend
- proteksi route API
- filtering menu dan tombol di frontend
- audit log berbasis aksi
- membedakan permission yang sudah aktif dari yang baru disiapkan

Format key:

- `domain.action`
- bila perlu lebih spesifik: `domain.resource.action`

Contoh:

- `prospects.create`
- `subscriptions.activate`
- `notifications.logs.read`

Tanggal sinkronisasi dokumen ini: `2026-04-17`

## 2. Sumber Kebenaran

Urutan sumber kebenaran yang dipakai:

1. `packages/db/src/seed-data.ts`
2. `apps/api/src/modules/*`
3. `apps/admin-web/src/*`
4. dokumen ini

Artinya:

- daftar permission resmi mengikuti seed
- permission dianggap `aktif` bila sudah dipakai di route/service atau guard frontend
- permission yang baru ada di seed tetapi belum dipakai route/UI dianggap `seeded, not active`

## 3. Role Default

- `admin`
- `teknisi`
- `finance`
- `customer`

## 4. Aturan Implementasi RBAC

- semua otorisasi final diputuskan di backend
- frontend hanya mengikuti hasil RBAC backend
- permission `OWN` diterapkan lewat query scoping, bukan hanya menyembunyikan tombol
- field sensitif seperti `pppoe_password` harus memakai permission eksplisit
- job sistem memakai key `system.*`
- bila sebuah permission belum dipakai route atau UI, tandai sebagai belum aktif agar tidak diasumsikan sudah selesai

## 5. Status Sinkronisasi Saat Ini

### 5.1 Domain yang Sudah Aktif di Seed dan Route API

- `auth.*`
- `prospects.*`
- `customers.*`
- `customer_accounts.*`
- `service_plans.*`
- `subscriptions.list`
- `subscriptions.read`
- `invoices.list`
- `invoices.read`
- `payments.*`
- `renewals.list`
- `renewals.read`
- `renewals.create`
- `cash_transactions.*`
- `cash_categories.list`
- `reports.revenue.read`

### 5.2 Domain yang Sudah Aktif di Seed, Tetapi Baru Sebagian Aktif di Route/UI

- `settings.general.*`
- `subscriptions.*` selain `list/read`
- `invoices.*`
- `renewals.*` selain `list/read/create`
- `customer_accounts.*` karena customer portal belum ada
- `dashboard.*` karena dashboard per role belum dipisah penuh
- `work_orders.*`
- `installation_verifications.*`
- `tickets.*`

### 5.3 Domain yang Sudah Di-seed Tetapi Belum Aktif Sebagai Fitur Penuh

- `users.*`
- `roles.*`
- `customer_addresses.*`
- `notifications.*`
- `audit_logs.*`
- `reports.cashflow.read`
- `reports.receivables.read`
- `reports.technician_performance.read`
- `system.*`

## 6. Temuan Sinkronisasi yang Harus Diperhatikan

- route guard finance frontend sudah diselaraskan ke `reports.revenue.read`
- settings sudah dibatasi di frontend dan backend, tetapi database perlu di-seed ulang agar permission baru aktif penuh
- modul lapangan sudah punya API minimum, tetapi UI admin dan workflow attachment belum ada

## 7. Daftar Permission Keys

Di bawah ini adalah daftar permission resmi yang sudah mengikuti seed saat ini.

### 7.1 Auth dan Profil

- `auth.login`
- `auth.logout`
- `auth.me.read`
- `auth.profile.update`
- `auth.password.change_self`

Status:

- `aktif`

### 7.2 Users

- `users.list`
- `users.read`
- `users.create`
- `users.update`
- `users.activate`
- `users.deactivate`
- `users.reset_password`

Status:

- `seeded, not active`

### 7.3 Roles dan Permissions

- `roles.list`
- `roles.read`
- `roles.create`
- `roles.update`
- `roles.assign`
- `permissions.list`
- `settings.general.read`
- `settings.general.update`

Status:

- `aktif sebagian`

Catatan:

- backend dan frontend settings sudah dibatasi
- seed permission baru perlu di-apply ke database agar enforcement berbasis permission penuh

### 7.4 Prospects / PSB

- `prospects.list`
- `prospects.read`
- `prospects.create`
- `prospects.update`
- `prospects.delete`
- `prospects.assign_plan`
- `prospects.set_installation_date`
- `prospects.set_coordinates`
- `prospects.set_pppoe_username`
- `prospects.set_pppoe_password`
- `prospects.view_pppoe_password`
- `prospects.copy_pppoe_password`
- `prospects.mark_surveyed`
- `prospects.mark_scheduled_installation`
- `prospects.mark_installed`
- `prospects.mark_cancelled`
- `prospects.reject`
- `prospects.activate`
- `prospects.convert_to_customer`

Status:

- `aktif`

Catatan:

- untuk `teknisi`, domain ini harus mengikuti scope `OWN`
- `prospects.activate` dan `prospects.convert_to_customer` tetap domain approval level admin

### 7.5 Customers

- `customers.list`
- `customers.read`
- `customers.update`
- `customers.delete`
- `customers.view_customer_code`

Status:

- `aktif`

### 7.6 Customer Addresses

- `customer_addresses.list`
- `customer_addresses.read`
- `customer_addresses.create`
- `customer_addresses.update`
- `customer_addresses.delete`

Status:

- `seeded, not active`

### 7.7 Customer Accounts

- `customer_accounts.list`
- `customer_accounts.read`
- `customer_accounts.create`
- `customer_accounts.reset_password`
- `customer_accounts.disable`
- `customer_accounts.enable`
- `customer_accounts.change_password_self`

Status:

- `aktif sebagian`

Catatan:

- API internal sudah ada
- customer portal sebagai konsumen utamanya belum ada

### 7.8 Service Plans

- `service_plans.list`
- `service_plans.read`
- `service_plans.create`
- `service_plans.update`
- `service_plans.deactivate`

Status:

- `aktif`

### 7.9 Subscriptions

- `subscriptions.list`
- `subscriptions.read`
- `subscriptions.create`
- `subscriptions.update`
- `subscriptions.activate`
- `subscriptions.suspend`
- `subscriptions.resume`
- `subscriptions.terminate`
- `subscriptions.upgrade`
- `subscriptions.downgrade`
- `subscriptions.set_prorate`
- `subscriptions.set_billing_anchor`
- `subscriptions.view_pppoe_password`
- `subscriptions.copy_pppoe_password`
- `subscriptions.update_pppoe_password`

Status:

- `aktif sebagian`

Catatan:

- route yang aktif saat ini sudah mencakup `list` dan `detail`
- data subscription juga ikut muncul melalui customer activation dan customer detail

### 7.10 Work Orders

- `work_orders.list`
- `work_orders.read`
- `work_orders.create`
- `work_orders.assign`
- `work_orders.update`
- `work_orders.close`
- `work_orders.upload_attachment`
- `work_orders.installation_checklist.fill`
- `work_orders.device_serial.fill`
- `work_orders.signal_metrics.fill`

Status:

- `seeded, not active`

Catatan:

- API minimum untuk `list`, `detail`, `create`, `update`, dan `close` sudah ditambahkan
- UI admin khusus work order belum ada

### 7.11 Installation Verifications

- `installation_verifications.read`
- `installation_verifications.submit`
- `installation_verifications.verify`
- `installation_verifications.reject`

Status:

- `seeded, not active`

Catatan:

- API minimum untuk `list`, `detail`, `submit`, `verify`, dan `reject` sudah ditambahkan
- UI admin khusus verifikasi instalasi belum ada

### 7.12 Invoices

- `invoices.list`
- `invoices.read`
- `invoices.create_manual`
- `invoices.generate_periodic`
- `invoices.generate_auto`
- `invoices.mark_overdue_auto`
- `invoices.cancel`
- `invoices.download`

Status:

- `aktif sebagian`

Catatan:

- route aktif saat ini: `list`, `read`, `create_manual`, `generate_periodic`, `cancel`
- workflow create/generate/cancel/download belum seluruhnya aktif

### 7.13 Payments

- `payments.list`
- `payments.read`
- `payments.create_transfer`
- `payments.create_field_collection`
- `payments.verify`
- `payments.reject`
- `payments.void`

Status:

- `aktif sebagian`

Catatan:

- `void` masih seeded dan belum aktif
- create, list, read, verify, reject sudah aktif

### 7.14 Renewals

- `renewals.list`
- `renewals.read`
- `renewals.create`
- `renewals.cancel_draft`
- `renewals.confirm`

Status:

- `aktif sebagian`

Catatan:

- `list`, `read`, `create` sudah aktif
- `cancel_draft` dan `confirm` masih seeded dan belum aktif penuh

### 7.15 Cash Categories

- `cash_categories.list`
- `cash_categories.read`
- `cash_categories.create`
- `cash_categories.update`
- `cash_categories.deactivate`

Status:

- `aktif sebagian`

Catatan:

- route `list` aktif
- domain manajemen penuh masih perlu dicek dan dirapikan bila ingin dibuka di UI

### 7.16 Cash Transactions

- `cash_transactions.list`
- `cash_transactions.read`
- `cash_transactions.create_in`
- `cash_transactions.create_out`
- `cash_transactions.update`
- `cash_transactions.delete`
- `cash_transactions.confirm`
- `cash_transactions.report`

Status:

- `aktif`

### 7.17 Tickets

- `tickets.list`
- `tickets.read`
- `tickets.create`
- `tickets.assign`
- `tickets.update_status`
- `tickets.comment`
- `tickets.close`

Status:

- `seeded, not active`

Catatan:

- API minimum untuk `list`, `read`, `create`, `assign`, `update_status`, `comment`, dan `close` sudah ditambahkan
- UI admin khusus ticketing belum ada

### 7.18 Notifications

- `notifications.logs.list`
- `notifications.logs.read`
- `notifications.whatsapp.send_h_minus_3`
- `notifications.whatsapp.send_h_0`
- `notifications.whatsapp.send_manual`

Status:

- `seeded, not active`

### 7.19 Dashboard dan Reports

- `dashboard.admin.read`
- `dashboard.teknisi.read`
- `dashboard.finance.read`
- `dashboard.customer.read`
- `reports.revenue.read`
- `reports.cashflow.read`
- `reports.receivables.read`
- `reports.technician_performance.read`

Status:

- `aktif sebagian`

Catatan:

- `reports.revenue.read` dipakai route summary saat ini
- key report lain masih seeded
- dashboard frontend sudah ada, tetapi belum dipisah kuat per role dan belum sepenuhnya memakai key dashboard spesifik

### 7.20 Audit Logs

- `audit_logs.list`
- `audit_logs.read`

Status:

- `seeded, not active`

Catatan:

- audit log backend sudah ditulis oleh beberapa route
- viewer dan route audit log khusus belum ada

## 8. Permission Sistem Terjadwal

Permission ini bukan untuk role manusia:

- `system.invoices.generate_auto`
- `system.invoices.mark_overdue`
- `system.notifications.whatsapp.h_minus_3`
- `system.notifications.whatsapp.h_0`
- `system.customer_accounts.provision_on_activation`

Status:

- `seeded, not active`

## 9. Role Default Saat Ini

Role default mengikuti `packages/db/src/seed-data.ts`.

Ringkasan praktis:

- `admin`: hampir semua permission manusia
- `teknisi`: fokus PSB, pelanggan scoped, pembayaran lapangan, dan operasional teknis
- `finance`: fokus billing, payment verification, cashflow, dan report finance
- `customer`: disiapkan untuk portal pelanggan

Jika terjadi konflik antara dokumen ini dan seed, ikuti seed lalu perbarui dokumen.

## 10. Checklist Sinkronisasi Permission

- [ ] key permission baru ditambahkan ke seed
- [ ] route backend memakai key yang sama persis
- [ ] guard frontend memakai key yang sama persis
- [ ] role default diperbarui bila ada domain baru
- [ ] status permission diberi label `aktif`, `aktif sebagian`, atau `seeded, not active`
- [ ] perubahan permission direview bersama perubahan schema dan UI

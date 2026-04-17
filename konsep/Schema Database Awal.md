# Schema Database Awal Aplikasi ISP

## 1. Tujuan

Dokumen ini menurunkan blueprint MVP menjadi schema PostgreSQL awal yang siap diterjemahkan ke:

- Prisma schema
- migration SQL
- seed data awal

Fokus dokumen ini:

- nama tabel
- kolom inti
- enum yang dibutuhkan
- foreign key
- unique constraint
- index penting
- aturan otomatis yang perlu diimplementasikan di service layer atau job

## 2. Konvensi Umum

- semua tabel utama memakai `id uuid primary key`
- semua timestamp memakai `timestamptz`
- semua nominal uang memakai `numeric(14,2)`
- semua flag boolean memakai `boolean not null default false`
- semua field status memakai enum PostgreSQL bila stabil
- semua tabel utama minimal memiliki:
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- untuk tabel yang perlu soft delete:
  - `deleted_at timestamptz null`

## 3. Enum yang Disarankan

### 3.1 Role

- `admin`
- `teknisi`
- `finance`
- `customer`

### 3.2 Prospect Status

- `prospect`
- `surveyed`
- `scheduled_installation`
- `installed`
- `activated`
- `cancelled`
- `rejected`

### 3.3 Customer Status

- `active`
- `inactive`
- `suspended`
- `terminated`

### 3.4 Subscription Status

- `active`
- `inactive`
- `suspended`
- `terminated`

### 3.5 Invoice Status

- `draft`
- `issued`
- `paid`
- `overdue`
- `cancelled`

### 3.6 Payment Status

- `pending`
- `confirmed`
- `rejected`

### 3.7 Renewal Status

- `draft`
- `pending_payment`
- `confirmed`
- `cancelled`

### 3.8 Ticket Status

- `open`
- `assigned`
- `in_progress`
- `resolved`
- `closed`
- `cancelled`

### 3.9 Ticket Category

- `installation`
- `trouble`
- `billing`
- `other`

### 3.10 Ticket Priority

- `low`
- `medium`
- `high`

### 3.11 Work Order Status

- `open`
- `scheduled`
- `on_progress`
- `done`
- `cancelled`

### 3.12 Installation Verification Status

- `submitted`
- `approved`
- `rejected`

### 3.13 Cash Transaction Type

- `cash_in`
- `cash_out`

### 3.14 Cash Transaction Status

- `draft`
- `confirmed`
- `cancelled`

### 3.15 Notification Channel

- `whatsapp`

### 3.16 Notification Status

- `pending`
- `sent`
- `failed`
- `cancelled`

## 4. Tabel Auth dan RBAC

### 4.1 `roles`

Kolom:

- `id`
- `code varchar(50) not null unique`
- `name varchar(100) not null`
- `description text null`
- `created_at`
- `updated_at`

Index:

- unique index `roles_code_uq (code)`

### 4.2 `permissions`

Kolom:

- `id`
- `key varchar(150) not null unique`
- `module varchar(80) not null`
- `description text null`
- `created_at`
- `updated_at`

Index:

- unique index `permissions_key_uq (key)`
- index `permissions_module_idx (module)`

### 4.3 `role_permissions`

Kolom:

- `id`
- `role_id uuid not null`
- `permission_id uuid not null`
- `created_at`

Constraint:

- unique `(role_id, permission_id)`

Foreign key:

- `role_id -> roles.id`
- `permission_id -> permissions.id`

### 4.4 `users`

Kolom:

- `id`
- `role_id uuid not null`
- `username varchar(60) not null unique`
- `password_hash text not null`
- `full_name varchar(150) not null`
- `email varchar(150) null`
- `phone varchar(30) null`
- `is_active boolean not null default true`
- `last_login_at timestamptz null`
- `created_at`
- `updated_at`
- `deleted_at`

Index:

- unique `users_username_uq (username)`
- index `users_role_id_idx (role_id)`
- index `users_is_active_idx (is_active)`

## 5. Tabel Master Layanan

### 5.1 `service_plans`

Kolom:

- `id`
- `code varchar(50) not null unique`
- `name varchar(150) not null`
- `description text null`
- `download_mbps integer not null`
- `upload_mbps integer not null`
- `price_monthly numeric(14,2) not null`
- `is_active boolean not null default true`
- `created_at`
- `updated_at`

Index:

- unique `service_plans_code_uq (code)`
- index `service_plans_is_active_idx (is_active)`

## 6. Tabel Prospect dan Aktivasi

### 6.1 `prospects`

Kolom:

- `id`
- `full_name varchar(150) not null`
- `identity_no varchar(50) null`
- `email varchar(150) null`
- `phone varchar(30) not null`
- `status prospect_status not null default 'prospect'`
- `service_plan_id uuid not null`
- `installation_date date null`
- `pppoe_username varchar(100) null`
- `pppoe_password text null`
- `address_line text not null`
- `village varchar(120) null`
- `district varchar(120) null`
- `city varchar(120) null`
- `province varchar(120) null`
- `postal_code varchar(20) null`
- `latitude numeric(10,7) null`
- `longitude numeric(10,7) null`
- `map_pick_source varchar(50) null`
- `input_source varchar(50) not null default 'manual'`
- `created_by_user_id uuid not null`
- `notes text null`
- `created_at`
- `updated_at`
- `deleted_at`

Foreign key:

- `service_plan_id -> service_plans.id`
- `created_by_user_id -> users.id`

Index:

- index `prospects_status_idx (status)`
- index `prospects_phone_idx (phone)`
- index `prospects_installation_date_idx (installation_date)`
- index `prospects_created_by_user_id_idx (created_by_user_id)`

Catatan:

- prospect tetap disimpan setelah aktivasi untuk kebutuhan histori

### 6.2 `customers`

Kolom:

- `id`
- `customer_code varchar(20) not null unique`
- `activated_from_prospect_id uuid not null unique`
- `full_name varchar(150) not null`
- `identity_no varchar(50) null`
- `email varchar(150) null`
- `phone varchar(30) not null`
- `status customer_status not null default 'active'`
- `activated_at timestamptz not null`
- `created_by_user_id uuid not null`
- `notes text null`
- `created_at`
- `updated_at`
- `deleted_at`

Foreign key:

- `activated_from_prospect_id -> prospects.id`
- `created_by_user_id -> users.id`

Index:

- unique `customers_customer_code_uq (customer_code)`
- unique `customers_activated_from_prospect_id_uq (activated_from_prospect_id)`
- index `customers_status_idx (status)`
- index `customers_phone_idx (phone)`

Aturan `customer_code`:

- format `YYMMDDNNN`
- `YYMMDD` diambil dari `prospects.installation_date`
- `NNN` adalah urutan harian ber-padding 3 digit
- contoh: `260415001`

Saran implementasi:

- generate di service layer dalam transaksi database
- gunakan locking atau sequence harian agar tidak bentrok

### 6.3 `customer_addresses`

Kolom:

- `id`
- `customer_id uuid not null`
- `label varchar(80) not null`
- `address_line text not null`
- `village varchar(120) null`
- `district varchar(120) null`
- `city varchar(120) null`
- `province varchar(120) null`
- `postal_code varchar(20) null`
- `latitude numeric(10,7) null`
- `longitude numeric(10,7) null`
- `map_pick_source varchar(50) null`
- `is_primary boolean not null default true`
- `created_at`
- `updated_at`

Constraint:

- unique partial index untuk satu alamat utama per customer

Foreign key:

- `customer_id -> customers.id`

Index:

- index `customer_addresses_customer_id_idx (customer_id)`

### 6.4 `customer_users`

Kolom:

- `id`
- `customer_id uuid not null unique`
- `username varchar(60) not null unique`
- `password_hash text not null`
- `is_active boolean not null default true`
- `must_change_password boolean not null default true`
- `disabled_reason text null`
- `last_login_at timestamptz null`
- `created_at`
- `updated_at`

Foreign key:

- `customer_id -> customers.id`

Index:

- unique `customer_users_customer_id_uq (customer_id)`
- unique `customer_users_username_uq (username)`

Catatan:

- untuk MVP, satu customer satu akun portal
- username awal menggunakan `customer_code`

## 7. Tabel Operasional Langganan

### 7.1 `subscriptions`

Kolom:

- `id`
- `customer_id uuid not null`
- `service_plan_id uuid not null`
- `installation_address_id uuid not null`
- `subscription_no varchar(50) not null unique`
- `status subscription_status not null default 'active'`
- `start_date date not null`
- `installation_date date not null`
- `activation_date date not null`
- `billing_anchor_day integer not null`
- `prorate_enabled boolean not null default false`
- `first_due_date_override date null`
- `end_date date null`
- `current_period_start date not null`
- `current_period_end date not null`
- `billing_cycle_day integer not null`
- `pppoe_username varchar(100) null`
- `pppoe_password text null`
- `activated_at timestamptz not null`
- `suspended_at timestamptz null`
- `terminated_at timestamptz null`
- `notes text null`
- `created_at`
- `updated_at`

Foreign key:

- `customer_id -> customers.id`
- `service_plan_id -> service_plans.id`
- `installation_address_id -> customer_addresses.id`

Constraint:

- check `billing_anchor_day between 1 and 31`
- check `billing_cycle_day between 1 and 31`

Index:

- unique `subscriptions_subscription_no_uq (subscription_no)`
- index `subscriptions_customer_id_idx (customer_id)`
- index `subscriptions_status_idx (status)`
- index `subscriptions_activation_date_idx (activation_date)`

Aturan billing anchor:

- default `billing_anchor_day` mengikuti hari dari `activation_date`
- bila anchor 29, 30, atau 31 dan bulan target lebih pendek, gunakan hari terakhir di bulan tersebut

### 7.2 `subscription_renewals`

Kolom:

- `id`
- `subscription_id uuid not null`
- `invoice_id uuid null`
- `payment_id uuid null`
- `processed_by_user_id uuid not null`
- `renewal_no varchar(50) not null unique`
- `old_period_end date not null`
- `new_period_end date not null`
- `duration_month integer not null`
- `amount numeric(14,2) not null`
- `status renewal_status not null default 'draft'`
- `notes text null`
- `confirmed_at timestamptz null`
- `created_at`
- `updated_at`

Foreign key:

- `subscription_id -> subscriptions.id`
- `processed_by_user_id -> users.id`

Index:

- unique `subscription_renewals_renewal_no_uq (renewal_no)`
- index `subscription_renewals_subscription_id_idx (subscription_id)`
- index `subscription_renewals_status_idx (status)`

Catatan:

- setiap renewal selalu membuat invoice baru

## 8. Tabel Billing dan Pembayaran

### 8.1 `invoices`

Kolom:

- `id`
- `subscription_id uuid not null`
- `invoice_no varchar(50) not null unique`
- `period_start date not null`
- `period_end date not null`
- `issue_date date not null`
- `due_date date not null`
- `billing_anchor_date date not null`
- `is_prorated boolean not null default false`
- `generated_automatically boolean not null default false`
- `overdue_at timestamptz null`
- `subtotal numeric(14,2) not null`
- `discount_amount numeric(14,2) not null default 0`
- `tax_amount numeric(14,2) not null default 0`
- `total_amount numeric(14,2) not null`
- `status invoice_status not null default 'draft'`
- `notes text null`
- `created_at`
- `updated_at`

Foreign key:

- `subscription_id -> subscriptions.id`

Index:

- unique `invoices_invoice_no_uq (invoice_no)`
- index `invoices_subscription_id_idx (subscription_id)`
- index `invoices_status_idx (status)`
- index `invoices_due_date_idx (due_date)`

Aturan:

- invoice periodik otomatis dibuat pada `H-5` sebelum `due_date`
- jika lewat `due_date` dan status belum `paid`, ubah ke `overdue`
- invoice lama tidak ditimpa ketika renewal membuat invoice baru

### 8.2 `invoice_items`

Kolom:

- `id`
- `invoice_id uuid not null`
- `item_type varchar(50) not null`
- `description text not null`
- `qty integer not null`
- `unit_price numeric(14,2) not null`
- `line_total numeric(14,2) not null`
- `created_at`

Foreign key:

- `invoice_id -> invoices.id`

Index:

- index `invoice_items_invoice_id_idx (invoice_id)`

### 8.3 `payments`

Kolom:

- `id`
- `customer_id uuid not null`
- `invoice_id uuid not null`
- `payment_no varchar(50) not null unique`
- `payment_date date not null`
- `amount numeric(14,2) not null`
- `method varchar(50) not null`
- `channel varchar(50) null`
- `reference_no varchar(100) null`
- `proof_file_url text null`
- `status payment_status not null default 'pending'`
- `collected_by_user_id uuid null`
- `collection_notes text null`
- `confirmed_by_user_id uuid null`
- `confirmed_at timestamptz null`
- `notes text null`
- `created_at`
- `updated_at`

Foreign key:

- `customer_id -> customers.id`
- `invoice_id -> invoices.id`
- `collected_by_user_id -> users.id`
- `confirmed_by_user_id -> users.id`

Index:

- unique `payments_payment_no_uq (payment_no)`
- index `payments_customer_id_idx (customer_id)`
- index `payments_invoice_id_idx (invoice_id)`
- index `payments_status_idx (status)`

Catatan:

- field collection dipakai untuk pembayaran lapangan oleh teknisi

## 9. Tabel Kas dan Keuangan Dasar

### 9.1 `cash_categories`

Kolom:

- `id`
- `code varchar(80) not null unique`
- `name varchar(150) not null`
- `type cash_transaction_type not null`
- `is_active boolean not null default true`
- `description text null`
- `default_keterangan_template text null`
- `created_at`
- `updated_at`

Index:

- unique `cash_categories_code_uq (code)`
- index `cash_categories_type_idx (type)`

### 9.2 `cash_transactions`

Kolom:

- `id`
- `transaction_no varchar(50) not null unique`
- `transaction_date date not null`
- `type cash_transaction_type not null`
- `cash_category_id uuid not null`
- `amount numeric(14,2) not null`
- `method varchar(50) not null`
- `reference_no varchar(100) null`
- `proof_file_url text null`
- `keterangan varchar(255) not null`
- `description text null`
- `created_by_user_id uuid not null`
- `approved_by_user_id uuid null`
- `approved_at timestamptz null`
- `status cash_transaction_status not null default 'draft'`
- `created_at`
- `updated_at`

Foreign key:

- `cash_category_id -> cash_categories.id`
- `created_by_user_id -> users.id`
- `approved_by_user_id -> users.id`

Index:

- unique `cash_transactions_transaction_no_uq (transaction_no)`
- index `cash_transactions_transaction_date_idx (transaction_date)`
- index `cash_transactions_type_idx (type)`
- index `cash_transactions_status_idx (status)`
- index `cash_transactions_cash_category_id_idx (cash_category_id)`

## 10. Tabel Tiket dan Work Order

### 10.1 `tickets`

Kolom:

- `id`
- `ticket_no varchar(50) not null unique`
- `customer_id uuid not null`
- `subscription_id uuid null`
- `created_by_user_id uuid not null`
- `assigned_to_user_id uuid null`
- `category ticket_category not null`
- `priority ticket_priority not null default 'medium'`
- `subject varchar(200) not null`
- `description text not null`
- `status ticket_status not null default 'open'`
- `opened_at timestamptz not null`
- `resolved_at timestamptz null`
- `closed_at timestamptz null`
- `created_at`
- `updated_at`

Foreign key:

- `customer_id -> customers.id`
- `subscription_id -> subscriptions.id`
- `created_by_user_id -> users.id`
- `assigned_to_user_id -> users.id`

Index:

- unique `tickets_ticket_no_uq (ticket_no)`
- index `tickets_customer_id_idx (customer_id)`
- index `tickets_status_idx (status)`
- index `tickets_assigned_to_user_id_idx (assigned_to_user_id)`

### 10.2 `ticket_comments`

Kolom:

- `id`
- `ticket_id uuid not null`
- `user_id uuid not null`
- `comment text not null`
- `is_internal boolean not null default false`
- `created_at`

Foreign key:

- `ticket_id -> tickets.id`
- `user_id -> users.id`

Index:

- index `ticket_comments_ticket_id_idx (ticket_id)`

### 10.3 `work_orders`

Kolom:

- `id`
- `work_order_no varchar(50) not null unique`
- `source_type varchar(50) not null`
- `source_id uuid null`
- `prospect_id uuid null`
- `customer_id uuid null`
- `subscription_id uuid null`
- `assigned_to_user_id uuid null`
- `scheduled_date date null`
- `visit_result text null`
- `installation_checklist_json jsonb null`
- `device_serial_json jsonb null`
- `signal_metrics_json jsonb null`
- `status work_order_status not null default 'open'`
- `notes text null`
- `completed_at timestamptz null`
- `created_at`
- `updated_at`

Foreign key:

- `prospect_id -> prospects.id`
- `customer_id -> customers.id`
- `subscription_id -> subscriptions.id`
- `assigned_to_user_id -> users.id`

Index:

- unique `work_orders_work_order_no_uq (work_order_no)`
- index `work_orders_prospect_id_idx (prospect_id)`
- index `work_orders_customer_id_idx (customer_id)`
- index `work_orders_status_idx (status)`
- index `work_orders_assigned_to_user_id_idx (assigned_to_user_id)`

### 10.4 `installation_verifications`

Kolom:

- `id`
- `prospect_id uuid not null`
- `work_order_id uuid not null unique`
- `submitted_by_user_id uuid not null`
- `verified_by_user_id uuid null`
- `verification_status installation_verification_status not null default 'submitted'`
- `checklist_snapshot jsonb not null`
- `device_serial_snapshot jsonb null`
- `signal_snapshot jsonb null`
- `photo_summary text null`
- `verification_notes text null`
- `submitted_at timestamptz not null`
- `verified_at timestamptz null`
- `created_at`
- `updated_at`

Foreign key:

- `prospect_id -> prospects.id`
- `work_order_id -> work_orders.id`
- `submitted_by_user_id -> users.id`
- `verified_by_user_id -> users.id`

Index:

- unique `installation_verifications_work_order_id_uq (work_order_id)`
- index `installation_verifications_prospect_id_idx (prospect_id)`
- index `installation_verifications_status_idx (verification_status)`

### 10.5 `work_order_attachments`

Kolom:

- `id`
- `work_order_id uuid not null`
- `file_url text not null`
- `file_type varchar(50) null`
- `uploaded_by_user_id uuid not null`
- `created_at`

Foreign key:

- `work_order_id -> work_orders.id`
- `uploaded_by_user_id -> users.id`

Index:

- index `work_order_attachments_work_order_id_idx (work_order_id)`

## 11. Tabel Notifikasi

### 11.1 `notification_logs`

Kolom:

- `id`
- `channel notification_channel not null`
- `event_type varchar(80) not null`
- `customer_id uuid not null`
- `invoice_id uuid null`
- `target varchar(100) not null`
- `scheduled_at timestamptz not null`
- `sent_at timestamptz null`
- `status notification_status not null default 'pending'`
- `payload_summary jsonb null`
- `error_message text null`
- `created_at`
- `updated_at`

Foreign key:

- `customer_id -> customers.id`
- `invoice_id -> invoices.id`

Index:

- index `notification_logs_customer_id_idx (customer_id)`
- index `notification_logs_invoice_id_idx (invoice_id)`
- index `notification_logs_status_idx (status)`
- index `notification_logs_scheduled_at_idx (scheduled_at)`

Event awal:

- `invoice_reminder_h_minus_3`
- `invoice_reminder_h_0`

## 12. Tabel Audit

### 12.1 `audit_logs`

Kolom:

- `id`
- `user_id uuid null`
- `module varchar(80) not null`
- `action varchar(80) not null`
- `entity_type varchar(80) not null`
- `entity_id uuid null`
- `old_values jsonb null`
- `new_values jsonb null`
- `ip_address varchar(64) null`
- `user_agent text null`
- `created_at timestamptz not null default now()`

Foreign key:

- `user_id -> users.id`

Index:

- index `audit_logs_user_id_idx (user_id)`
- index `audit_logs_module_idx (module)`
- index `audit_logs_entity_idx (entity_type, entity_id)`
- index `audit_logs_created_at_idx (created_at desc)`

## 13. Transaksi Kritis yang Harus Atomic

### 13.1 Aktivasi Prospect

Dalam satu transaksi database:

1. validasi status prospect = `installed`
2. insert `customers`
3. insert `customer_addresses`
4. insert `subscriptions`
5. update `prospects.status = 'activated'`
6. insert `customer_users`
7. insert `audit_logs`

### 13.2 Konfirmasi Pembayaran

Dalam satu transaksi database:

1. update `payments.status = 'confirmed'`
2. update `payments.confirmed_by_user_id`, `confirmed_at`
3. update `invoices.status = 'paid'`
4. bila renewal terkait, update `subscription_renewals.status = 'confirmed'`
5. update `subscriptions.current_period_end` bila renewal confirmed
6. insert `audit_logs`

### 13.3 Generate Invoice Otomatis

Dalam satu transaksi database:

1. cari subscription aktif yang jatuh pada window `H-5`
2. cek belum ada invoice period yang sama
3. insert `invoices`
4. insert `invoice_items`
5. insert `notification_logs` bila perlu
6. insert `audit_logs`

## 14. Saran Index Tambahan untuk Performa

- index gabungan `invoices (status, due_date)`
- index gabungan `payments (status, payment_date)`
- index gabungan `prospects (status, installation_date)`
- index gabungan `work_orders (assigned_to_user_id, status, scheduled_date)`
- index gabungan `tickets (assigned_to_user_id, status)`
- index gabungan `cash_transactions (type, transaction_date, status)`

## 15. Catatan untuk Scaffold ORM

Saat diturunkan ke Prisma/ORM:

- pakai model terpisah untuk `prospects` dan `customers`
- pakai enum native database untuk status yang stabil
- field JSON seperti checklist dan signal metrics sebaiknya tetap `jsonb`
- nomor dokumen seperti `customer_code`, `invoice_no`, `payment_no`, `renewal_no`, `work_order_no` di-generate di service layer
- jangan jadikan nomor bisnis sebagai primary key

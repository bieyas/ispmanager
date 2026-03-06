# ERD ISP Manager (Production Scale)

Desain ERD ini diselaraskan dengan roadmap 90 hari dan PRD WA Gateway + AI CS.

Target kapasitas:
- Tahap menengah-besar: 10.000-50.000+ pelanggan
- Database utama: PostgreSQL
- Timeseries monitoring: TimescaleDB/InfluxDB (opsional terpisah)

Konvensi global untuk tabel bisnis:
- `id` UUID (kecuali tabel metrik volume besar dapat BIGINT)
- Audit fields minimum: `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft delete untuk entitas sensitif: `deleted_at`

---

# 1. AUTH & ACCESS DOMAIN

## Table: admin_users

| Field | Type | Description |
|------|------|-------------|
| id | uuid | primary key |
| full_name | varchar | nama admin |
| email | varchar | login email (unique) |
| password_hash | varchar | hash password |
| is_active | boolean | status user |
| last_login_at | timestamp | login terakhir |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |
| created_by | uuid | FK admin_users |
| updated_by | uuid | FK admin_users |
| deleted_at | timestamp | soft delete |

## Table: roles

| Field | Type |
|------|------|
| id | uuid |
| code | varchar |
| name | varchar |
| created_at | timestamp |
| updated_at | timestamp |

## Table: permissions

| Field | Type |
|------|------|
| id | uuid |
| code | varchar |
| name | varchar |
| module | varchar |
| created_at | timestamp |
| updated_at | timestamp |

## Table: role_permissions

| Field | Type |
|------|------|
| id | uuid |
| role_id | uuid |
| permission_id | uuid |
| created_at | timestamp |

## Table: admin_user_roles

| Field | Type |
|------|------|
| id | uuid |
| admin_user_id | uuid |
| role_id | uuid |
| created_at | timestamp |

## Table: audit_logs

| Field | Type | Description |
|------|------|-------------|
| id | bigint | primary key |
| actor_user_id | uuid | FK admin_users |
| action | varchar | contoh: LOGIN, UPDATE_PACKAGE |
| entity_type | varchar | nama entitas |
| entity_id | uuid | id entitas |
| before_data | jsonb | snapshot sebelum |
| after_data | jsonb | snapshot sesudah |
| ip_address | varchar | ip sumber |
| created_at | timestamp | waktu aksi |

---

# 2. CUSTOMER DOMAIN

## Table: customers

| Field | Type | Description |
|------|------|-------------|
| id | uuid | primary key |
| customer_code | varchar | kode pelanggan (unique) |
| name | varchar | nama pelanggan |
| email | varchar | email |
| phone | varchar | nomor utama E.164 |
| status | varchar | active / suspend / terminate |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |
| created_by | uuid | FK admin_users |
| updated_by | uuid | FK admin_users |
| deleted_at | timestamp | soft delete |

## Table: customer_profiles

| Field | Type | Description |
|------|------|-------------|
| id | uuid | primary key |
| customer_id | uuid | FK customers |
| address | text | alamat |
| city | varchar | kota |
| province | varchar | provinsi |
| latitude | decimal | koordinat |
| longitude | decimal | koordinat |
| identity_number | varchar | KTP |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |

## Table: customer_contacts

| Field | Type | Description |
|------|------|-------------|
| id | uuid | primary key |
| customer_id | uuid | FK customers |
| contact_name | varchar | nama kontak |
| phone | varchar | nomor hp |
| role | varchar | owner / admin / keluarga |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |

## Table: customer_documents

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| document_type | varchar |
| file_url | text |
| uploaded_by | uuid |
| created_at | timestamp |

## Table: customer_tags

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| tag | varchar |
| created_at | timestamp |

---

# 3. SERVICE & PACKAGE DOMAIN

## Table: service_packages

| Field | Type |
|------|------|
| id | uuid |
| name | varchar |
| speed_download | integer |
| speed_upload | integer |
| price | numeric |
| burst_limit | integer |
| fup_limit | integer |
| description | text |
| is_active | boolean |
| created_at | timestamp |
| updated_at | timestamp |
| deleted_at | timestamp |

## Table: package_histories

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| old_package_id | uuid |
| new_package_id | uuid |
| changed_by | uuid |
| reason | text |
| created_at | timestamp |

## Table: customer_services

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| package_id | uuid |
| activation_date | date |
| termination_date | date |
| status | varchar |
| created_at | timestamp |
| updated_at | timestamp |

---

# 4. AUTHENTICATION / RADIUS DOMAIN

## Table: radius_users

| Field | Type |
|------|------|
| id | uuid |
| customer_service_id | uuid |
| username | varchar |
| password_encrypted | varchar |
| profile | varchar |
| status | varchar |
| last_sync_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

## Table: radius_accounting

| Field | Type |
|------|------|
| id | bigint |
| username | varchar |
| nas_ip | varchar |
| session_start | timestamp |
| session_stop | timestamp |
| input_octets | bigint |
| output_octets | bigint |

Catatan: tabel volume besar, umumnya dipartisi berdasarkan waktu.

---

# 5. BILLING & PAYMENT DOMAIN

## Table: invoices

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| invoice_number | varchar |
| period | date |
| total_amount | numeric |
| status | varchar |
| due_date | date |
| paid_at | timestamp |
| idempotency_key | varchar |
| created_at | timestamp |
| updated_at | timestamp |

## Table: invoice_items

| Field | Type |
|------|------|
| id | uuid |
| invoice_id | uuid |
| description | text |
| amount | numeric |
| created_at | timestamp |

## Table: payments

| Field | Type |
|------|------|
| id | uuid |
| invoice_id | uuid |
| payment_method | varchar |
| amount | numeric |
| payment_date | timestamp |
| reference_number | varchar |
| received_by | uuid |
| created_at | timestamp |

## Table: payment_audit

| Field | Type |
|------|------|
| id | uuid |
| payment_id | uuid |
| action | varchar |
| actor_user_id | uuid |
| notes | text |
| created_at | timestamp |

## Table: invoice_status_histories

| Field | Type |
|------|------|
| id | uuid |
| invoice_id | uuid |
| old_status | varchar |
| new_status | varchar |
| changed_by | uuid |
| created_at | timestamp |

---

# 6. NETWORK INFRASTRUCTURE DOMAIN

## Table: pops

| Field | Type |
|------|------|
| id | uuid |
| name | varchar |
| address | text |
| latitude | decimal |
| longitude | decimal |
| created_at | timestamp |
| updated_at | timestamp |

## Table: network_devices

| Field | Type |
|------|------|
| id | uuid |
| pop_id | uuid |
| name | varchar |
| device_type | varchar |
| vendor | varchar |
| ip_address | varchar |
| snmp_community_encrypted | varchar |
| status | varchar |
| created_at | timestamp |
| updated_at | timestamp |

## Table: network_interfaces

| Field | Type |
|------|------|
| id | uuid |
| device_id | uuid |
| name | varchar |
| interface_type | varchar |
| status | varchar |
| created_at | timestamp |
| updated_at | timestamp |

---

# 7. CUSTOMER CONNECTION DOMAIN

## Table: customer_connections

| Field | Type |
|------|------|
| id | uuid |
| customer_service_id | uuid |
| device_id | uuid |
| interface_id | uuid |
| vlan_id | integer |
| ip_address | varchar |
| mac_address | varchar |
| created_at | timestamp |
| updated_at | timestamp |

---

# 8. TICKETING & FIELD OPERATION DOMAIN

## Table: tickets

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| category | varchar |
| subject | varchar |
| description | text |
| priority | varchar |
| status | varchar |
| assigned_to | uuid |
| sla_due_at | timestamp |
| closed_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

## Table: ticket_comments

| Field | Type |
|------|------|
| id | uuid |
| ticket_id | uuid |
| user_id | uuid |
| comment | text |
| is_internal | boolean |
| created_at | timestamp |

## Table: ticket_histories

| Field | Type |
|------|------|
| id | uuid |
| ticket_id | uuid |
| action | varchar |
| actor_user_id | uuid |
| metadata | jsonb |
| created_at | timestamp |

## Table: technicians

| Field | Type |
|------|------|
| id | uuid |
| name | varchar |
| phone | varchar |
| status | varchar |
| created_at | timestamp |
| updated_at | timestamp |

## Table: installation_jobs

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| technician_id | uuid |
| schedule_date | date |
| status | varchar |
| notes | text |
| photo_urls | jsonb |
| created_at | timestamp |
| updated_at | timestamp |

---

# 9. WA GATEWAY DOMAIN

## Table: wa_conversations

| Field | Type |
|------|------|
| id | uuid |
| customer_id | uuid |
| channel | varchar |
| status | varchar |
| assigned_agent_id | uuid |
| last_message_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

## Table: wa_messages

| Field | Type |
|------|------|
| id | uuid |
| conversation_id | uuid |
| direction | varchar |
| provider_message_id | varchar |
| message_type | varchar |
| content | text |
| status | varchar |
| sent_at | timestamp |
| delivered_at | timestamp |
| read_at | timestamp |
| failed_reason | text |
| raw_payload | jsonb |
| created_at | timestamp |

## Table: wa_templates

| Field | Type |
|------|------|
| id | uuid |
| template_code | varchar |
| language | varchar |
| category | varchar |
| version | integer |
| content | text |
| is_active | boolean |
| approved_by | uuid |
| approved_at | timestamp |
| created_at | timestamp |

## Table: wa_delivery_logs

| Field | Type |
|------|------|
| id | uuid |
| wa_message_id | uuid |
| event_type | varchar |
| payload | jsonb |
| event_at | timestamp |

---

# 10. AI CS ASSISTANT DOMAIN

## Table: ai_assist_logs

| Field | Type |
|------|------|
| id | uuid |
| conversation_id | uuid |
| ticket_id | uuid |
| intent | varchar |
| confidence | numeric |
| prompt_hash | varchar |
| response_text | text |
| approved_by_agent | boolean |
| approved_by | uuid |
| created_at | timestamp |

## Table: kb_articles

| Field | Type |
|------|------|
| id | uuid |
| title | varchar |
| content | text |
| status | varchar |
| updated_at | timestamp |

## Table: kb_article_embeddings

| Field | Type |
|------|------|
| id | uuid |
| kb_article_id | uuid |
| embedding_vector | vector |
| model_name | varchar |
| created_at | timestamp |

---

# 11. MONITORING DOMAIN

## Table: device_metrics

| Field | Type |
|------|------|
| id | bigint |
| device_id | uuid |
| cpu_usage | numeric |
| memory_usage | numeric |
| recorded_at | timestamp |

## Table: traffic_metrics

| Field | Type |
|------|------|
| id | bigint |
| interface_id | uuid |
| rx_bps | bigint |
| tx_bps | bigint |
| recorded_at | timestamp |

## Table: device_status_logs

| Field | Type |
|------|------|
| id | bigint |
| device_id | uuid |
| status | varchar |
| response_ms | integer |
| checked_at | timestamp |

---

# RELATIONSHIP SUMMARY

- `admin_users` -> `admin_user_roles` -> `roles` -> `role_permissions` -> `permissions`
- `admin_users` -> `audit_logs`
- `customers` -> `customer_profiles`, `customer_contacts`, `customer_documents`, `customer_tags`
- `customers` -> `customer_services` -> `service_packages`
- `customer_services` -> `radius_users`, `customer_connections`
- `customers` -> `invoices` -> `invoice_items`, `payments`, `invoice_status_histories`
- `payments` -> `payment_audit`
- `network_devices` -> `network_interfaces`, `device_metrics`, `device_status_logs`, `customer_connections`
- `customers` -> `tickets` -> `ticket_comments`, `ticket_histories`
- `customers` -> `installation_jobs`; `technicians` -> `installation_jobs`
- `customers` -> `wa_conversations` -> `wa_messages`, `ai_assist_logs`
- `tickets` -> `ai_assist_logs`
- `wa_messages` -> `wa_delivery_logs`
- `kb_articles` -> `kb_article_embeddings`

---

# INDEX KRITIS (MINIMUM)

- `customers(customer_code)` unique
- `customers(phone)` index
- `radius_users(username)` unique
- `invoices(invoice_number)` unique
- `invoices(customer_id, period)` index
- `payments(reference_number)` index
- `tickets(customer_id, status, created_at)` index
- `wa_messages(provider_message_id)` unique
- `wa_messages(conversation_id, created_at)` index
- `wa_conversations(customer_id, last_message_at)` index
- `ai_assist_logs(conversation_id, created_at)` index
- `device_status_logs(device_id, checked_at)` index

---

# ESTIMASI JUMLAH TABEL SISTEM PRODUKSI

Auth & Access: 6
Customer: 5
Service & Package: 3
Radius: 2
Billing & Payment: 5
Network: 3
Connection: 1
Ticketing & Operation: 5
WA Gateway: 4
AI CS: 3
Monitoring: 3

Total: ±40 tabel inti.

Catatan:
- Cakupan ini sudah sesuai kebutuhan MVP 90 hari plus fondasi scale-up.
- Saat skala tumbuh, pemisahan service dilakukan berdasarkan bottleneck terukur.

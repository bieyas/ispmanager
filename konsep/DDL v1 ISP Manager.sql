-- DDL v1 ISP Manager
-- Baseline schema generated from:
-- 1) Roadmap 90 hari
-- 2) PRD WA Gateway + AI CS
-- 3) ERD ISP Manager (Production Scale)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- 1) AUTH & ACCESS DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(150) NOT NULL,
  email varchar(190) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp
);

ALTER TABLE admin_users
  ADD CONSTRAINT fk_admin_users_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id),
  ADD CONSTRAINT fk_admin_users_updated_by FOREIGN KEY (updated_by) REFERENCES admin_users(id);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(80) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(120) NOT NULL UNIQUE,
  name varchar(150) NOT NULL,
  module varchar(80) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_admin_user_role UNIQUE (admin_user_id, role_id),
  CONSTRAINT fk_admin_user_roles_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id uuid,
  action varchar(100) NOT NULL,
  entity_type varchar(120) NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_user_id, created_at DESC);

-- =========================================================
-- 2) CUSTOMER DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code varchar(60) NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  email varchar(190),
  phone varchar(30),
  status varchar(24) NOT NULL CHECK (status IN ('active', 'suspend', 'terminate')),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp,
  CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id),
  CONSTRAINT fk_customers_updated_by FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE,
  address text,
  city varchar(100),
  province varchar(100),
  latitude numeric(10,7),
  longitude numeric(10,7),
  identity_number varchar(80),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_profiles_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  contact_name varchar(150) NOT NULL,
  phone varchar(30) NOT NULL,
  role varchar(40),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_contacts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON customer_contacts(phone);

CREATE TABLE IF NOT EXISTS customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  document_type varchar(60) NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_documents_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  tag varchar(60) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_tags_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id);

-- =========================================================
-- 3) SERVICE & PACKAGE DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(140) NOT NULL,
  speed_download integer NOT NULL,
  speed_upload integer NOT NULL,
  price numeric(14,2) NOT NULL,
  burst_limit integer,
  fup_limit integer,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS customer_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  package_id uuid NOT NULL,
  activation_date date,
  termination_date date,
  status varchar(24) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_services_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_customer_services_package FOREIGN KEY (package_id) REFERENCES service_packages(id)
);

CREATE INDEX IF NOT EXISTS idx_customer_services_customer_status ON customer_services(customer_id, status);

CREATE TABLE IF NOT EXISTS package_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  old_package_id uuid,
  new_package_id uuid NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_package_histories_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_package_histories_old_package FOREIGN KEY (old_package_id) REFERENCES service_packages(id),
  CONSTRAINT fk_package_histories_new_package FOREIGN KEY (new_package_id) REFERENCES service_packages(id),
  CONSTRAINT fk_package_histories_changed_by FOREIGN KEY (changed_by) REFERENCES admin_users(id)
);

-- =========================================================
-- 4) RADIUS DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS radius_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_service_id uuid NOT NULL UNIQUE,
  username varchar(120) NOT NULL UNIQUE,
  password_encrypted varchar(255) NOT NULL,
  profile varchar(80),
  status varchar(24) NOT NULL,
  last_sync_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_radius_users_customer_service FOREIGN KEY (customer_service_id) REFERENCES customer_services(id)
);

CREATE TABLE IF NOT EXISTS radius_accounting (
  id bigserial PRIMARY KEY,
  username varchar(120) NOT NULL,
  nas_ip varchar(64),
  session_start timestamp,
  session_stop timestamp,
  input_octets bigint,
  output_octets bigint
);

CREATE INDEX IF NOT EXISTS idx_radius_accounting_username_start ON radius_accounting(username, session_start DESC);

-- =========================================================
-- 5) BILLING & PAYMENT DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  invoice_number varchar(80) NOT NULL UNIQUE,
  period date NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  status varchar(24) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamp,
  idempotency_key varchar(100),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_period ON invoices(customer_id, period);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_idempotency_key ON invoices(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  payment_method varchar(40) NOT NULL,
  amount numeric(14,2) NOT NULL,
  payment_date timestamp NOT NULL,
  reference_number varchar(120),
  received_by uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_payments_received_by FOREIGN KEY (received_by) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_reference_number ON payments(reference_number);

CREATE TABLE IF NOT EXISTS payment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  action varchar(100) NOT NULL,
  actor_user_id uuid,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_payment_audit_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_audit_actor FOREIGN KEY (actor_user_id) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS invoice_status_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  old_status varchar(24),
  new_status varchar(24) NOT NULL,
  changed_by uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoice_status_histories_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_status_histories_changed_by FOREIGN KEY (changed_by) REFERENCES admin_users(id)
);

-- =========================================================
-- 6) NETWORK DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS pops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(140) NOT NULL,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id uuid,
  name varchar(140) NOT NULL,
  device_type varchar(24) NOT NULL,
  vendor varchar(80),
  ip_address varchar(64) NOT NULL,
  snmp_community_encrypted varchar(255),
  status varchar(24) NOT NULL DEFAULT 'unknown',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_network_devices_pop FOREIGN KEY (pop_id) REFERENCES pops(id)
);

CREATE INDEX IF NOT EXISTS idx_network_devices_pop ON network_devices(pop_id);

CREATE TABLE IF NOT EXISTS network_interfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  name varchar(120) NOT NULL,
  interface_type varchar(40),
  status varchar(24),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_network_interfaces_device FOREIGN KEY (device_id) REFERENCES network_devices(id) ON DELETE CASCADE
);

-- =========================================================
-- 7) CUSTOMER CONNECTION DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS customer_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_service_id uuid NOT NULL,
  device_id uuid,
  interface_id uuid,
  vlan_id integer,
  ip_address varchar(64),
  mac_address varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer_connections_service FOREIGN KEY (customer_service_id) REFERENCES customer_services(id),
  CONSTRAINT fk_customer_connections_device FOREIGN KEY (device_id) REFERENCES network_devices(id),
  CONSTRAINT fk_customer_connections_interface FOREIGN KEY (interface_id) REFERENCES network_interfaces(id)
);

-- =========================================================
-- 8) TICKETING & FIELD OPERATION DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  phone varchar(30),
  status varchar(24) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  category varchar(60) NOT NULL,
  subject varchar(180) NOT NULL,
  description text,
  priority varchar(16),
  status varchar(24) NOT NULL,
  assigned_to uuid,
  sla_due_at timestamp,
  closed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES technicians(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer_status_created ON tickets(customer_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid,
  comment text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_ticket_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comments_user FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS ticket_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  action varchar(80) NOT NULL,
  actor_user_id uuid,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_ticket_histories_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_histories_actor FOREIGN KEY (actor_user_id) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS installation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  technician_id uuid,
  schedule_date date,
  status varchar(24) NOT NULL,
  notes text,
  photo_urls jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_installation_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_installation_jobs_technician FOREIGN KEY (technician_id) REFERENCES technicians(id)
);

-- =========================================================
-- 9) WA GATEWAY DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS wa_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  channel varchar(30) NOT NULL DEFAULT 'whatsapp',
  status varchar(24) NOT NULL DEFAULT 'open',
  assigned_agent_id uuid,
  last_message_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_wa_conversations_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_wa_conversations_agent FOREIGN KEY (assigned_agent_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_customer_last_message ON wa_conversations(customer_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  direction varchar(10) NOT NULL CHECK (direction IN ('inbound','outbound')),
  provider_message_id varchar(150),
  message_type varchar(30) NOT NULL DEFAULT 'text',
  content text,
  status varchar(24) NOT NULL,
  sent_at timestamp,
  delivered_at timestamp,
  read_at timestamp,
  failed_reason text,
  raw_payload jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_wa_messages_conversation FOREIGN KEY (conversation_id) REFERENCES wa_conversations(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_messages_provider_id ON wa_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation_created ON wa_messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wa_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code varchar(80) NOT NULL,
  language varchar(12) NOT NULL DEFAULT 'id',
  category varchar(40) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_wa_template_version UNIQUE (template_code, version),
  CONSTRAINT fk_wa_templates_approved_by FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS wa_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id uuid NOT NULL,
  event_type varchar(30) NOT NULL,
  payload jsonb,
  event_at timestamp NOT NULL,
  CONSTRAINT fk_wa_delivery_logs_message FOREIGN KEY (wa_message_id) REFERENCES wa_messages(id) ON DELETE CASCADE
);

-- =========================================================
-- 10) AI CS DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS ai_assist_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  ticket_id uuid,
  intent varchar(60),
  confidence numeric(5,4),
  prompt_hash varchar(128),
  response_text text,
  approved_by_agent boolean NOT NULL DEFAULT false,
  approved_by uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_ai_assist_logs_conversation FOREIGN KEY (conversation_id) REFERENCES wa_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_assist_logs_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  CONSTRAINT fk_ai_assist_logs_approved_by FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_assist_logs_conversation_created ON ai_assist_logs(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  content text NOT NULL,
  status varchar(24) NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_article_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_article_id uuid NOT NULL,
  embedding_vector vector(1536),
  model_name varchar(100) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_kb_embeddings_article FOREIGN KEY (kb_article_id) REFERENCES kb_articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kb_embeddings_article ON kb_article_embeddings(kb_article_id);

-- =========================================================
-- 11) MONITORING DOMAIN
-- =========================================================

CREATE TABLE IF NOT EXISTS device_metrics (
  id bigserial PRIMARY KEY,
  device_id uuid NOT NULL,
  cpu_usage numeric(5,2),
  memory_usage numeric(5,2),
  recorded_at timestamp NOT NULL,
  CONSTRAINT fk_device_metrics_device FOREIGN KEY (device_id) REFERENCES network_devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS traffic_metrics (
  id bigserial PRIMARY KEY,
  interface_id uuid NOT NULL,
  rx_bps bigint,
  tx_bps bigint,
  recorded_at timestamp NOT NULL,
  CONSTRAINT fk_traffic_metrics_interface FOREIGN KEY (interface_id) REFERENCES network_interfaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS device_status_logs (
  id bigserial PRIMARY KEY,
  device_id uuid NOT NULL,
  status varchar(24) NOT NULL,
  response_ms integer,
  checked_at timestamp NOT NULL,
  CONSTRAINT fk_device_status_logs_device FOREIGN KEY (device_id) REFERENCES network_devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_device_status_logs_device_checked ON device_status_logs(device_id, checked_at DESC);

COMMIT;

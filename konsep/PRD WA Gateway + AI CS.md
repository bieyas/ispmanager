# PRD WA Gateway + AI Customer Service (CS)

Dokumen turunan ini menjabarkan kebutuhan produk untuk modul WhatsApp Gateway dan CS AI Assistant.

Tanggal acuan: **6 Maret 2026**
Target implementasi awal: **Minggu 10-12 roadmap (11 Mei 2026 - 6 Juni 2026)**

---

# 1) Latar Belakang

Tim CS dan NOC membutuhkan kanal komunikasi yang cepat, terdokumentasi, dan dapat ditindaklanjuti otomatis.

Masalah saat ini (asumsi operasional umum ISP):
- Percakapan WhatsApp tersebar di banyak nomor/agent.
- Riwayat komunikasi tidak selalu terhubung ke data customer dan tiket.
- Agent CS menghabiskan waktu untuk balasan berulang (tagihan, gangguan, jadwal teknisi).

Solusi:
- WA Gateway terintegrasi ke sistem ISP Manager.
- AI CS Assistant sebagai copilot agent (bukan autopilot penuh).

---

# 2) Tujuan Produk

## Tujuan Bisnis

- Menurunkan waktu respons awal CS.
- Meningkatkan konsistensi jawaban CS.
- Meningkatkan traceability percakapan untuk audit operasional.

## Tujuan Teknis

- Semua pesan WA inbound/outbound tercatat, terhubung ke customer/ticket.
- Pengiriman pesan memiliki retry, idempotency, dan delivery tracking.
- AI membantu agent membuat draft balasan dan ringkasan percakapan/tiket.

## Non Tujuan (Fase Ini)

- Chatbot auto-send penuh tanpa persetujuan agent.
- Voice bot/call center AI.
- Omnichannel di luar WA (Telegram, email, Instagram DM).

---

# 3) Ruang Lingkup

## In Scope

- Inbound WA webhook dan parsing pesan.
- Outbound WA API untuk notifikasi dan balasan agent.
- Template pesan terstandar (billing, reminder, tiket, instalasi).
- Auto-link percakapan ke `customers` dan `tickets`.
- AI fitur: intent suggestion, suggested reply, ringkasan tiket/percakapan.
- Human approval wajib sebelum kirim balasan AI.

## Out of Scope

- Auto decision suspend/unsuspend berbasis AI.
- Auto closing ticket tanpa validasi agent.
- Personalization promosi AI lintas channel.

---

# 4) Persona & Use Case

## Persona

- Agent CS
- Supervisor CS
- NOC
- Customer akhir

## Use Case Prioritas

- Customer bertanya tagihan dan jatuh tempo.
- Customer lapor internet down/lambat.
- Customer menanyakan progres tiket/instalasi.
- Sistem mengirim reminder pembayaran + konfirmasi pembayaran diterima.

---

# 5) Requirement Fungsional

## A. WA Gateway

1. Inbound Message Handling
- Sistem menerima webhook pesan masuk.
- Validasi signature webhook.
- Deduplicate berdasarkan `provider_message_id`.
- Simpan raw payload untuk audit troubleshooting.

2. Message Routing
- Cari customer dari nomor WA (`customers.phone` atau `customer_contacts.phone`).
- Jika match, tautkan percakapan ke customer.
- Jika tidak match, buat status `unidentified` untuk triase CS.

3. Outbound Message
- Agent dapat kirim pesan manual dari UI CS.
- Sistem dapat kirim notifikasi template (billing/ticket/install).
- Gunakan job queue dengan retry exponential backoff.
- Simpan status kirim: queued, sent, delivered, read, failed.

4. Template Management
- CRUD template pesan oleh role supervisor/admin.
- Versioning template.
- Preview template sebelum publish.

5. Audit & Observability
- Semua aktivitas kirim/terima punya jejak user/system.
- Dashboard metrik WA: volume, success rate, latency, failure reason.

## B. AI CS Assistant (Copilot)

1. Intent Detection
- Deteksi intent dasar: `cek_tagihan`, `kendala_jaringan`, `status_tiket`, `jadwal_instalasi`, `permintaan_agent_manusia`.
- Tampilkan confidence score.

2. Suggested Reply
- Model memberi draft balasan berdasarkan konteks customer, tiket, dan billing.
- Tidak auto-send.
- Agent bisa edit sebelum kirim.

3. Ticket/Conversation Summary
- Ringkasan otomatis saat percakapan panjang.
- Ringkasan handover antar shift CS.

4. Knowledge Grounding
- AI hanya boleh merujuk knowledge base internal (`kb_articles`) dan data operasional sistem.
- Jika konteks tidak cukup, AI wajib memberi jawaban aman: meminta verifikasi/eskalasi agent.

5. Safety Controls
- PII masking pada prompt/log yang keluar dari boundary internal.
- Daftar intent terlarang: janji kompensasi finansial otomatis, keputusan terminasi layanan, perubahan paket tanpa otorisasi.

---

# 6) Requirement Non-Fungsional

- Ketersediaan WA Gateway (target internal): 99.5% pada jam operasional.
- P95 waktu proses inbound ke tampil di UI CS: <= 3 detik.
- P95 enqueue outbound ke provider accepted: <= 2 detik.
- Sistem idempotent untuk webhook ulang dan retry job.
- Semua endpoint kritikal memiliki rate limit.
- Enkripsi data sensitif at-rest dan in-transit.

---

# 7) Data Model Tambahan

Selaras dengan ERD saat ini, tambah tabel berikut:

- `wa_conversations`
  - id, customer_id (nullable), channel, status, last_message_at, created_at
- `wa_messages`
  - id, conversation_id, direction (inbound/outbound), provider_message_id, message_type, content, status, sent_at, delivered_at, read_at, failed_reason
- `wa_templates`
  - id, template_code, language, category, version, content, is_active, approved_by, approved_at
- `wa_delivery_logs`
  - id, wa_message_id, event_type, payload, event_at
- `ai_assist_logs`
  - id, conversation_id, ticket_id (nullable), intent, confidence, prompt_hash, response_text, approved_by_agent, created_at
- `kb_articles`
  - id, title, content, status, updated_at
- `kb_article_embeddings`
  - id, kb_article_id, embedding_vector, model_name, created_at

Index minimum:
- `wa_messages(provider_message_id)` unique
- `wa_messages(conversation_id, sent_at)`
- `wa_conversations(customer_id, last_message_at)`
- `ai_assist_logs(conversation_id, created_at)`

---

# 8) Alur Utama (Happy Path)

## Flow 1: Customer Tanya Tagihan via WA

1. Customer kirim pesan WA.
2. Webhook diterima, tervalidasi, dedupe sukses.
3. Sistem cocokkan customer berdasarkan nomor.
4. AI mendeteksi intent `cek_tagihan` dan membuat draft.
5. Agent review draft, edit seperlunya, lalu kirim.
6. Pesan outbound tercatat beserta status delivery.

## Flow 2: Laporan Gangguan Menjadi Tiket

1. Customer kirim keluhan gangguan.
2. AI mendeteksi `kendala_jaringan` + menyarankan template pertanyaan diagnosis.
3. Agent konfirmasi detail lalu klik `Buat Tiket`.
4. Sistem membuat record `tickets` dan link ke `wa_conversation`.
5. Update status tiket otomatis diinformasikan via template WA.

---

# 9) Guardrail & Kebijakan AI

- Human-in-the-loop: semua balasan AI wajib approval agent.
- Confidence threshold:
  - >= 0.80: tampilkan suggested reply penuh.
  - 0.60-0.79: tampilkan draft + peringatan verifikasi.
  - < 0.60: jangan beri jawaban final; minta eskalasi manual.
- AI dilarang memberi janji SLA/kompensasi di luar policy.
- AI dilarang meminta data sensitif yang tidak diperlukan.
- Semua interaksi AI tersimpan untuk audit dan evaluasi kualitas.

---

# 10) KPI & Metrik Keberhasilan

## KPI Operasional

- First Response Time CS turun minimal 30% (baseline vs pasca go-live).
- Persentase tiket dengan konteks lengkap saat handover naik minimal 40%.
- Template delivery success rate >= 98%.

## KPI Kualitas AI

- Suggested reply acceptance rate agent >= 50% di bulan pertama.
- Hallucination/incorrect critical response < 2% (hasil audit sampel).
- Escalation accuracy (intent butuh manusia) >= 95%.

## KPI Keandalan

- Webhook processing error rate < 1%.
- Job retry exhaustion < 0.5%.

---

# 11) Rencana Implementasi (Mengikuti Roadmap)

## Minggu 10 (11-17 Mei 2026)

- WA Gateway core: inbound/outbound, template, delivery tracking.
- UI percakapan CS + linking customer/ticket.
- UAT awal dengan 1 nomor WA operasional.

## Minggu 11 (18-24 Mei 2026)

- AI CS v1: intent + suggested reply + summary.
- Guardrail, confidence threshold, dan audit log AI.
- UAT agent CS shift pagi/sore.

## Minggu 12 (25 Mei-6 Juni 2026)

- Pilot terbatas ke subset customer.
- Quality gate 100 percakapan pertama.
- Perbaikan cepat, final readiness, dan dokumentasi SOP.

---

# 12) Risiko & Mitigasi

- Kegagalan provider WA / rate limit tinggi
  - Mitigasi: retry queue, failover nomor/provider, circuit breaker.

- Salah klasifikasi intent AI
  - Mitigasi: threshold, fallback manual, retraining berbasis log.

- Jawaban AI tidak sesuai kebijakan
  - Mitigasi: policy prompt ketat, red-team test, approval wajib.

- Integrasi data customer/ticket tidak konsisten
  - Mitigasi: validasi nomor standar E.164, data cleanup, referential checks.

---

# 13) Acceptance Criteria Go-Live

- [ ] WA inbound/outbound stabil di staging dan production pilot.
- [ ] Delivery/read status tercatat konsisten minimal 7 hari.
- [ ] Agent dapat menggunakan suggested reply dan summary tanpa blocking issue.
- [ ] Tidak ada incident severity tinggi dari modul WA/AI selama pilot 1 minggu.
- [ ] SOP CS untuk WA + AI disetujui supervisor dan dipakai saat shift.

---

# 14) Open Questions (Harus Diputuskan)

- Provider WA yang dipilih dan SLA resmi yang dijanjikan.
- Batas jam layanan CS (untuk auto-reply di luar jam kerja).
- Kebijakan kompensasi yang boleh disebut oleh agent/AI.
- Bahasa yang didukung saat fase awal (Indonesia saja atau bilingual).
- Retensi data chat untuk kebutuhan audit/legal.

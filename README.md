# ISP Manager

Baseline repository untuk pengembangan platform ISP Manager.

## Struktur

- `backend/` : layanan API dan worker
- `frontend/` : aplikasi web admin
- `infra/` : artifact infrastruktur lokal/deploy
- `konsep/` : dokumen produk, arsitektur, ERD, roadmap

## Dokumen Acuan

- `konsep/Roadmap & Checklist Pengembangan Aplikasi ISP Manager.md`
- `konsep/Backend Architecture v1 ISP Manager.md`
- `konsep/Frontend Architecture v1 ISP Manager.md`
- `konsep/ERD ISP Manager (Production Scale).md`
- `konsep/DDL v1 ISP Manager.sql`
- `konsep/Kickoff Execution Plan (Stack Owner Workflow).md`
- `konsep/Sprint 1-2 Task Assignment (Fullstack + Codex).md`

## Quality Gate

- Workflow CI: `.github/workflows/ci.yml`
- Local checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test`

## Aturan Umum

- Gunakan pendekatan modular monolith (microservice-ready).
- Dilarang direct table access lintas domain di layer repository.
- Perubahan lintas domain wajib lewat contract API/event.
# ispmanager

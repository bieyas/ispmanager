.PHONY: dev backend frontend build lint typecheck

dev:
	npm run dev:all

backend:
	npm run dev:backend

frontend:
	npm run dev:frontend

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

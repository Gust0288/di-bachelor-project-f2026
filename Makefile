.PHONY: help install up up-build down dev test test-backend test-db venv lint format typecheck db-init

VENV = backend/.venv/bin

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Installer afhængigheder (frontend + backend)
	cd frontend && npm ci
	cd backend && pip install -r requirements.txt

up: ## Start Docker-stack (backend + db)
	docker-compose up

up-build: ## Start Docker-stack og byg images
	docker-compose up --build

down: ## Stop Docker-stack
	docker-compose down

dev: ## Start frontend dev-server (Vite, :5173)
	cd frontend && npm run dev

test: ## Kør frontend-tests (Jest)
	cd frontend && npm test

test-backend: ## Kør backend integration + DB persistenstests
	cd backend && $(CURDIR)/$(VENV)/python -m pytest tests/test_wizard_flow.py -v

test-db: ## Kør kun DB persistenstests
	cd backend && $(CURDIR)/$(VENV)/python -m pytest tests/test_wizard_flow.py::TestDatabasePersistence -v

venv: ## Vis kommando til at aktivere Python venv
	@echo "Kør i din terminal:"
	@echo ""
	@echo "  source $(CURDIR)/$(VENV)/activate"
	@echo ""

lint: ## Kør linters (ESLint + Flake8)
	cd frontend && npm run lint
	flake8 --max-line-length=88 backend/

format: ## Formatér backend-kode (Black)
	black backend/

typecheck: ## TypeScript type-check (ingen output)
	cd frontend && npx tsc --noEmit

db-init: ## Initialisér databaseskema
	cd backend && python -m app.core.database

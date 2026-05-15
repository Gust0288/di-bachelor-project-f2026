.PHONY: help install up up-build down dev test test-frontend test-wizard test-backend test-db venv lint format typecheck db-init

ifeq ($(OS),Windows_NT)
PYTHON := backend/.venv/Scripts/python.exe
ACTIVATE := backend\.venv\Scripts\activate
else
PYTHON := backend/.venv/bin/python
ACTIVATE := source backend/.venv/bin/activate
endif

help:
	@echo Available targets:
	@echo   make install       Installer afhaengigheder
	@echo   make up            Start Docker-stack
	@echo   make up-build      Start Docker-stack og byg images
	@echo   make down          Stop Docker-stack
	@echo   make dev           Start frontend dev-server
	@echo   make test          Koer alle frontend-tests
	@echo   make test-frontend Koer frontend-tests
	@echo   make test-wizard   Koer WizardPage frontend-tests
	@echo   make test-backend  Koer backend integrationstests
	@echo   make test-db       Koer DB persistenstests
	@echo   make venv          Opret venv og vis aktivering
	@echo   make lint          Koer linters
	@echo   make format        Formater backend-kode
	@echo   make typecheck     Koer TypeScript type-check
	@echo   make db-init       Initialiser databaseskema

install:
	cd frontend && npm ci
	python -m venv backend/.venv
	"$(PYTHON)" -m pip install -r backend/requirements.txt

up:
	docker compose up

up-build:
	docker compose up --build

down:
	docker compose down

dev:
	cd frontend && npm run dev

test: test-frontend

test-frontend:
	cd frontend && npm run test:ci

test-wizard:
	cd frontend && npm run test:wizard

test-backend:
	"$(PYTHON)" -m pytest backend/tests/test_wizard_flow.py -v

test-db:
	"$(PYTHON)" -m pytest backend/tests/test_wizard_flow.py::TestDatabasePersistence -v

venv:
	python -m venv backend/.venv
	"$(PYTHON)" -m pip install -r backend/requirements.txt
	@echo Koer i din terminal:
	@echo   $(ACTIVATE)

lint:
	cd frontend && npm run lint
	cd backend && "../$(PYTHON)" -m flake8 .

format:
	"$(PYTHON)" -m black backend

typecheck:
	cd frontend && npx tsc --noEmit

db-init:
	cd backend && "../$(PYTHON)" -m app.core.database

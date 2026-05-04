-- Migration 001: Wizard flow additions
-- Adds flags and tier columns to registration_sessions,
-- and updates uploaded_documents to support session-based uploads.

ALTER TABLE registration_sessions
    ADD COLUMN IF NOT EXISTS flags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE registration_sessions
    ADD COLUMN IF NOT EXISTS tier TEXT
    CHECK (tier IN ('mikro', 'smv', 'erhverv') OR tier IS NULL);

ALTER TABLE uploaded_documents
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES registration_sessions(id) ON DELETE CASCADE;

ALTER TABLE uploaded_documents
    ALTER COLUMN registration_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_session_documents_session_id
    ON uploaded_documents(session_id);

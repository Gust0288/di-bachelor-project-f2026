-- Migration 005: Email verification codes (2026-05-15)
CREATE TABLE IF NOT EXISTS email_verification_codes (
    email       TEXT        PRIMARY KEY,
    code        VARCHAR(6)  NOT NULL,
    step_data   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

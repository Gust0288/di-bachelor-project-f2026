ALTER TABLE registration_sessions
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

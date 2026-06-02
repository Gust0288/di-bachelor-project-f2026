CREATE TABLE IF NOT EXISTS registration_edits (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID       NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    admin_id       UUID        REFERENCES admins(id) ON DELETE SET NULL,
    admin_name     TEXT        NOT NULL,
    changed_fields JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_edits_registration_id
    ON registration_edits (registration_id);

CREATE INDEX IF NOT EXISTS idx_registration_edits_created_at
    ON registration_edits (created_at DESC);

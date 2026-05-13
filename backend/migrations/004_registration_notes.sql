CREATE TABLE IF NOT EXISTS registration_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id),
  admin_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_notes_reg_id ON registration_notes(registration_id);

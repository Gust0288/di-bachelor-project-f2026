-- Slet duplikerede CVR-registreringer, behold den nyeste per CVR
DELETE FROM registrations
WHERE id NOT IN (
    SELECT DISTINCT ON (cvr_number) id
    FROM registrations
    ORDER BY cvr_number, created_at DESC
);

-- Tilføj UNIQUE constraint hvis den ikke allerede eksisterer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registrations_cvr_number_key'
    ) THEN
        ALTER TABLE registrations ADD CONSTRAINT registrations_cvr_number_key UNIQUE (cvr_number);
    END IF;
END $$;

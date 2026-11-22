-- ATH / AnyStuff: PRIVATE STAGING ONLY.
-- Apply ONLY in a dedicated ATH Supabase project, never in the user's other projects.
-- The raw Firestore REST document, including typed field values, is preserved for audit.
BEGIN;

CREATE SCHEMA IF NOT EXISTS ath;
COMMENT ON SCHEMA ath IS 'ATH private data migration staging; NOT exposed via Data API';
REVOKE ALL ON SCHEMA ath FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS ath.migration_batches (
 batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_project text NOT NULL CHECK (source_project = 'nutrio-app-jarvis-2025'),
 import_label text NOT NULL,
 source_snapshot_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 notes text
);

CREATE TABLE IF NOT EXISTS ath.firestore_documents (
 source_project text NOT NULL DEFAULT 'nutrio-app-jarvis-2025'
   CHECK (source_project = 'nutrio-app-jarvis-2025'),
 firestore_path text NOT NULL CHECK (firestore_path <> ''),
 collection_path text NOT NULL,
 document_id text NOT NULL CHECK (document_id <> ''),
 firestore_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
 raw_firestore_document jsonb NOT NULL,
 firestore_create_time timestamptz,
 firestore_update_time timestamptz,
 imported_at timestamptz NOT NULL DEFAULT now(),
 batch_id uuid REFERENCES ath.migration_batches(batch_id) ON DELETE RESTRICT,
 PRIMARY KEY (source_project, firestore_path)
);
CREATE INDEX IF NOT EXISTS ath_firestore_collection_idx ON ath.firestore_documents(collection_path);
CREATE INDEX IF NOT EXISTS ath_firestore_fields_idx ON ath.firestore_documents USING gin(firestore_fields);

CREATE TABLE IF NOT EXISTS ath.allowed_students (
 email text PRIMARY KEY CHECK (email = lower(email) AND email ~ '^[^@ ]+@[^@ ]+$'),
 firestore_path text UNIQUE,
 status text,
 active boolean,
 student_class text,
 attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ath.contacts (
 firestore_path text PRIMARY KEY,
 name text,
 email text,
 interest text,
 message text,
 source text,
 status text,
 language text,
 source_created_at timestamptz,
 imported_at timestamptz NOT NULL DEFAULT now(),
 attributes jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS ath.letters (
 firestore_path text PRIMARY KEY,
 content text,
 is_anonymous boolean,
 source text,
 status text,
 language text,
 source_created_at timestamptz,
 imported_at timestamptz NOT NULL DEFAULT now(),
 attributes jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Defense in depth; none of these private tables has anon/auth access.
ALTER TABLE ath.migration_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ath.firestore_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ath.allowed_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ath.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ath.letters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA ath FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ath REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
-- Deliberately no RLS policies. Server-only importer to be built after source inventory.
COMMIT;
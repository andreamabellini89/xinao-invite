-- ============================================================
-- XINAO INVITE — Registration System Migration
-- Run this in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Add event_number to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_number TEXT;

-- Create unique index (allows null but enforces uniqueness when set)
CREATE UNIQUE INDEX IF NOT EXISTS events_event_number_idx 
ON events(event_number) WHERE event_number IS NOT NULL;

-- 2. Create registration_requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     TEXT,
  guest_id        UUID REFERENCES guests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requests_event_id ON registration_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_requests_status   ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_email    ON registration_requests(email);

-- Updated_at trigger
CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON registration_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert requests"  ON registration_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read requests"    ON registration_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated can update"    ON registration_requests FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete"    ON registration_requests FOR DELETE USING (true);

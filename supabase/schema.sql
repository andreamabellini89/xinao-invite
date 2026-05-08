-- ============================================================
-- XINAO INVITE SYSTEM — Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── EVENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  subtitle        TEXT,
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  location        TEXT NOT NULL,
  address         TEXT,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'active', 'past')),
  cover_image_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── GUESTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  email           TEXT,
  phone           TEXT,
  guest_token     UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  qr_token        UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  status          TEXT NOT NULL DEFAULT 'invited'
                    CHECK (status IN ('invited', 'registered', 'checked-in')),
  registered_at   TIMESTAMPTZ,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, email)
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guests_event_id     ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_guest_token  ON guests(guest_token);
CREATE INDEX IF NOT EXISTS idx_guests_qr_token     ON guests(qr_token);
CREATE INDEX IF NOT EXISTS idx_guests_status       ON guests(status);

-- ── STORAGE BUCKET ───────────────────────────────────────────
-- Run in Supabase Dashboard > Storage > New bucket
-- Name: event-images
-- Public: YES
-- (or run the SQL below)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT DO NOTHING;

-- ── STORAGE POLICIES ─────────────────────────────────────────
CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Anyone can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Anyone can update event images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-images');

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Events: public read, authenticated write
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read events"   ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated can write"  ON events FOR ALL USING (true);

-- Guests: public read by token, authenticated full access
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read guests"   ON guests FOR SELECT USING (true);
CREATE POLICY "Public can update guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "Authenticated can insert" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can delete" ON guests FOR DELETE USING (true);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SEED DATA (optional demo) ─────────────────────────────────
INSERT INTO events (id, name, subtitle, date, time, location, address, description, status)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Threads of Connection', '35th Anniversary',
   '24 JUNE 2026', '8:00 PM',
   'GIARDINO CORSINI', 'VIA DELLA SCALA 115, FLORENCE, ITALY',
   'Art · Yarn · Nature · Contemporary Culture', 'upcoming'),
  ('00000000-0000-0000-0000-000000000002',
   'Native Soul Collection', 'Winter Preview 2026',
   '15 SEPTEMBER 2026', '7:30 PM',
   'PALAZZO STROZZI', 'PIAZZA DEGLI STROZZI, FLORENCE, ITALY',
   'Cashmere · Heritage · Innovation', 'upcoming')
ON CONFLICT DO NOTHING;

INSERT INTO guests (event_id, first_name, last_name, email, guest_token, qr_token, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'James',      'Richardson', 'j.rich@sothebys.com',      uuid_generate_v4(), uuid_generate_v4(), 'invited'),
  ('00000000-0000-0000-0000-000000000001', 'Elena',      'Vasquez',    'e.vasquez@hermes.fr',       uuid_generate_v4(), uuid_generate_v4(), 'invited'),
  ('00000000-0000-0000-0000-000000000001', 'Marco',      'Conti',      'm.conti@luxfashion.it',     uuid_generate_v4(), uuid_generate_v4(), 'invited'),
  ('00000000-0000-0000-0000-000000000001', 'Charlotte',  'Dubois',     'c.dubois@lvmh.fr',          uuid_generate_v4(), uuid_generate_v4(), 'invited'),
  ('00000000-0000-0000-0000-000000000002', 'Alessandro', 'Ferrari',    'a.ferrari@maxmara.com',     uuid_generate_v4(), uuid_generate_v4(), 'invited'),
  ('00000000-0000-0000-0000-000000000002', 'Yuki',       'Tanaka',     'y.tanaka@isseymiyake.jp',   uuid_generate_v4(), uuid_generate_v4(), 'invited')
ON CONFLICT DO NOTHING;

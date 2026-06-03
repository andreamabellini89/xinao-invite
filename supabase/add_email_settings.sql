-- ============================================================
-- MIGRAZIONE: aggiunge email_copy e agenda alla tabella events
-- Esegui in Supabase Dashboard > SQL Editor > New query
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS email_copy JSONB,
  ADD COLUMN IF NOT EXISTS agenda     JSONB;

-- Valori di default per gli eventi già esistenti
UPDATE events
SET email_copy = '{
  "invited_to_en": "You have been personally invited to",
  "invited_to_zh": "您荣幸地受邀出席",
  "confirm_en":    "Please confirm your attendance to receive your personal invitation with unique QR code.",
  "confirm_zh":    "请确认您的出席，以收到您专属的邀请函及二维码。"
}'::jsonb
WHERE email_copy IS NULL;

UPDATE events
SET agenda = '[]'::jsonb
WHERE agenda IS NULL;

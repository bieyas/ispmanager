-- Fix default PPP profile ID to UUID v4 format for API ParseUUIDPipe(v4)
UPDATE "ppp_profiles"
SET "id" = '11111111-1111-4111-8111-111111111111'
WHERE "id" = '00000000-0000-0000-0000-000000000001';

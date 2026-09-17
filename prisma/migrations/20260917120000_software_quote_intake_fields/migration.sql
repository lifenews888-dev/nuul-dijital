-- Intake fields for software licence enquiries.
--
-- Every column is nullable and none carries a default, so this is a catalogue
-- change only: Postgres does not rewrite the table and does not hold a long
-- lock. Existing rows keep working, and the admin screens treat a missing
-- value as "not asked" rather than as an empty answer.
--
-- IF NOT EXISTS because these columns were added to production by hand before
-- this file existed. Without it, replaying the history onto that database
-- would stop here with "column already exists"; with it, the statement is a
-- no-op there and still creates the columns on a fresh database.

-- AlterTable
ALTER TABLE "SoftwareQuote"
  ADD COLUMN IF NOT EXISTS "purchaseType" TEXT,
  ADD COLUMN IF NOT EXISTS "existingLicense" TEXT,
  ADD COLUMN IF NOT EXISTS "position" TEXT,
  ADD COLUMN IF NOT EXISTS "neededBy" TEXT,
  ADD COLUMN IF NOT EXISTS "procurement" TEXT;

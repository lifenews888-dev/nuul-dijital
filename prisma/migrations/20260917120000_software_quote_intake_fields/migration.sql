-- Intake fields for software licence enquiries.
--
-- Every column is nullable and none carries a default, so this is a catalogue
-- change only: Postgres does not rewrite the table and does not hold a long
-- lock. Existing rows keep working, and the admin screens treat a missing
-- value as "not asked" rather than as an empty answer.

-- AlterTable
ALTER TABLE "SoftwareQuote" ADD COLUMN     "purchaseType" TEXT,
ADD COLUMN     "existingLicense" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "neededBy" TEXT,
ADD COLUMN     "procurement" TEXT;

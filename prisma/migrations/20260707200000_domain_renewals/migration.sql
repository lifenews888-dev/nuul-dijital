-- Domain renewal checkout: link renewal orders to the original registration.

ALTER TABLE "DomainOrder" ADD COLUMN IF NOT EXISTS "renewalSourceOrderId" TEXT;

ALTER TABLE "DomainOrder" DROP CONSTRAINT IF EXISTS "DomainOrder_renewalSourceOrderId_fkey";
ALTER TABLE "DomainOrder"
  ADD CONSTRAINT "DomainOrder_renewalSourceOrderId_fkey"
  FOREIGN KEY ("renewalSourceOrderId") REFERENCES "DomainOrder"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "DomainOrder_renewalSourceOrderId_idx"
  ON "DomainOrder"("renewalSourceOrderId");

-- Registration uniqueness only (exclude renewals and COMPLETED).
DROP INDEX IF EXISTS "DomainOrder_active_domain_unique";
CREATE UNIQUE INDEX "DomainOrder_active_domain_unique"
  ON "DomainOrder" ("domainName")
  WHERE status IN ('PENDING_PAYMENT', 'PAID', 'FULFILLING')
    AND "renewalSourceOrderId" IS NULL;
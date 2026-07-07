-- Domains module: partial unique index for active domain reservations.
-- Prisma cannot express partial indexes natively — apply after `prisma db push` or migrate.
-- Prevents two concurrent checkouts for the same domainName while order is active.

CREATE UNIQUE INDEX IF NOT EXISTS "DomainOrder_active_domain_unique"
ON "DomainOrder" ("domainName")
WHERE status IN ('PENDING_PAYMENT', 'PAID', 'FULFILLING', 'COMPLETED');
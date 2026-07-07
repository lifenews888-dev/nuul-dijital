-- Service orders (hosting & email) + polymorphic Payment linkage

CREATE TYPE "ServiceType" AS ENUM ('HOSTING', 'EMAIL');

CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "planKey" TEXT NOT NULL,
    "domainName" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "billingMonths" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'MNT',
    "status" "DomainOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "company" TEXT,
    "userId" TEXT,
    "leadId" TEXT,
    "journeyId" TEXT,
    "provisionedAt" TIMESTAMP(3),
    "provisionedById" TEXT,
    "adminNotes" TEXT,
    "provisionDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOrder_orderNumber_key" ON "ServiceOrder"("orderNumber");
CREATE INDEX "ServiceOrder_status_createdAt_idx" ON "ServiceOrder"("status", "createdAt");
CREATE INDEX "ServiceOrder_customerEmail_idx" ON "ServiceOrder"("customerEmail");
CREATE INDEX "ServiceOrder_serviceType_idx" ON "ServiceOrder"("serviceType");
CREATE INDEX "ServiceOrder_domainName_idx" ON "ServiceOrder"("domainName");

ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "OnboardingJourney"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_provisionedById_fkey" FOREIGN KEY ("provisionedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ALTER COLUMN "domainOrderId" DROP NOT NULL;

ALTER TABLE "Payment" ADD COLUMN "serviceOrderId" TEXT;
CREATE UNIQUE INDEX "Payment_serviceOrderId_key" ON "Payment"("serviceOrderId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
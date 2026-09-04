-- CreateTable
CREATE TABLE "SoftwareQuote" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "regNumber" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vendor" TEXT,
    "products" TEXT NOT NULL,
    "seats" INTEGER,
    "term" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoftwareQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoftwareQuote_status_createdAt_idx" ON "SoftwareQuote"("status", "createdAt");


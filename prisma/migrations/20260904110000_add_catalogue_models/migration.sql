-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "deliverables" TEXT[],
    "icon" TEXT NOT NULL,
    "accent" TEXT,
    "image" TEXT,
    "gallery" TEXT[],
    "videoUrl" TEXT,
    "priceMnt" INTEGER,
    "priceNote" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareVendor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "products" TEXT[],
    "editions" TEXT[],
    "audience" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "accent" TEXT,
    "image" TEXT,
    "gallery" TEXT[],
    "videoUrl" TEXT,
    "priceMnt" INTEGER,
    "priceNote" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VendorCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VendorCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_active_order_idx" ON "Service"("active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareVendor_slug_key" ON "SoftwareVendor"("slug");

-- CreateIndex
CREATE INDEX "SoftwareVendor_active_priority_idx" ON "SoftwareVendor"("active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareCategory_slug_key" ON "SoftwareCategory"("slug");

-- CreateIndex
CREATE INDEX "SoftwareCategory_active_group_order_idx" ON "SoftwareCategory"("active", "group", "order");

-- CreateIndex
CREATE INDEX "_VendorCategories_B_index" ON "_VendorCategories"("B");

-- AddForeignKey
ALTER TABLE "_VendorCategories" ADD CONSTRAINT "_VendorCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "SoftwareCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorCategories" ADD CONSTRAINT "_VendorCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "SoftwareVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;


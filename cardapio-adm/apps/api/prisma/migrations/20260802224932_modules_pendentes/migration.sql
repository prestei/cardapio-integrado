-- CreateEnum
CREATE TYPE "DeliveryZoneType" AS ENUM ('NEIGHBORHOOD', 'REGION', 'ZIP', 'RADIUS');

-- CreateEnum
CREATE TYPE "StatusChangeSource" AS ENUM ('PANEL', 'SYSTEM', 'CUSTOMER', 'API');

-- CreateEnum
CREATE TYPE "QrCodeKind" AS ENUM ('MENU', 'TABLE', 'COUNTER', 'SHOWCASE', 'SOCIAL');

-- AlterEnum
ALTER TYPE "CouponType" ADD VALUE 'FREE_DELIVERY';

-- DropIndex
DROP INDEX "BusinessHours_establishmentId_dayOfWeek_key";

-- AlterTable
ALTER TABLE "Additional" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "AdditionalGroup" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "BusinessHours" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "perCustomerLimit" INTEGER;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "DeliveryZone" ADD COLUMN     "minOrderValue" DECIMAL(10,2),
ADD COLUMN     "radiusKm" DECIMAL(5,2),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zipPrefix" TEXT,
ADD COLUMN     "zoneType" "DeliveryZoneType" NOT NULL DEFAULT 'NEIGHBORHOOD';

-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#F2A94A',
ADD COLUMN     "city" TEXT,
ADD COLUMN     "closedReason" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedDeliveryUserId" TEXT,
ADD COLUMN     "deliveryCompletedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryLeftAt" TIMESTAMP(3),
ADD COLUMN     "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductAdditionalGroup" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "acceptDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptDineIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptPickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowScheduledOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellationPolicy" TEXT,
ADD COLUMN     "deliveryPolicy" TEXT,
ADD COLUMN     "extraInfo" TEXT,
ADD COLUMN     "minOrderDelivery" DECIMAL(10,2),
ADD COLUMN     "minOrderMessage" TEXT,
ADD COLUMN     "privacyPolicy" TEXT,
ADD COLUMN     "scheduleMinLeadMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "termsOfUse" TEXT;

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "userId" TEXT,
    "source" "StatusChangeSource" NOT NULL DEFAULT 'SYSTEM',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "QrCodeKind" NOT NULL DEFAULT 'MENU',
    "targetPath" TEXT NOT NULL DEFAULT '',
    "tableLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_establishmentId_idx" ON "OrderStatusHistory"("establishmentId");

-- CreateIndex
CREATE INDEX "QrCode_establishmentId_idx" ON "QrCode"("establishmentId");

-- CreateIndex
CREATE INDEX "BusinessHours_establishmentId_dayOfWeek_idx" ON "BusinessHours"("establishmentId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Order_assignedDeliveryUserId_idx" ON "Order"("assignedDeliveryUserId");

-- CreateIndex
CREATE INDEX "ProductAdditionalGroup_additionalGroupId_idx" ON "ProductAdditionalGroup"("additionalGroupId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedDeliveryUserId_fkey" FOREIGN KEY ("assignedDeliveryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_landlordId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_tenantId_fkey";

-- DropIndex
DROP INDEX "conversations_landlordId_idx";

-- DropIndex
DROP INDEX "conversations_listingId_tenantId_key";

-- DropIndex
DROP INDEX "conversations_tenantId_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "landlordId",
DROP COLUMN "tenantId",
ADD COLUMN     "budgetMatched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "acceptancePrice" INTEGER,
ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "energyClass" TEXT,
ADD COLUMN     "floorPlanDescription" TEXT,
ADD COLUMN     "lotSize" INTEGER,
ADD COLUMN     "monthlyFee" INTEGER,
ADD COLUMN     "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyLevel" JSONB,
ADD COLUMN     "propertyType" TEXT NOT NULL DEFAULT 'lagenhet',
ADD COLUMN     "rooms" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "yearBuilt" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bankIdPersonalNumber" TEXT,
ADD COLUMN     "bankIdVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBuyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStripeId" TEXT,
ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
ALTER COLUMN "role" SET DEFAULT 'buyer';

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "listingId" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_clients" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Min sökning',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "propertyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minSize" INTEGER,
    "maxSize" INTEGER,
    "minRooms" INTEGER,
    "maxRooms" INTEGER,
    "minLotSize" INTEGER,
    "maxLotSize" INTEGER,
    "condition" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_intents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewing_bookings" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "videoLink" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewing_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "price" INTEGER,
    "notes" TEXT,
    "metadata" JSONB,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_listingId_type_createdAt_idx" ON "events"("listingId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "events_type_createdAt_idx" ON "events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "agent_clients_agentId_idx" ON "agent_clients"("agentId");

-- CreateIndex
CREATE INDEX "agent_clients_clientId_idx" ON "agent_clients"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_clients_agentId_clientId_key" ON "agent_clients"("agentId", "clientId");

-- CreateIndex
CREATE INDEX "buyer_profiles_userId_idx" ON "buyer_profiles"("userId");

-- CreateIndex
CREATE INDEX "buyer_profiles_active_idx" ON "buyer_profiles"("active");

-- CreateIndex
CREATE INDEX "budget_intents_userId_idx" ON "budget_intents"("userId");

-- CreateIndex
CREATE INDEX "budget_intents_listingId_idx" ON "budget_intents"("listingId");

-- CreateIndex
CREATE INDEX "budget_intents_matched_idx" ON "budget_intents"("matched");

-- CreateIndex
CREATE UNIQUE INDEX "budget_intents_userId_listingId_key" ON "budget_intents"("userId", "listingId");

-- CreateIndex
CREATE INDEX "matches_userId_idx" ON "matches"("userId");

-- CreateIndex
CREATE INDEX "matches_listingId_idx" ON "matches"("listingId");

-- CreateIndex
CREATE INDEX "matches_seen_idx" ON "matches"("seen");

-- CreateIndex
CREATE INDEX "matches_createdAt_idx" ON "matches"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "matches_buyerProfileId_listingId_key" ON "matches"("buyerProfileId", "listingId");

-- CreateIndex
CREATE INDEX "viewing_bookings_listingId_idx" ON "viewing_bookings"("listingId");

-- CreateIndex
CREATE INDEX "viewing_bookings_userId_idx" ON "viewing_bookings"("userId");

-- CreateIndex
CREATE INDEX "viewing_bookings_status_idx" ON "viewing_bookings"("status");

-- CreateIndex
CREATE INDEX "viewing_bookings_scheduledAt_idx" ON "viewing_bookings"("scheduledAt");

-- CreateIndex
CREATE INDEX "service_orders_userId_idx" ON "service_orders"("userId");

-- CreateIndex
CREATE INDEX "service_orders_listingId_idx" ON "service_orders"("listingId");

-- CreateIndex
CREATE INDEX "service_orders_type_idx" ON "service_orders"("type");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "conversations_sellerId_idx" ON "conversations"("sellerId");

-- CreateIndex
CREATE INDEX "conversations_buyerId_idx" ON "conversations"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listingId_buyerId_key" ON "conversations"("listingId", "buyerId");

-- CreateIndex
CREATE INDEX "listings_propertyType_idx" ON "listings"("propertyType");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_rooms_idx" ON "listings"("rooms");

-- CreateIndex
CREATE INDEX "listings_city_type_idx" ON "listings"("city", "type");

-- CreateIndex
CREATE INDEX "listings_city_propertyType_idx" ON "listings"("city", "propertyType");

-- CreateIndex
CREATE INDEX "listings_city_category_idx" ON "listings"("city", "category");

-- CreateIndex
CREATE INDEX "listings_type_category_idx" ON "listings"("type", "category");

-- CreateIndex
CREATE INDEX "listings_city_type_price_idx" ON "listings"("city", "type", "price");

-- CreateIndex
CREATE INDEX "listings_ownerId_createdAt_idx" ON "listings"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "listings_stripeStatus_idx" ON "listings"("stripeStatus");

-- CreateIndex
CREATE INDEX "listings_agentId_idx" ON "listings"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscriptionStripeId_key" ON "users"("subscriptionStripeId");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_clients" ADD CONSTRAINT "agent_clients_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_clients" ADD CONSTRAINT "agent_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_intents" ADD CONSTRAINT "budget_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_intents" ADD CONSTRAINT "budget_intents_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_bookings" ADD CONSTRAINT "viewing_bookings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_bookings" ADD CONSTRAINT "viewing_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "listings" ADD COLUMN "stripeStatus" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "listings" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "listings" ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "listings_stripeSubscriptionId_key" ON "listings"("stripeSubscriptionId");

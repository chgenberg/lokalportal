-- Add viewCount to listings for dashboard analytics
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

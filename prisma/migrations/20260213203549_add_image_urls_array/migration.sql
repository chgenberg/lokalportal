-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

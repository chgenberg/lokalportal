-- AlterTable: conversations listingId -> ON DELETE CASCADE
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_listingId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: conversations landlordId -> ON DELETE CASCADE
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_landlordId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: conversations tenantId -> ON DELETE CASCADE
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_tenantId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: messages conversationId -> ON DELETE CASCADE
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_conversationId_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: messages senderId -> ON DELETE CASCADE
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_senderId_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: favorites userId -> ON DELETE CASCADE
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_userId_fkey";
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: favorites listingId -> ON DELETE CASCADE
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_listingId_fkey";
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

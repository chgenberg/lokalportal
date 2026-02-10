-- Add message file attachment columns if missing (e.g. DB created from init only)
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "fileMimeType" TEXT;

-- Add indexes if missing
CREATE INDEX IF NOT EXISTS "listings_price_idx" ON "listings"("price");
CREATE INDEX IF NOT EXISTS "listings_size_idx" ON "listings"("size");
CREATE INDEX IF NOT EXISTS "listings_createdAt_idx" ON "listings"("createdAt");
CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "messages_read_idx" ON "messages"("read");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

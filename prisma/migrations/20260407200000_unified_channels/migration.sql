-- DropTable
DROP TABLE IF EXISTS "WhatsAppInstance" CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Channel" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "config" JSONB,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "welcomeMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "channelId" INTEGER;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "contactAvatar" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unread" INTEGER NOT NULL DEFAULT 0;

-- Update existing data
UPDATE "Conversation" SET "contactId" = "contactPhone" WHERE "contactId" IS NULL;
UPDATE "Conversation" SET "channelId" = 0 WHERE "channelId" IS NULL;

-- Drop old columns and constraints
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_instanceId_contactPhone_key";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "instanceId";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "contactPhone";

-- Add new constraint
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelId_contactId_key" UNIQUE ("channelId", "contactId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

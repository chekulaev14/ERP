-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LEFT', 'RIGHT', 'NONE');

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "base_item_id" TEXT,
ADD COLUMN     "side" "Side" NOT NULL DEFAULT 'NONE';

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_base_item_id_fkey" FOREIGN KEY ("base_item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

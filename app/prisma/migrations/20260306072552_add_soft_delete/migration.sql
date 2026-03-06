-- AlterTable
ALTER TABLE "items" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "items_deleted_at_idx" ON "items"("deleted_at");

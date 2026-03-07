-- CreateEnum
CREATE TYPE "InventoryOperationType" AS ENUM ('SUPPLIER_RECEIPT', 'ASSEMBLY', 'ORDER_COMPLETION', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "from_location_id" TEXT,
ADD COLUMN     "operation_id" TEXT,
ADD COLUMN     "to_location_id" TEXT;

-- CreateTable
CREATE TABLE "inventory_operations" (
    "id" TEXT NOT NULL,
    "operation_key" TEXT NOT NULL,
    "type" "InventoryOperationType" NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_operations_operation_key_key" ON "inventory_operations"("operation_key");

-- CreateIndex
CREATE INDEX "inventory_operations_type_created_at_idx" ON "inventory_operations"("type", "created_at");

-- AddForeignKey
ALTER TABLE "inventory_operations" ADD CONSTRAINT "inventory_operations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "inventory_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

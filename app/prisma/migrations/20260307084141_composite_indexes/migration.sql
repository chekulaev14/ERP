-- DropIndex
DROP INDEX "production_logs_created_at_idx";

-- DropIndex
DROP INDEX "production_logs_order_id_idx";

-- DropIndex
DROP INDEX "production_logs_worker_id_idx";

-- DropIndex
DROP INDEX "production_orders_created_at_idx";

-- DropIndex
DROP INDEX "production_orders_status_idx";

-- DropIndex
DROP INDEX "stock_movements_created_at_idx";

-- DropIndex
DROP INDEX "stock_movements_item_id_idx";

-- DropIndex
DROP INDEX "stock_movements_order_id_idx";

-- CreateIndex
CREATE INDEX "production_logs_worker_id_created_at_idx" ON "production_logs"("worker_id", "created_at");

-- CreateIndex
CREATE INDEX "production_logs_order_id_created_at_idx" ON "production_logs"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "production_orders_status_created_at_idx" ON "production_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_item_id_created_at_idx" ON "stock_movements"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_order_id_created_at_idx" ON "stock_movements"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_from_location_id_created_at_idx" ON "stock_movements"("from_location_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_to_location_id_created_at_idx" ON "stock_movements"("to_location_id", "created_at");

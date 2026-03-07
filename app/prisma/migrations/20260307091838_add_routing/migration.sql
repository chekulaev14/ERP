-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "routings" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "RoutingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_steps" (
    "id" TEXT NOT NULL,
    "routing_id" TEXT NOT NULL,
    "step_no" INTEGER NOT NULL,
    "process_id" TEXT NOT NULL,
    "norm_time_min" DECIMAL(10,2),
    "setup_time_min" DECIMAL(10,2),
    "note" TEXT,

    CONSTRAINT "routing_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routings_item_id_status_idx" ON "routings"("item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "routings_item_id_version_key" ON "routings"("item_id", "version");

-- CreateIndex
CREATE INDEX "routing_steps_process_id_idx" ON "routing_steps"("process_id");

-- CreateIndex
CREATE UNIQUE INDEX "routing_steps_routing_id_step_no_key" ON "routing_steps"("routing_id", "step_no");

-- AddForeignKey
ALTER TABLE "routings" ADD CONSTRAINT "routings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_steps" ADD CONSTRAINT "routing_steps_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "routings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_steps" ADD CONSTRAINT "routing_steps_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

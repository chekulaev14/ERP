-- CreateEnum
CREATE TYPE "BomStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BomStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_lines" (
    "id" TEXT NOT NULL,
    "bom_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "component_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "scrap_factor" DECIMAL(8,4),
    "note" TEXT,

    CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boms_item_id_status_idx" ON "boms"("item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "boms_item_id_version_key" ON "boms"("item_id", "version");

-- CreateIndex
CREATE INDEX "bom_lines_component_item_id_idx" ON "bom_lines"("component_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "bom_lines_bom_id_line_no_key" ON "bom_lines"("bom_id", "line_no");

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_component_item_id_fkey" FOREIGN KEY ("component_item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'PRODUCTION', 'WIP', 'SCRAP');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

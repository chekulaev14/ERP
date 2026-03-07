-- CreateTable
CREATE TABLE "code_counters" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "code_counters_pkey" PRIMARY KEY ("key")
);

/*
  Warnings:

  - You are about to drop the `entity_schemas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ui_general_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ui_schemas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "entity_schemas";

-- DropTable
DROP TABLE "ui_general_config";

-- DropTable
DROP TABLE "ui_schemas";

-- CreateTable
CREATE TABLE "entity_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_entity_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "browse_config" JSONB NOT NULL DEFAULT '{}',
    "detail_config" JSONB NOT NULL DEFAULT '{}',
    "form_config" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "ui_entity_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_global_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" INTEGER NOT NULL DEFAULT 1,
    "menu_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "ui_global_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entity_definitions_entity_type_key" ON "entity_definitions"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "ui_entity_config_entity_type_key" ON "ui_entity_config"("entity_type");

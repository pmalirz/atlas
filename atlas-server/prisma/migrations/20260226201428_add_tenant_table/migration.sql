/*
  Warnings:

  - A unique constraint covering the columns `[entity_type,tenant_id]` on the table `entity_definitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[relation_type,tenant_id]` on the table `relation_definitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[type_key,tenant_id]` on the table `type_definitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entity_type,tenant_id]` on the table `ui_entity_config` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,tenant_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant_id` to the `audit_events` table without a default value. This is not possible if the table is not empty.
  - Made the column `tenant_id` on table `entities` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tenant_id` to the `entity_definitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `relation_definitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `type_definitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `ui_entity_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `ui_global_config` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "audit_events_object_idx";

-- DropIndex
DROP INDEX "entities_type_deleted_idx";

-- DropIndex
DROP INDEX "entity_definitions_entity_type_key";

-- DropIndex
DROP INDEX "relation_definitions_relation_type_key";

-- DropIndex
DROP INDEX "type_definitions_type_key_key";

-- DropIndex
DROP INDEX "ui_entity_config_entity_type_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "audit_events" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "entities" ALTER COLUMN "tenant_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "entity_definitions" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "relation_definitions" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "relations" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "type_definitions" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ui_entity_config" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ui_global_config" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_name_key" ON "tenants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "audit_events_tenant_object_idx" ON "audit_events"("tenant_id", "object_kind", "object_id", "occurred_at");

-- CreateIndex
CREATE INDEX "entities_tenant_type_deleted_idx" ON "entities"("tenant_id", "entity_type", "deleted_at");

-- CreateIndex
CREATE INDEX "entity_definitions_tenant_idx" ON "entity_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_definitions_entity_type_tenant_id_key" ON "entity_definitions"("entity_type", "tenant_id");

-- CreateIndex
CREATE INDEX "relation_definitions_tenant_idx" ON "relation_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "relation_definitions_relation_type_tenant_id_key" ON "relation_definitions"("relation_type", "tenant_id");

-- CreateIndex
CREATE INDEX "relations_tenant_idx" ON "relations"("tenant_id");

-- CreateIndex
CREATE INDEX "type_definitions_tenant_idx" ON "type_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "type_definitions_type_key_tenant_id_key" ON "type_definitions"("type_key", "tenant_id");

-- CreateIndex
CREATE INDEX "ui_entity_config_tenant_idx" ON "ui_entity_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ui_entity_config_entity_type_tenant_id_key" ON "ui_entity_config"("entity_type", "tenant_id");

-- CreateIndex
CREATE INDEX "ui_global_config_tenant_idx" ON "ui_global_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_tenant_id_key" ON "users"("email", "tenant_id");

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_definitions" ADD CONSTRAINT "type_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_definitions" ADD CONSTRAINT "entity_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation_definitions" ADD CONSTRAINT "relation_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_entity_config" ADD CONSTRAINT "ui_entity_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_global_config" ADD CONSTRAINT "ui_global_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

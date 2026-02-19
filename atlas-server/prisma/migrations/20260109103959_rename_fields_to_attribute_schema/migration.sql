/*
  Warnings:

  - You are about to drop the column `fields` on the `entity_definitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entity_definitions" DROP COLUMN "fields",
ADD COLUMN     "attribute_schema" JSONB NOT NULL DEFAULT '[]';

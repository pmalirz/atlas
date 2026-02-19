/*
  Warnings:

  - You are about to drop the column `from_entity_types` on the `relation_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `to_entity_types` on the `relation_definitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "relation_definitions" DROP COLUMN "from_entity_types",
DROP COLUMN "to_entity_types",
ADD COLUMN     "from_entity_type" TEXT,
ADD COLUMN     "to_entity_type" TEXT;

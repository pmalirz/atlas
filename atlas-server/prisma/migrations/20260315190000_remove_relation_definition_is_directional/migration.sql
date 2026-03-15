/*
  Warnings:

  - You are about to drop the column `is_directional` on the `relation_definitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "relation_definitions" DROP COLUMN "is_directional";

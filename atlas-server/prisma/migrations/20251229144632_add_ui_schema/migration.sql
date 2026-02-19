-- CreateTable
CREATE TABLE "ui_schemas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "browse_config" JSONB NOT NULL DEFAULT '{}',
    "detail_config" JSONB NOT NULL DEFAULT '{}',
    "form_config" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "ui_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ui_schemas_entity_type_key" ON "ui_schemas"("entity_type");

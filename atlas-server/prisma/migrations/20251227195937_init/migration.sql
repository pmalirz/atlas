-- CreateTable
CREATE TABLE "entities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "tenant_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "relation_type" TEXT NOT NULL,
    "from_entity_id" UUID NOT NULL,
    "to_entity_id" UUID NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" TEXT,

    CONSTRAINT "relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT,
    "action" TEXT NOT NULL,
    "object_kind" TEXT NOT NULL,
    "object_id" UUID NOT NULL,
    "object_type" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "request_id" TEXT,
    "source" TEXT,
    "entity_id" UUID,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "base_type" TEXT NOT NULL,
    "options" JSONB,
    "validation" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "type_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_schemas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relation_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "relation_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "from_entity_types" JSONB,
    "to_entity_types" JSONB,
    "is_directional" BOOLEAN NOT NULL DEFAULT true,
    "attribute_schema" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relation_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entities_type_deleted_idx" ON "entities"("entity_type", "deleted_at");

-- CreateIndex
CREATE INDEX "entities_updated_at_idx" ON "entities"("updated_at");

-- CreateIndex
CREATE INDEX "relations_from_idx" ON "relations"("from_entity_id");

-- CreateIndex
CREATE INDEX "relations_to_idx" ON "relations"("to_entity_id");

-- CreateIndex
CREATE INDEX "relations_type_from_idx" ON "relations"("relation_type", "from_entity_id");

-- CreateIndex
CREATE INDEX "relations_type_to_idx" ON "relations"("relation_type", "to_entity_id");

-- CreateIndex
CREATE INDEX "audit_events_object_idx" ON "audit_events"("object_kind", "object_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "type_definitions_type_key_key" ON "type_definitions"("type_key");

-- CreateIndex
CREATE UNIQUE INDEX "entity_schemas_entity_type_key" ON "entity_schemas"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "relation_definitions_relation_type_key" ON "relation_definitions"("relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_scope_owner_type_key" ON "retention_policies"("scope", "owner_type");

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

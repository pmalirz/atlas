-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_idx" ON "workflow_definitions"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_entity_type_idx" ON "workflow_definitions"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_name_tenant_id_key" ON "workflow_definitions"("name", "tenant_id");

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Workflow Definition audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_workflow_definitions_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor TEXT;
  v_request_id TEXT;
  v_action TEXT;
  v_before JSONB;
  v_after JSONB;
  v_source TEXT;
BEGIN
  v_actor := current_setting('app.current_user_id', true);
  v_request_id := current_setting('app.request_id', true);

  IF v_actor IS NULL OR v_actor = '' THEN
    v_actor := 'db:' || current_user;
    v_source := 'direct_sql';
  ELSE
    v_source := 'application';
  END IF;

  v_action := TG_OP;

  IF TG_OP = 'DELETE' THEN
    v_before := row_to_json(OLD)::jsonb;
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := row_to_json(NEW)::jsonb;
  ELSE
    v_before := row_to_json(OLD)::jsonb;
    v_after := row_to_json(NEW)::jsonb;
  END IF;

  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, tenant_id
  ) VALUES (
    gen_random_uuid(),
    NOW(),
    v_actor,
    LOWER(v_action),
    'schema_workflow',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.entity_type, OLD.entity_type),
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_workflow_definitions_trigger ON workflow_definitions;
CREATE TRIGGER audit_workflow_definitions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION audit_workflow_definitions_changes();

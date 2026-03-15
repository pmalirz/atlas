-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_read" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "readable_attributes" JSONB,
    "updatable_attributes" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_tenant_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_tenant_id_key" ON "roles"("name", "tenant_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_resource_type_resource_name_key" ON "role_permissions"("role_id", "resource_type", "resource_name");

-- CreateIndex
CREATE INDEX "user_roles_user_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_tenant_idx" ON "user_roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- Audit Triggers for RBAC Models
-- ==========================================

-- Roles Trigger
CREATE OR REPLACE FUNCTION audit_roles_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor TEXT; v_request_id TEXT; v_action TEXT;
  v_before JSONB; v_after JSONB; v_source TEXT;
BEGIN
  -- Read session context
  v_actor := current_setting('app.current_user_id', true);
  v_request_id := current_setting('app.request_id', true);
  -- Determine source
  IF v_actor IS NULL OR v_actor = '' THEN
    v_actor := 'db:' || current_user;
    v_source := 'direct_sql';
  ELSE
    v_source := 'application';
  END IF;
  
  -- Capture before/after
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  END IF;

  -- Insert audit row
  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, tenant_id
  ) VALUES (
    gen_random_uuid(), NOW(), v_actor, v_action, 'rbac_role', COALESCE(NEW.id, OLD.id), 'role',
    v_before, v_after, v_request_id, v_source, COALESCE(NEW.tenant_id, OLD.tenant_id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_roles_trigger ON "roles";
CREATE TRIGGER audit_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON "roles"
FOR EACH ROW EXECUTE FUNCTION audit_roles_changes();


-- Role Permissions Trigger
CREATE OR REPLACE FUNCTION audit_role_permissions_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor TEXT; v_request_id TEXT; v_action TEXT;
  v_before JSONB; v_after JSONB; v_source TEXT;
  v_tenant_id UUID;
BEGIN
  -- Read session context
  v_actor := current_setting('app.current_user_id', true);
  v_request_id := current_setting('app.request_id', true);
  -- Determine source
  IF v_actor IS NULL OR v_actor = '' THEN
    v_actor := 'db:' || current_user;
    v_source := 'direct_sql';
  ELSE
    v_source := 'application';
  END IF;
  
  -- Capture before/after
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
    -- Get tenant_id from role
    SELECT tenant_id INTO v_tenant_id FROM roles WHERE id = OLD.role_id;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
    SELECT tenant_id INTO v_tenant_id FROM roles WHERE id = NEW.role_id;
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    SELECT tenant_id INTO v_tenant_id FROM roles WHERE id = NEW.role_id;
  END IF;

  -- Insert audit row
  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, tenant_id
  ) VALUES (
    gen_random_uuid(), NOW(), v_actor, v_action, 'rbac_permission', COALESCE(NEW.id, OLD.id), COALESCE(NEW.resource_type, OLD.resource_type),
    v_before, v_after, v_request_id, v_source, v_tenant_id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_role_permissions_trigger ON "role_permissions";
CREATE TRIGGER audit_role_permissions_trigger
AFTER INSERT OR UPDATE OR DELETE ON "role_permissions"
FOR EACH ROW EXECUTE FUNCTION audit_role_permissions_changes();


-- User Roles Trigger
CREATE OR REPLACE FUNCTION audit_user_roles_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor TEXT; v_request_id TEXT; v_action TEXT;
  v_before JSONB; v_after JSONB; v_source TEXT;
BEGIN
  -- Read session context
  v_actor := current_setting('app.current_user_id', true);
  v_request_id := current_setting('app.request_id', true);
  -- Determine source
  IF v_actor IS NULL OR v_actor = '' THEN
    v_actor := 'db:' || current_user;
    v_source := 'direct_sql';
  ELSE
    v_source := 'application';
  END IF;
  
  -- Capture before/after
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  END IF;

  -- Insert audit row
  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, tenant_id
  ) VALUES (
    gen_random_uuid(), NOW(), v_actor, v_action, 'rbac_user_role', COALESCE(NEW.id, OLD.id), 'user_role',
    v_before, v_after, v_request_id, v_source, COALESCE(NEW.tenant_id, OLD.tenant_id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_user_roles_trigger ON "user_roles";
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON "user_roles"
FOR EACH ROW EXECUTE FUNCTION audit_user_roles_changes();

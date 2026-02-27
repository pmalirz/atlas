-- ============================================================================
-- Update Audit Triggers to include tenant_id
-- ============================================================================
-- All audit trigger functions must include tenant_id when inserting into
-- audit_events, since audit_events.tenant_id is now NOT NULL.
-- ============================================================================

-- ============================================================================
-- 1. Entity audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_entity_changes()
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
  ELSE -- UPDATE
    v_before := row_to_json(OLD)::jsonb;
    v_after := row_to_json(NEW)::jsonb;
  END IF;

  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, entity_id, tenant_id
  ) VALUES (
    gen_random_uuid(),
    NOW(),
    v_actor,
    LOWER(v_action),
    'entity',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.entity_type, OLD.entity_type),
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Relation audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_relation_changes()
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
    'relation',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.relation_type, OLD.relation_type),
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. User audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_user_changes()
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
    v_before := v_before - 'password_hash';
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := row_to_json(NEW)::jsonb;
    v_after := v_after - 'password_hash';
  ELSE
    v_before := row_to_json(OLD)::jsonb;
    v_after := row_to_json(NEW)::jsonb;
    v_before := v_before - 'password_hash';
    v_after := v_after - 'password_hash';
  END IF;

  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source, tenant_id
  ) VALUES (
    gen_random_uuid(),
    NOW(),
    v_actor,
    LOWER(v_action),
    'user',
    COALESCE(NEW.id, OLD.id),
    'user',
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Entity Definition audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_entity_definition_changes()
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
    'schema_entity',
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

-- ============================================================================
-- 5. Relation Definition audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_relation_definition_changes()
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
    'schema_relation',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.relation_type, OLD.relation_type),
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Type Definition audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_type_definition_changes()
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
    'schema_type',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.type_key, OLD.type_key),
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. UI Entity Config audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_ui_entity_config_changes()
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
    'ui_config',
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

-- ============================================================================
-- 8. UI Global Config audit trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_ui_global_config_changes()
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
    'ui_config',
    COALESCE(NEW.id, OLD.id),
    'global',
    v_before,
    v_after,
    v_request_id,
    v_source,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
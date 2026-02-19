-- ============================================================================
-- Audit System Implementation
-- ============================================================================
-- This migration creates database triggers that automatically log all changes
-- to audited tables. The triggers read session context variables set by the
-- application (via set_config) to identify the actor and request ID.
--
-- Audited tables: entities, relations, users, entity_definitions, 
-- relation_definitions, type_definitions, ui_entity_config, ui_global_config.
-- ============================================================================

-- Add index on actor column for efficient activity queries
CREATE INDEX IF NOT EXISTS "audit_events_actor_idx" ON "audit_events" ("actor");

-- Drop unused table: retention_policies
DROP TABLE IF EXISTS retention_policies;

-- ============================================================================
-- Generic Audit Function for Entities
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
    before, after, request_id, source, entity_id
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
    COALESCE(NEW.id, OLD.id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_entities_trigger ON entities;
CREATE TRIGGER audit_entities_trigger
AFTER INSERT OR UPDATE OR DELETE ON entities
FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

-- ============================================================================
-- Generic Audit Function for Relations
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_relations_trigger ON relations;
CREATE TRIGGER audit_relations_trigger
AFTER INSERT OR UPDATE OR DELETE ON relations
FOR EACH ROW EXECUTE FUNCTION audit_relation_changes();

-- ============================================================================
-- Audit Function for Users
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
    -- Remove sensitive data from audit log
    v_before := v_before - 'password_hash';
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := row_to_json(NEW)::jsonb;
    v_after := v_after - 'password_hash';
  ELSE
    v_before := row_to_json(OLD)::jsonb;
    v_after := row_to_json(NEW)::jsonb;
    -- Remove sensitive data from audit log
    v_before := v_before - 'password_hash';
    v_after := v_after - 'password_hash';
  END IF;
  
  INSERT INTO audit_events (
    id, occurred_at, actor, action, object_kind, object_id, object_type,
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

-- ============================================================================
-- Audit Function for Entity Definitions (Schema)
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_entity_definitions_trigger ON entity_definitions;
CREATE TRIGGER audit_entity_definitions_trigger
AFTER INSERT OR UPDATE OR DELETE ON entity_definitions
FOR EACH ROW EXECUTE FUNCTION audit_entity_definition_changes();

-- ============================================================================
-- Audit Function for Relation Definitions (Schema)
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_relation_definitions_trigger ON relation_definitions;
CREATE TRIGGER audit_relation_definitions_trigger
AFTER INSERT OR UPDATE OR DELETE ON relation_definitions
FOR EACH ROW EXECUTE FUNCTION audit_relation_definition_changes();

-- ============================================================================
-- Audit Function for Type Definitions (Schema)
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_type_definitions_trigger ON type_definitions;
CREATE TRIGGER audit_type_definitions_trigger
AFTER INSERT OR UPDATE OR DELETE ON type_definitions
FOR EACH ROW EXECUTE FUNCTION audit_type_definition_changes();

-- ============================================================================
-- Audit Function for UI Entity Config
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_ui_entity_config_trigger ON ui_entity_config;
CREATE TRIGGER audit_ui_entity_config_trigger
AFTER INSERT OR UPDATE OR DELETE ON ui_entity_config
FOR EACH ROW EXECUTE FUNCTION audit_ui_entity_config_changes();

-- ============================================================================
-- Audit Function for UI Global Config
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
    before, after, request_id, source
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
    v_source
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_ui_global_config_trigger ON ui_global_config;
CREATE TRIGGER audit_ui_global_config_trigger
AFTER INSERT OR UPDATE OR DELETE ON ui_global_config
FOR EACH ROW EXECUTE FUNCTION audit_ui_global_config_changes();

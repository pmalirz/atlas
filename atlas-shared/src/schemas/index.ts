// =============================================================================
// Schemas Index
// =============================================================================
// Re-exports all validation schemas for the dynamic model.
// Import from: atlas-shared/zod
// =============================================================================

// Model validation schemas (AttributeDefinition, EntityDefinition, etc.)
export * from './model-schemas';

// UI configuration schemas (BrowseConfig, DetailConfig, etc.)
export * from './ui-schemas';

// Authentication schemas (AuthUser, LoginRequest, etc.)
export * from './auth-schemas';

// Re-export zod.ts (includes z export and all schemas)
export * from './zod';


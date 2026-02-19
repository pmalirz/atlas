-- PostgreSQL initialization script
-- Enables required extensions for App Atlas

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigram search for fuzzy matching on names
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Case-insensitive text (optional, for emails etc.)
CREATE EXTENSION IF NOT EXISTS "citext";

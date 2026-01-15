-- ============================================
-- Supabase Roles Initialization
-- ============================================
-- This script creates all the necessary roles for Supabase local development
-- Password is 'postgres' for all users (dev environment only!)

-- Create anon role (for anonymous access)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Create authenticated role (for authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Create service_role (for service/admin access)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Create supabase_auth_admin (for GoTrue/Auth service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS PASSWORD 'postgres';
  END IF;
END
$$;

-- Create authenticator (for PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN PASSWORD 'postgres' NOINHERIT;
  END IF;
END
$$;

-- Grant anon and authenticated to authenticator
GRANT anon, authenticated, service_role TO authenticator;

-- Create supabase_storage_admin (for Storage service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin LOGIN BYPASSRLS PASSWORD 'postgres';
  END IF;
END
$$;

-- Create supabase_admin (for Realtime and general admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS PASSWORD 'postgres';
  END IF;
END
$$;

-- Create supabase role (for Meta service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase') THEN
    CREATE ROLE supabase LOGIN PASSWORD 'postgres';
  END IF;
END
$$;

-- Create dashboard_user (for Studio)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_user') THEN
    CREATE ROLE dashboard_user LOGIN PASSWORD 'postgres';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL ON DATABASE postgres TO supabase_admin;
GRANT ALL ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL ON DATABASE postgres TO supabase_storage_admin;
GRANT ALL ON DATABASE postgres TO supabase;
GRANT ALL ON DATABASE postgres TO dashboard_user;

-- Create auth schema (needed by GoTrue)
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;

-- Create auth.uid() function for RLS policies
-- This will be replaced by GoTrue migrations, but we need it for initial schema
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

-- Transfer ownership to supabase_auth_admin so GoTrue can replace it
ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

-- Create storage schema (needed by Storage API)
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;

-- Create realtime schema (needed by Realtime)
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION supabase_admin;
CREATE SCHEMA IF NOT EXISTS realtime AUTHORIZATION supabase_admin;

-- Grant schema permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions for auth schema
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- Grant table permissions for storage schema
GRANT ALL ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO supabase_storage_admin;

-- Set default privileges for future objects in auth
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON ROUTINES TO supabase_auth_admin;

-- Set default privileges for future objects in storage
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON ROUTINES TO supabase_storage_admin;

-- Set default privileges for future objects in public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ============================================
-- Storage Schema Base Tables
-- ============================================
-- Create MINIMAL storage tables - let storage-api migrations add all other columns

SET search_path TO storage;

-- Minimal buckets table - migrations will add public, avif_autodetection, etc.
CREATE TABLE IF NOT EXISTS buckets (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Minimal objects table - migrations will add path_tokens, etc.
CREATE TABLE IF NOT EXISTS objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text REFERENCES storage.buckets(id),
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    CONSTRAINT objects_bucketId_name_key UNIQUE (bucket_id, name)
);

CREATE INDEX IF NOT EXISTS idx_buckets_name ON storage.buckets(name);
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_objects_name ON storage.objects(name);

-- Transfer ownership and grant permissions to storage admin
ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;
GRANT ALL ON storage.buckets TO supabase_storage_admin;
GRANT ALL ON storage.objects TO supabase_storage_admin;

-- Reset search path
-- Note: We'll insert the default bucket AFTER storage service runs its migrations
SET search_path TO public;

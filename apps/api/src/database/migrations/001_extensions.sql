-- Bootstrap extensions
-- Must run as superuser before any other migrations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create application DB role used by NestJS (limited: cannot drop tables, no superuser)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'crm_api') THEN
    CREATE ROLE crm_api LOGIN PASSWORD 'crm_api_secret_change_in_prod';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE crm_db TO crm_api;

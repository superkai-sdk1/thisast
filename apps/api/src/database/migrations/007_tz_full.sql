-- ─────────────────────────────────────────────────────────────────────────────
-- 007: Full TZ implementation — new types, fields, tables
-- Idempotent: safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- PG16+ required for CREATE TYPE IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────────────

-- =============================================================
-- NEW ENUM TYPES (IF NOT EXISTS — PG15+)
-- =============================================================

DO $$ BEGIN
  CREATE TYPE property_status    AS ENUM ('active', 'sold', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_subtype   AS ENUM ('secondary', 'new_building');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE building_status    AS ENUM ('delivered', 'under_construction');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bathroom_type      AS ENUM ('combined', 'separate', 'two', 'three_plus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE room_type          AS ENUM ('isolated', 'adjacent', 'studio', 'free_layout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE renovation_type    AS ENUM ('none', 'rough', 'cosmetic', 'euro', 'clean', 'designer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_type        AS ENUM ('buyer', 'seller', 'renter', 'landlord');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_temperature AS ENUM ('hot', 'warm', 'cold', 'thinking');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE market_type        AS ENUM ('any', 'new_building', 'secondary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE utilities_included AS ENUM ('not_set', 'included', 'separate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority      AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status        AS ENUM ('new', 'in_progress', 'waiting', 'done', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE building_type      AS ENUM ('monolith_brick', 'monolith_block', 'panel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complex_finish     AS ENUM ('none', 'rough', 'clean', 'turnkey');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apartment_status   AS ENUM ('free', 'reserved', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_entity_type  AS ENUM ('property', 'demand', 'complex', 'deal', 'task');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type         AS ENUM ('created', 'updated', 'status_changed', 'price_changed', 'comment_added', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- PROPERTIES — extend existing table
-- =============================================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS display_id        SERIAL,
  ADD COLUMN IF NOT EXISTS status            property_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS listing_type      TEXT NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS net_price         NUMERIC,
  ADD COLUMN IF NOT EXISTS agent_commission  NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_type   TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS subtype           property_subtype,
  ADD COLUMN IF NOT EXISTS building_status   building_status,
  ADD COLUMN IF NOT EXISTS delivery_year     SMALLINT,
  ADD COLUMN IF NOT EXISTS delivery_quarter  SMALLINT,
  ADD COLUMN IF NOT EXISTS kitchen_area      NUMERIC,
  ADD COLUMN IF NOT EXISTS living_area       NUMERIC,
  ADD COLUMN IF NOT EXISTS bathroom_type     bathroom_type,
  ADD COLUMN IF NOT EXISTS room_type         room_type,
  ADD COLUMN IF NOT EXISTS windows           TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS renovation        renovation_type,
  ADD COLUMN IF NOT EXISTS warm_floor        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS furniture         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_loggia        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_balcony       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_wardrobe      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_panoramic     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plot_area         NUMERIC,
  ADD COLUMN IF NOT EXISTS second_house_area NUMERIC,
  ADD COLUMN IF NOT EXISTS house_floors      SMALLINT,
  ADD COLUMN IF NOT EXISTS utilities         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cadastral_number  TEXT,
  ADD COLUMN IF NOT EXISTS from_realtor      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at_manual TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at_manual TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_display_id  ON properties(display_id);
CREATE        INDEX IF NOT EXISTS idx_properties_status      ON properties(status);
CREATE        INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE        INDEX IF NOT EXISTS idx_properties_renovation   ON properties(renovation);

-- =============================================================
-- DEMANDS — extend for 4 client types
-- =============================================================

ALTER TABLE demands
  ADD COLUMN IF NOT EXISTS display_id         SERIAL,
  ADD COLUMN IF NOT EXISTS client_type        client_type NOT NULL DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS temperature        client_temperature,
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS market_type        market_type,
  ADD COLUMN IF NOT EXISTS net_price          NUMERIC,
  ADD COLUMN IF NOT EXISTS rent_price         NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit            NUMERIC,
  ADD COLUMN IF NOT EXISTS utilities_included utilities_included NOT NULL DEFAULT 'not_set',
  ADD COLUMN IF NOT EXISTS first_contact_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contact_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_contact_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demand_notes       TEXT,
  ADD COLUMN IF NOT EXISTS is_contact_overdue BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_demands_display_id  ON demands(display_id);
CREATE        INDEX IF NOT EXISTS idx_demands_client_type ON demands(client_type);
CREATE        INDEX IF NOT EXISTS idx_demands_temperature ON demands(temperature);
CREATE        INDEX IF NOT EXISTS idx_demands_is_active   ON demands(is_active);
CREATE        INDEX IF NOT EXISTS idx_demands_next_contact ON demands(next_contact_at) WHERE next_contact_at IS NOT NULL;

-- =============================================================
-- TASKS — add priority, status, multi-binding
-- =============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS display_id  SERIAL,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS complex_id  UUID REFERENCES residential_complexes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_id     UUID REFERENCES deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority    task_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status      task_status   NOT NULL DEFAULT 'new';

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_display_id  ON tasks(display_id);
CREATE        INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE        INDEX IF NOT EXISTS idx_tasks_priority    ON tasks(priority);
CREATE        INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id);
CREATE        INDEX IF NOT EXISTS idx_tasks_complex_id  ON tasks(complex_id);
CREATE        INDEX IF NOT EXISTS idx_tasks_deal_id     ON tasks(deal_id);
CREATE        INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Migrate existing completed tasks
UPDATE tasks SET status = 'done' WHERE completed_at IS NOT NULL AND status = 'new';

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- =============================================================
-- DEALS — add display_id
-- =============================================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_display_id ON deals(display_id);

-- =============================================================
-- RESIDENTIAL COMPLEXES — extend
-- =============================================================

ALTER TABLE residential_complexes
  ADD COLUMN IF NOT EXISTS display_id            SERIAL,
  ADD COLUMN IF NOT EXISTS ceiling_height        NUMERIC,
  ADD COLUMN IF NOT EXISTS has_panoramic_windows BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS building_type         building_type,
  ADD COLUMN IF NOT EXISTS entrances_count       SMALLINT,
  ADD COLUMN IF NOT EXISTS apartments_count      INTEGER,
  ADD COLUMN IF NOT EXISTS parking_spots         INTEGER,
  ADD COLUMN IF NOT EXISTS elevator_passenger    SMALLINT,
  ADD COLUMN IF NOT EXISTS elevator_cargo        SMALLINT,
  ADD COLUMN IF NOT EXISTS elevator_cargo_pass   SMALLINT,
  ADD COLUMN IF NOT EXISTS parking_types         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_closed_territory  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_playground        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_sports_ground     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS finish_type           complex_finish,
  ADD COLUMN IF NOT EXISTS has_gas               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_params         JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS payment_cash_sqm      NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_inst_sqm      NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_inst_months   SMALLINT,
  ADD COLUMN IF NOT EXISTS payment_inst_initial  NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_mort_sqm      NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_mort_rate     NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_mort_months   SMALLINT,
  ADD COLUMN IF NOT EXISTS payment_mort_initial  NUMERIC,
  ADD COLUMN IF NOT EXISTS has_barter            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conditions_notes      TEXT[]  NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_complexes_display_id   ON residential_complexes(display_id);
CREATE        INDEX IF NOT EXISTS idx_complexes_building_type ON residential_complexes(building_type);
CREATE        INDEX IF NOT EXISTS idx_complexes_finish_type   ON residential_complexes(finish_type);

-- =============================================================
-- COMPLEX APARTMENTS — квартиры от застройщика
-- =============================================================

CREATE TABLE IF NOT EXISTS complex_apartments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id  UUID     NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
    display_id  SERIAL,
    area        NUMERIC  NOT NULL,
    floor       SMALLINT,
    entrance    SMALLINT,
    rooms       SMALLINT,
    window_view TEXT,
    layout_desc TEXT,
    status      apartment_status NOT NULL DEFAULT 'free',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE        INDEX IF NOT EXISTS idx_complex_apartments_complex_id ON complex_apartments(complex_id);
CREATE        INDEX IF NOT EXISTS idx_complex_apartments_status     ON complex_apartments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_complex_apartments_display_id ON complex_apartments(display_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'set_updated_at'
      AND event_object_table = 'complex_apartments'
  ) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON complex_apartments
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- =============================================================
-- COMPLEX DOCUMENTS — PDF проектная документация
-- =============================================================

CREATE TABLE IF NOT EXISTS complex_documents (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id UUID NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complex_documents_complex_id ON complex_documents(complex_id);

-- =============================================================
-- COMPLEX APARTMENT PHOTOS
-- =============================================================

CREATE TABLE IF NOT EXISTS complex_apartment_photos (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id  UUID     NOT NULL REFERENCES complex_apartments(id) ON DELETE CASCADE,
    url           TEXT     NOT NULL,
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complex_apt_photos_apt_id ON complex_apartment_photos(apartment_id);

-- =============================================================
-- ENTITY EVENTS — универсальная история событий
-- =============================================================

CREATE TABLE IF NOT EXISTS entity_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type event_entity_type NOT NULL,
    entity_id   UUID              NOT NULL,
    event_type  event_type        NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    old_value   TEXT,
    new_value   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_events_lookup ON entity_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_events_user   ON entity_events(user_id, created_at DESC);

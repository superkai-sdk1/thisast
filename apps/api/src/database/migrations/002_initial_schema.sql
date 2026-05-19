-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'agent');
CREATE TYPE visibility_status AS ENUM ('private', 'shared', 'public');

CREATE TYPE property_type AS ENUM (
    'apartment', 'house', 'land', 'commercial', 'new_building', 'rent'
);

CREATE TYPE repair_type AS ENUM (
    'no_repair', 'cosmetic', 'euro', 'designer', 'new_building_finish'
);

CREATE TYPE payment_form AS ENUM (
    'cash', 'mortgage', 'installment', 'trade_in', 'matcapital', 'military_mortgage'
);

CREATE TYPE kanban_status AS ENUM (
    'new', 'qualifying', 'selection', 'viewings', 'thinking', 'negotiation', 'deal'
);

CREATE TYPE deal_status AS ENUM ('in_progress', 'closed');
CREATE TYPE sharing_request_status AS ENUM ('pending', 'approved', 'denied');
CREATE TYPE activity_type AS ENUM ('note', 'call', 'viewing', 'task');

CREATE TYPE audit_action AS ENUM (
    'VIEW_CONTACT',
    'DOWNLOAD_PDF',
    'CHANGE_VISIBILITY',
    'VIEW_FINANCIALS',
    'EXPORT_DATA',
    'DELETE_RECORD',
    'CREATE_RECORD',
    'UPDATE_RECORD',
    'LOGIN',
    'LOGOUT'
);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- AGENCIES
-- =============================================================

CREATE TABLE agencies (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL,
    logo_url   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON agencies
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id        UUID REFERENCES agencies(id) ON DELETE SET NULL,
    email            TEXT NOT NULL UNIQUE,
    password_hash    TEXT NOT NULL,
    role             user_role NOT NULL DEFAULT 'agent',
    full_name        TEXT NOT NULL,
    phone            TEXT,
    photo_url        TEXT,
    permission_flags JSONB NOT NULL DEFAULT '{
        "can_view_global_database": false,
        "can_export_data": false,
        "can_see_financials": false,
        "can_delete_records": false
    }'::jsonb,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    push_subscription JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- REFRESH TOKENS
-- =============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    user_agent  TEXT,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- =============================================================
-- OWNERS  (sensitive — reads are audit-logged)
-- =============================================================

CREATE TABLE owners (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name  TEXT NOT NULL,
    phone      TEXT NOT NULL,
    email      TEXT,
    notes      TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owners_created_by ON owners(created_by);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- PROPERTIES
-- =============================================================

CREATE TABLE properties (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_agent_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_id          UUID REFERENCES owners(id) ON DELETE SET NULL,
    visibility_status visibility_status NOT NULL DEFAULT 'private',
    property_type     property_type NOT NULL,

    country           TEXT NOT NULL DEFAULT 'RU',
    region            TEXT,
    city              TEXT NOT NULL,
    district          TEXT,
    street            TEXT,
    house_number      TEXT,
    apartment_number  TEXT,
    postal_code       TEXT,
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,

    price             NUMERIC(15, 2) NOT NULL,
    price_per_sqm     NUMERIC(12, 2) GENERATED ALWAYS AS (
                          CASE WHEN area_sqm > 0 THEN ROUND(price / area_sqm, 2) ELSE NULL END
                      ) STORED,
    area_sqm          NUMERIC(8, 2),
    rooms             SMALLINT,
    floor             SMALLINT,
    floor_total       SMALLINT,
    ceiling_height    NUMERIC(4, 2),
    conditions        payment_form[] NOT NULL DEFAULT '{}',
    tags              TEXT[] NOT NULL DEFAULT '{}',
    description       TEXT,
    embedding         vector(1536),

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_properties_owner_agent_id ON properties(owner_agent_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_visibility ON properties(visibility_status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_not_deleted ON properties(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_conditions ON properties USING GIN(conditions);
CREATE INDEX idx_properties_tags ON properties USING GIN(tags);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- PROPERTY PHOTOS
-- =============================================================

CREATE TABLE property_photos (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url           TEXT NOT NULL,
    display_order SMALLINT NOT NULL DEFAULT 0,
    is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_photos_property_id ON property_photos(property_id);

-- =============================================================
-- DEMANDS
-- =============================================================

CREATE TABLE demands (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    buyer_name    TEXT NOT NULL,
    buyer_phone   TEXT NOT NULL,
    budget_min    NUMERIC(15, 2),
    budget_max    NUMERIC(15, 2) NOT NULL,
    property_type property_type NOT NULL,
    rooms         SMALLINT[] NOT NULL DEFAULT '{}',
    districts     TEXT[] NOT NULL DEFAULT '{}',
    repair_types  repair_type[] NOT NULL DEFAULT '{}',
    payment_forms payment_form[] NOT NULL DEFAULT '{}',
    area_min      NUMERIC(8, 2),
    area_max      NUMERIC(8, 2),
    floor_min     SMALLINT,
    floor_max     SMALLINT,
    kanban_status kanban_status NOT NULL DEFAULT 'new',
    notes         TEXT,
    embedding     vector(1536),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demands_agent_id ON demands(agent_id);
CREATE INDEX idx_demands_kanban_status ON demands(kanban_status);
CREATE INDEX idx_demands_property_type ON demands(property_type);
CREATE INDEX idx_demands_rooms ON demands USING GIN(rooms);
CREATE INDEX idx_demands_districts ON demands USING GIN(districts);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON demands
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- DEMAND-PROPERTY MATCHES
-- =============================================================

CREATE TABLE demand_property_matches (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id     UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    score         NUMERIC(5, 4) NOT NULL,
    score_budget  NUMERIC(5, 4),
    score_type    NUMERIC(5, 4),
    score_rooms   NUMERIC(5, 4),
    score_district NUMERIC(5, 4),
    score_area    NUMERIC(5, 4),
    score_semantic NUMERIC(5, 4),
    score_payment NUMERIC(5, 4),
    notified_at   TIMESTAMPTZ,
    is_dismissed  BOOLEAN NOT NULL DEFAULT FALSE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_demand_property_match UNIQUE (demand_id, property_id)
);

CREATE INDEX idx_matches_demand_id ON demand_property_matches(demand_id);
CREATE INDEX idx_matches_property_id ON demand_property_matches(property_id);
CREATE INDEX idx_matches_score ON demand_property_matches(score DESC);

-- =============================================================
-- DEALS
-- =============================================================

CREATE TABLE deals (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id            UUID REFERENCES demands(id) ON DELETE SET NULL,
    property_id          UUID REFERENCES properties(id) ON DELETE SET NULL,
    is_external_property BOOLEAN NOT NULL DEFAULT FALSE,
    external_address     TEXT,
    buyer_owner_id       UUID REFERENCES owners(id) ON DELETE RESTRICT,
    seller_owner_id      UUID REFERENCES owners(id) ON DELETE RESTRICT,
    deal_price           NUMERIC(15, 2) NOT NULL,
    my_commission        NUMERIC(15, 2),
    payment_form         payment_form,
    status               deal_status NOT NULL DEFAULT 'in_progress',
    created_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes                TEXT,
    closed_at            TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_demand_id ON deals(demand_id);
CREATE INDEX idx_deals_property_id ON deals(property_id);
CREATE INDEX idx_deals_created_by ON deals(created_by);
CREATE INDEX idx_deals_status ON deals(status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- COMMISSION SPLITS
-- =============================================================

CREATE TABLE commission_splits (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id          UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    partner_name     TEXT NOT NULL,
    partner_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    split_amount     NUMERIC(15, 2) NOT NULL,
    split_percent    NUMERIC(5, 2),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_splits_deal_id ON commission_splits(deal_id);
CREATE INDEX idx_commission_splits_partner_id ON commission_splits(partner_agent_id);

-- =============================================================
-- PROPERTY SHARING REQUESTS
-- =============================================================

CREATE TABLE property_sharing_requests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       sharing_request_status NOT NULL DEFAULT 'pending',
    message      TEXT,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sharing_property_id ON property_sharing_requests(property_id);
CREATE INDEX idx_sharing_requester_id ON property_sharing_requests(requester_id);
CREATE INDEX idx_sharing_owner_id ON property_sharing_requests(owner_id);
CREATE INDEX idx_sharing_status ON property_sharing_requests(status);

-- =============================================================
-- TASKS
-- =============================================================

CREATE TABLE tasks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id    UUID REFERENCES demands(id) ON DELETE SET NULL,
    agent_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    due_at       TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_demand_id ON tasks(demand_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_pending ON tasks(due_at) WHERE completed_at IS NULL;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================
-- ACTIVITY LOGS  (demand timeline — append-only in practice)
-- =============================================================

CREATE TABLE activity_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id     UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
    agent_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    activity_type activity_type NOT NULL,
    body          TEXT,
    metadata      JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_demand_id ON activity_logs(demand_id);
CREATE INDEX idx_activity_logs_agent_id ON activity_logs(agent_id);

-- =============================================================
-- AUDIT LOGS  (immutable — enforced via RLS)
-- =============================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type audit_action NOT NULL,
    target_type TEXT NOT NULL,
    target_id   UUID,
    metadata    JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- crm_api role can only INSERT, never UPDATE or DELETE
CREATE POLICY audit_insert_only ON audit_logs
    FOR INSERT TO crm_api WITH CHECK (TRUE);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT,
    type       TEXT NOT NULL,
    payload    JSONB,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================================
-- PRICE DROP EVENTS  (staging table for BullMQ trigger)
-- =============================================================

CREATE TABLE price_drop_events (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    old_price    NUMERIC(15, 2) NOT NULL,
    new_price    NUMERIC(15, 2) NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GRANT permissions to crm_api role
-- =============================================================

GRANT USAGE ON SCHEMA public TO crm_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crm_api;

-- Revoke destructive access on audit_logs for crm_api (RLS handles INSERT-only)
REVOKE UPDATE, DELETE ON audit_logs FROM crm_api;

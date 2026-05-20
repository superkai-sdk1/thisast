-- ────────────────────────────────────────────────────────────────────────────
-- 005: Residential Complexes + WebAuthn Passkey credentials
-- ────────────────────────────────────────────────────────────────────────────

-- ── Residential Complexes ────────────────────────────────────────────────────

CREATE TYPE complex_class AS ENUM ('economy', 'comfort', 'business', 'premium');

CREATE TABLE residential_complexes (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT        NOT NULL,
    developer     TEXT,
    class         complex_class,
    district      TEXT,
    address       TEXT,
    description   TEXT,
    year_delivery SMALLINT,
    total_floors  SMALLINT,
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE complex_photos (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id    UUID        NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
    url           TEXT        NOT NULL,
    display_order SMALLINT    NOT NULL DEFAULT 0,
    is_cover      BOOLEAN     NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_residential_complexes
    BEFORE UPDATE ON residential_complexes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_complexes_district  ON residential_complexes(district);
CREATE INDEX idx_complexes_class     ON residential_complexes(class);
CREATE INDEX idx_complexes_is_active ON residential_complexes(is_active);

-- Add complex_id FK to properties (nullable — existing props stay unlinked)
ALTER TABLE properties ADD COLUMN complex_id UUID REFERENCES residential_complexes(id) ON DELETE SET NULL;
CREATE INDEX idx_properties_complex_id ON properties(complex_id);

-- ── WebAuthn / Passkey credentials ──────────────────────────────────────────

CREATE TABLE webauthn_credentials (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id  TEXT        NOT NULL UNIQUE,
    public_key     TEXT        NOT NULL,
    counter        BIGINT      NOT NULL DEFAULT 0,
    device_name    TEXT,
    aaguid         TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at   TIMESTAMPTZ
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);

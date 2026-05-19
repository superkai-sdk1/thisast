-- =============================================================
-- AI MATCHING SCORE FUNCTION
-- Weighted: budget 30%, type 20%, rooms 15%, district 15%,
--           area 10%, semantic (pgvector) 5%, payment 5%
-- =============================================================

CREATE OR REPLACE FUNCTION calculate_match_score(
    p_demand_id   UUID,
    p_property_id UUID
)
RETURNS NUMERIC(5, 4) AS $$
DECLARE
    v_demand   demands%ROWTYPE;
    v_property properties%ROWTYPE;

    s_budget   NUMERIC(5, 4) := 0;
    s_type     NUMERIC(5, 4) := 0;
    s_rooms    NUMERIC(5, 4) := 0;
    s_district NUMERIC(5, 4) := 0;
    s_area     NUMERIC(5, 4) := 0;
    s_semantic NUMERIC(5, 4) := 0;
    s_payment  NUMERIC(5, 4) := 0;

    v_total                NUMERIC(5, 4);
    v_budget_max_tolerated NUMERIC(15, 2);
BEGIN
    SELECT * INTO v_demand   FROM demands    WHERE id = p_demand_id;
    SELECT * INTO v_property FROM properties WHERE id = p_property_id AND deleted_at IS NULL;

    IF NOT FOUND THEN RETURN 0; END IF;

    -- ---- 1. BUDGET (30%) — hard cut at +7% over budget_max ----
    v_budget_max_tolerated := v_demand.budget_max * 1.07;

    IF v_property.price <= v_demand.budget_max THEN
        IF v_demand.budget_min IS NULL OR v_property.price >= v_demand.budget_min THEN
            s_budget := 1.0;
        ELSE
            s_budget := 0.7;
        END IF;
    ELSIF v_property.price <= v_budget_max_tolerated THEN
        -- Linear decay from 1.0 → 0.5 inside the tolerance band
        s_budget := 1.0 - (
            (v_property.price - v_demand.budget_max) /
            (v_budget_max_tolerated - v_demand.budget_max)
        ) * 0.5;
    ELSE
        RETURN 0;   -- hard disqualifier
    END IF;

    -- ---- 2. TYPE (20%) — hard filter ----
    IF v_demand.property_type = v_property.property_type THEN
        s_type := 1.0;
    ELSE
        RETURN 0;   -- hard disqualifier
    END IF;

    -- ---- 3. ROOMS (15%) ----
    IF array_length(v_demand.rooms, 1) IS NULL OR array_length(v_demand.rooms, 1) = 0 THEN
        s_rooms := 1.0;
    ELSIF v_property.rooms = ANY(v_demand.rooms) THEN
        s_rooms := 1.0;
    ELSE
        s_rooms := 0.0;
    END IF;

    -- ---- 4. DISTRICT (15%) ----
    IF array_length(v_demand.districts, 1) IS NULL OR array_length(v_demand.districts, 1) = 0 THEN
        s_district := 1.0;
    ELSIF v_property.district = ANY(v_demand.districts) THEN
        s_district := 1.0;
    ELSE
        s_district := 0.2;
    END IF;

    -- ---- 5. AREA (10%) ----
    IF v_property.area_sqm IS NULL OR (v_demand.area_min IS NULL AND v_demand.area_max IS NULL) THEN
        s_area := 1.0;
    ELSIF (v_demand.area_min IS NULL OR v_property.area_sqm >= v_demand.area_min) AND
          (v_demand.area_max IS NULL OR v_property.area_sqm <= v_demand.area_max) THEN
        s_area := 1.0;
    ELSE
        s_area := 0.0;
    END IF;

    -- ---- 6. SEMANTIC SIMILARITY (5%) via pgvector ----
    IF v_demand.embedding IS NOT NULL AND v_property.embedding IS NOT NULL THEN
        s_semantic := GREATEST(0, 1.0 - (v_demand.embedding <=> v_property.embedding));
    ELSE
        s_semantic := 0.5;
    END IF;

    -- ---- 7. PAYMENT FORM (5%) ----
    IF array_length(v_demand.payment_forms, 1) IS NULL OR array_length(v_demand.payment_forms, 1) = 0 THEN
        s_payment := 1.0;
    ELSIF v_property.conditions && v_demand.payment_forms THEN
        s_payment := 1.0;
    ELSE
        s_payment := 0.3;
    END IF;

    -- ---- WEIGHTED SUM ----
    v_total := ROUND(
        (s_budget   * 0.30) +
        (s_type     * 0.20) +
        (s_rooms    * 0.15) +
        (s_district * 0.15) +
        (s_area     * 0.10) +
        (s_semantic * 0.05) +
        (s_payment  * 0.05),
    4);

    -- Upsert match record
    INSERT INTO demand_property_matches (
        demand_id, property_id, score,
        score_budget, score_type, score_rooms, score_district,
        score_area, score_semantic, score_payment, calculated_at
    ) VALUES (
        p_demand_id, p_property_id, v_total,
        s_budget, s_type, s_rooms, s_district,
        s_area, s_semantic, s_payment, NOW()
    )
    ON CONFLICT (demand_id, property_id) DO UPDATE SET
        score          = EXCLUDED.score,
        score_budget   = EXCLUDED.score_budget,
        score_type     = EXCLUDED.score_type,
        score_rooms    = EXCLUDED.score_rooms,
        score_district = EXCLUDED.score_district,
        score_area     = EXCLUDED.score_area,
        score_semantic = EXCLUDED.score_semantic,
        score_payment  = EXCLUDED.score_payment,
        calculated_at  = EXCLUDED.calculated_at;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- BATCH RECALCULATE: demand → all compatible properties
-- =============================================================

CREATE OR REPLACE FUNCTION recalculate_matches_for_demand(p_demand_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_property_id UUID;
    v_count       INTEGER := 0;
    v_type        property_type;
BEGIN
    SELECT property_type INTO v_type FROM demands WHERE id = p_demand_id;

    FOR v_property_id IN
        SELECT id FROM properties
        WHERE deleted_at IS NULL
          AND property_type = v_type
          AND visibility_status IN ('shared', 'public')
    LOOP
        PERFORM calculate_match_score(p_demand_id, v_property_id);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- BATCH RECALCULATE: property → all demands of same type
-- =============================================================

CREATE OR REPLACE FUNCTION recalculate_matches_for_property(p_property_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_demand_id UUID;
    v_count     INTEGER := 0;
    v_type      property_type;
BEGIN
    SELECT property_type INTO v_type FROM properties WHERE id = p_property_id;

    FOR v_demand_id IN
        SELECT id FROM demands WHERE property_type = v_type
    LOOP
        PERFORM calculate_match_score(v_demand_id, p_property_id);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- PRICE DROP TRIGGER — emits pg_notify for NestJS listener
-- =============================================================

CREATE OR REPLACE FUNCTION trigger_price_drop_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price < OLD.price THEN
        INSERT INTO price_drop_events (property_id, old_price, new_price)
        VALUES (NEW.id, OLD.price, NEW.price);

        PERFORM pg_notify(
            'price_drop',
            json_build_object(
                'property_id', NEW.id,
                'old_price',   OLD.price,
                'new_price',   NEW.price
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_property_price_drop
    AFTER UPDATE OF price ON properties
    FOR EACH ROW EXECUTE FUNCTION trigger_price_drop_event();

-- =============================================================
-- STALE LEAD DETECTION VIEW
-- Demands in 'thinking' or 'selection' not touched in 4 days
-- =============================================================

CREATE OR REPLACE VIEW stale_demands AS
SELECT
    d.id,
    d.agent_id,
    d.buyer_name,
    d.kanban_status,
    d.updated_at,
    NOW() - d.updated_at AS staleness,
    u.full_name AS agent_name,
    u.push_subscription
FROM demands d
JOIN users u ON u.id = d.agent_id
WHERE d.kanban_status IN ('thinking', 'selection', 'qualifying')
  AND d.updated_at < NOW() - INTERVAL '4 days'
  AND NOT EXISTS (
      SELECT 1 FROM activity_logs al
      WHERE al.demand_id = d.id AND al.created_at > NOW() - INTERVAL '4 days'
  );

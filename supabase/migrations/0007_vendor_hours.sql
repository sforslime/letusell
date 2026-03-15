-- Per-day vendor hours and special closures
CREATE TABLE vendor_hours (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  opens_at     time,
  closes_at    time,
  is_closed    boolean NOT NULL DEFAULT false,
  UNIQUE (vendor_id, day_of_week)
);

CREATE TABLE vendor_special_closures (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  closure_date date NOT NULL,
  reason       text,
  UNIQUE (vendor_id, closure_date)
);

ALTER TABLE vendor_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_special_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_manage_hours" ON vendor_hours FOR ALL
  USING (EXISTS (SELECT 1 FROM vendors WHERE id = vendor_id AND owner_id = auth.uid()));
CREATE POLICY "public_read_hours" ON vendor_hours FOR SELECT USING (true);

CREATE POLICY "vendor_manage_closures" ON vendor_special_closures FOR ALL
  USING (EXISTS (SELECT 1 FROM vendors WHERE id = vendor_id AND owner_id = auth.uid()));
CREATE POLICY "public_read_closures" ON vendor_special_closures FOR SELECT USING (true);

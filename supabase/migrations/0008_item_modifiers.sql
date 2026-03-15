-- Item modifier groups and options
CREATE TABLE modifier_groups (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id   uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name           text NOT NULL,
  is_required    boolean NOT NULL DEFAULT false,
  min_selections integer NOT NULL DEFAULT 0,
  max_selections integer NOT NULL DEFAULT 1,
  sort_order     integer NOT NULL DEFAULT 0
);

CREATE TABLE modifier_options (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id         uuid NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name             text NOT NULL,
  price_adjustment numeric(10,2) NOT NULL DEFAULT 0,
  is_default       boolean NOT NULL DEFAULT false,
  is_available     boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0
);

-- Snapshot selected modifiers on order items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifiers jsonb DEFAULT '[]'::jsonb;

ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_manage_modifier_groups" ON modifier_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN vendors v ON v.id = mi.vendor_id
    WHERE mi.id = menu_item_id AND v.owner_id = auth.uid()
  ));
CREATE POLICY "public_read_modifier_groups" ON modifier_groups FOR SELECT USING (true);

CREATE POLICY "vendor_manage_modifier_options" ON modifier_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modifier_groups mg
    JOIN menu_items mi ON mi.id = mg.menu_item_id
    JOIN vendors v ON v.id = mi.vendor_id
    WHERE mg.id = group_id AND v.owner_id = auth.uid()
  ));
CREATE POLICY "public_read_modifier_options" ON modifier_options FOR SELECT USING (true);

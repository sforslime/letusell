-- ─── Drop menus abstraction ────────────────────────────────────────────────────
-- Every vendor had exactly one menu; products now live directly under vendor_id.
ALTER TABLE menu_items DROP COLUMN menu_id;
DROP TABLE menus;

-- ─── Rename core tables ────────────────────────────────────────────────────────
ALTER TABLE menu_items           RENAME TO products;
ALTER TABLE menu_item_categories RENAME TO product_categories;

-- ─── Rename FK columns ─────────────────────────────────────────────────────────
-- modifier_groups referenced menu_items by a column called menu_item_id
ALTER TABLE modifier_groups RENAME COLUMN menu_item_id TO product_id;

-- order_items referenced menu_items; the snapshot columns (item_name, item_price)
-- remain unchanged — only the FK column is renamed.
ALTER TABLE order_items RENAME COLUMN menu_item_id TO product_id;

-- ─── Rename indexes for clarity (non-breaking, cosmetic) ──────────────────────
ALTER INDEX IF EXISTS idx_menu_items_vendor    RENAME TO idx_products_vendor;
ALTER INDEX IF EXISTS idx_menu_items_available RENAME TO idx_products_available;
ALTER INDEX IF EXISTS idx_menu_items_menu      RENAME TO idx_products_vendor_id;

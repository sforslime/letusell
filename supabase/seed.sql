-- Development seed data
-- Run AFTER all migrations

-- Insert sample vendors (not yet approved — admin must approve)
insert into vendors (university_id, name, slug, category, description, location_text, avg_prep_time, opens_at, closes_at, is_approved, is_active)
values
  ('00000000-0000-0000-0000-000000000001', 'Mama Buka Kitchen', 'mama-buka-kitchen', 'local_food', 'Authentic Nigerian home cooking', 'Faculty of Engineering Canteen', 15, '07:30', '19:00', true, true),
  ('00000000-0000-0000-0000-000000000001', 'Campus Grill', 'campus-grill', 'fast_food', 'Burgers, shawarma and grills', 'Student Union Building', 20, '10:00', '21:00', true, true),
  ('00000000-0000-0000-0000-000000000001', 'The Snack Spot', 'the-snack-spot', 'snacks', 'Puff puff, chin chin, and more', 'Block C Corridor', 5, '08:00', '18:00', true, true),
  ('00000000-0000-0000-0000-000000000001', 'Refresh Bar', 'refresh-bar', 'drinks', 'Fresh juices, smoothies and cold drinks', 'Library Entrance', 5, '07:00', '20:00', true, true);

-- Insert menus for each vendor
insert into menus (vendor_id, name)
select id, 'Main Menu' from vendors where university_id = '00000000-0000-0000-0000-000000000001';

-- Insert categories for Mama Buka
insert into menu_item_categories (vendor_id, name, sort_order)
select v.id, cat.name, cat.ord
from vendors v
cross join (values ('Rice Dishes', 0), ('Soups & Stews', 1), ('Sides', 2)) as cat(name, ord)
where v.slug = 'mama-buka-kitchen';

-- Insert menu items for Mama Buka
insert into menu_items (menu_id, vendor_id, category_id, name, description, price, is_available, is_featured)
select
  m.id,
  v.id,
  c.id,
  item.name,
  item.description,
  item.price,
  true,
  item.featured
from vendors v
join menus m on m.vendor_id = v.id
join menu_item_categories c on c.vendor_id = v.id and c.name = item.category
cross join (values
  ('Jollof Rice + Chicken', 'Smoky party jollof with grilled chicken', 1500, 'Rice Dishes', true),
  ('Fried Rice + Beef', 'Nigerian fried rice with stir-fried beef', 1500, 'Rice Dishes', false),
  ('White Rice + Stew', 'Plain white rice with pepper stew', 1000, 'Rice Dishes', false),
  ('Egusi Soup', 'Rich egusi soup with assorted meat', 1800, 'Soups & Stews', true),
  ('Banga Soup', 'Delta-style banga with orishirishi', 2000, 'Soups & Stews', false),
  ('Eba (Small)', 'Garri swallow', 200, 'Sides', false),
  ('Eba (Large)', 'Garri swallow', 350, 'Sides', false),
  ('Salad', 'Garden salad with dressing', 400, 'Sides', false)
) as item(name, description, price, category, featured)
where v.slug = 'mama-buka-kitchen';

-- Insert categories and items for Campus Grill
insert into menu_item_categories (vendor_id, name, sort_order)
select v.id, cat.name, cat.ord
from vendors v
cross join (values ('Burgers', 0), ('Shawarma', 1), ('Drinks', 2)) as cat(name, ord)
where v.slug = 'campus-grill';

insert into menu_items (menu_id, vendor_id, category_id, name, description, price, is_available, is_featured)
select
  m.id, v.id, c.id, item.name, item.description, item.price, true, item.featured
from vendors v
join menus m on m.vendor_id = v.id
join menu_item_categories c on c.vendor_id = v.id and c.name = item.category
cross join (values
  ('Classic Beef Burger', 'Double patty with lettuce, tomato, and special sauce', 2500, 'Burgers', true),
  ('Chicken Burger', 'Crispy chicken fillet burger', 2200, 'Burgers', false),
  ('Chicken Shawarma', 'Wrap with grilled chicken, veggies, garlic sauce', 2000, 'Shawarma', true),
  ('Beef Shawarma', 'Wrap with seasoned beef strips', 2200, 'Shawarma', false),
  ('Malt', '35cl Malt drink', 400, 'Drinks', false),
  ('Bottled Water', '75cl', 200, 'Drinks', false)
) as item(name, description, price, category, featured)
where v.slug = 'campus-grill';

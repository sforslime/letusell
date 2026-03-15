-- Remap legacy food-only category values to the new general-marketplace category
UPDATE vendors SET category = 'food_drinks'
WHERE category IN ('local_food', 'fast_food', 'snacks', 'drinks', 'pastries');

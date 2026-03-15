-- Add 'pending' order status (payment received, awaiting vendor acceptance)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'awaiting_payment','pending','confirmed',
    'preparing','ready','completed','cancelled'
  ));

-- Allow vendor to set status to 'confirmed' (accept) or 'cancelled' (reject)
DROP POLICY IF EXISTS "vendor_update_order_status" ON orders;
CREATE POLICY "vendor_update_order_status" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    status IN ('confirmed','preparing','ready','completed','cancelled')
  );

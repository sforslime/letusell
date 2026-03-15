-- RPC called by webhook and verify endpoint to award loyalty points
CREATE OR REPLACE FUNCTION increment_loyalty_points(user_id uuid, points integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET loyalty_points = loyalty_points + points WHERE id = user_id;
END;
$$;

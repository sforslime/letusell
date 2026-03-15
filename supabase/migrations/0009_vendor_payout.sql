-- Vendor payout / Paystack subaccount info
CREATE TABLE vendor_payout_info (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id                uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  bank_code                text,
  account_number           text,
  account_name             text,
  paystack_subaccount_code text,
  paystack_subaccount_id   text,
  settlement_bank          text,
  percentage_charge        numeric(5,2) DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_payout_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_manage_payout" ON vendor_payout_info FOR ALL
  USING (EXISTS (SELECT 1 FROM vendors WHERE id = vendor_id AND owner_id = auth.uid()));
CREATE POLICY "admin_read_payout" ON vendor_payout_info FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

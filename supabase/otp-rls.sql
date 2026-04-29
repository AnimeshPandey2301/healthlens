-- HealthLens — Run in Supabase SQL Editor to secure OTP and order tables
-- Go to: https://supabase.com/dashboard/project/aqynnlcvkggqkkqgrbty/sql/new

-- OTP records: no client access — only server can read/write via service role
ALTER TABLE otp_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to otp_records" ON otp_records;
CREATE POLICY "No client access to otp_records"
  ON otp_records FOR ALL TO anon, authenticated
  USING (false);

-- Medicine orders: no direct client access — only server via service role
ALTER TABLE medicine_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access" ON medicine_orders;
CREATE POLICY "No direct client access"
  ON medicine_orders FOR ALL TO anon, authenticated
  USING (false);

SELECT 'RLS policies applied successfully! ✅' AS status;

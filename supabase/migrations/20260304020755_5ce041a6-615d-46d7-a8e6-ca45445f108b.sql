
-- Create admin-only table for Stripe customer data
CREATE TABLE public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers FORCE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all stripe customers"
ON stripe_customers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage stripe customers"
ON stripe_customers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data
INSERT INTO stripe_customers (user_id, stripe_customer_id)
SELECT user_id, stripe_customer_id FROM profiles
WHERE stripe_customer_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove stripe_customer_id from profiles
ALTER TABLE profiles DROP COLUMN stripe_customer_id;

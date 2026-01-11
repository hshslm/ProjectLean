-- Add subscription tracking and coaching client override columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_subscribed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS scan_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS is_coaching_client boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_coaching_client IS 'Override flag - grants unlimited access without subscription';
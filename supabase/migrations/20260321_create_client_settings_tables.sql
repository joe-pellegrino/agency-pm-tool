-- New columns on clients table (if not already present)
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create client_portal_mapping table
CREATE TABLE IF NOT EXISTS client_portal_mapping (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL UNIQUE,
  portal_client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_mapping_client ON client_portal_mapping(client_id);

-- Create client_team_assignments table
CREATE TABLE IF NOT EXISTS client_team_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  team_member_id text NOT NULL,
  role text DEFAULT 'member',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_client_team_client ON client_team_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_team_member ON client_team_assignments(team_member_id);

-- Create client_billing table
CREATE TABLE IF NOT EXISTS client_billing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL UNIQUE,
  monthly_retainer numeric(10,2),
  contract_start date,
  contract_end date,
  billing_contact_name text,
  billing_contact_email text,
  payment_terms text DEFAULT 'net-30',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_client ON client_billing(client_id);

-- Create client_notification_prefs table
CREATE TABLE IF NOT EXISTS client_notification_prefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  team_member_id text NOT NULL,
  email_enabled boolean DEFAULT true,
  digest_frequency text DEFAULT 'realtime',
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_client ON client_notification_prefs(client_id);

-- Seed client_portal_mapping data
INSERT INTO client_portal_mapping (client_id, portal_client_id) VALUES
  ('happy-days', 'f2a74cae-1ee4-4d67-b55e-11b47a50eb9b'),
  ('k-pacho', 'ddb4a0bc-249c-4194-ae1e-e92167514195'),
  ('the-refuge', '7ad708ea-da2d-43f7-b75f-733c71957124')
ON CONFLICT (client_id) DO NOTHING;

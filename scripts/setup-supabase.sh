#!/bin/bash

# Source environment variables
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi

SUPABASE_URL="https://najrksokhyyhqgokxbys.supabase.co"
SERVICE_KEY="$AGENCY_PM_SERVICE_KEY"

echo "Setting up Supabase tables..."

# Create the agency_settings table via SQL
curl -X POST "https://najrksokhyyhqgokxbys.supabase.co/rest/v1/rpc/query" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS agency_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT UNIQUE NOT NULL, value TEXT, updated_at TIMESTAMPTZ DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);"
  }'

echo ""
echo "Setup complete!"

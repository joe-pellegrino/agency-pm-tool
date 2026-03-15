#!/bin/bash

SUPABASE_URL="https://najrksokhyyhqgokxbys.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E"

curl -i -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_adhoc INTEGER NOT NULL DEFAULT 0 CHECK (is_adhoc IN (0, 1)); ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_notes TEXT NOT NULL DEFAULT '\'\';"
  }'

-- Drop the separate campaigns table (no longer needed)
-- Campaigns are now projects/initiatives where type = 'campaign'

DROP TRIGGER IF EXISTS campaigns_updated_at_trigger ON campaigns;
DROP FUNCTION IF EXISTS update_campaigns_updated_at();
DROP TABLE IF EXISTS campaigns;

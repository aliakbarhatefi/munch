-- Active deals by time window
CREATE INDEX IF NOT EXISTS idx_deal_active_time
ON deal (start_time, end_time)
WHERE is_active = true;

-- Days of week array lookups
CREATE INDEX IF NOT EXISTS idx_deal_dow
ON deal USING GIN (days_of_week);

-- Ensure useful ops for LIKE/ILIKE-prefix on city (case-insensitive)
-- This supports queries like: lower(r.city) LIKE lower($1 || '%')
CREATE INDEX IF NOT EXISTS idx_restaurant_city_lower_like
  ON restaurant (lower(city) text_pattern_ops);

-- Lat/Lng bounding box
CREATE INDEX IF NOT EXISTS idx_restaurant_lat_lng
  ON restaurant (lat, lng);

-- Rating filter/sort
CREATE INDEX IF NOT EXISTS idx_restaurant_rating
  ON restaurant (rating);

-- Cuisine tag overlap (text[])
CREATE INDEX IF NOT EXISTS idx_restaurant_cuisine_tags
  ON restaurant USING GIN (cuisine_tags);

-- Deals: active flag
CREATE INDEX IF NOT EXISTS idx_deal_active
  ON deal (is_active);

-- Days-of-week array (int[])
CREATE INDEX IF NOT EXISTS idx_deal_days_of_week
  ON deal USING GIN (days_of_week);

-- Time window comparisons
CREATE INDEX IF NOT EXISTS idx_deal_time_window
  ON deal (start_time, end_time);

-- Valid date range checks
CREATE INDEX IF NOT EXISTS idx_deal_valid_range
  ON deal (valid_from, valid_to);

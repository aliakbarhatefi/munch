-- One owner
insert into app_user (email, password_hash, role)
values ('owner@example.com', '$argon2id$v=19$m=65536,t=3,p=1$u5gXhK4...REPLACE_ME...', 'owner')
on conflict (email) do nothing;

-- Restaurants (GTA / Milton / Toronto)
insert into restaurant (owner_id, name, address, city, province, postal_code, lat, lng, phone, website_url, price_range, cuisine_tags, rating, reviews_count, pickup_only)
select id, 'Mama''s Pizza', '123 Main St', 'Milton', 'ON', 'L9T 1A1', 43.5215, -79.8774, '905-555-1234', 'https://mamaspizza.example', '$', ARRAY['Pizza','Italian'], 4.2, 120, true
from app_user where email='owner@example.com'
on conflict do nothing;

insert into restaurant (owner_id, name, address, city, province, postal_code, lat, lng, phone, website_url, price_range, cuisine_tags, rating, reviews_count, pickup_only)
select id, 'Silver Spoon', '456 Maple Ave', 'Milton', 'ON', 'L9T 2B2', 43.5189, -79.8789, '905-555-5678', 'https://silverspoon.example', '$', ARRAY['Pakistani','Indian','Biryani'], 4.4, 310, true
from app_user where email='owner@example.com'
on conflict do nothing;

insert into restaurant (owner_id, name, address, city, province, postal_code, lat, lng, phone, website_url, price_range, cuisine_tags, rating, reviews_count, pickup_only)
select id, 'St. Louis Bar & Grill', '789 King St', 'Toronto', 'ON', 'M5V 1K4', 43.6441, -79.4029, '416-555-2468', 'https://stlouis.example', '$$', ARRAY['Wings','Bar','Pub'], 4.0, 900, true
from app_user where email='owner@example.com'
on conflict do nothing;

-- Deals (simple daily windows)
insert into deal (restaurant_id, title, description, discount_type, discount_value, start_time, end_time, days_of_week, is_active)
select r.id, 'Two Slices + Pop', 'Lunch special 11–2', 'FIXED', 6.99, '11:00', '14:00', '{1,2,3,4,5}', true
from restaurant r where r.name='Mama''s Pizza';

insert into deal (restaurant_id, title, description, discount_type, discount_value, start_time, end_time, days_of_week, is_active)
select r.id, 'Biryani Wednesday', 'Chicken biryani special', 'PERCENT', 20.00, '12:00', '20:00', '{3}', true
from restaurant r where r.name='Silver Spoon';

insert into deal (restaurant_id, title, description, discount_type, discount_value, start_time, end_time, days_of_week, is_active)
select r.id, 'Wing Night', '1/2 price wings after 9pm', 'PERCENT', 50.00, '21:00', '23:59', '{4}', true
from restaurant r where r.name='St. Louis Bar & Grill';

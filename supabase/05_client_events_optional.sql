-- Optional: enable direct client inserts from App using anon key
-- Only run if you want to log from the browser.

-- Analytics events from App
DROP POLICY IF EXISTS "pub_analytics_insert" ON public.analytics;
CREATE POLICY "pub_analytics_insert"
ON public.analytics
FOR INSERT
TO anon
WITH CHECK (true);
GRANT INSERT ON public.analytics TO anon;

-- Order clicks from App
DROP POLICY IF EXISTS "pub_order_clicks_insert" ON public.order_clicks;
CREATE POLICY "pub_order_clicks_insert"
ON public.order_clicks
FOR INSERT
TO anon
WITH CHECK (true);
GRANT INSERT ON public.order_clicks TO anon;

-- Public review submissions (moderated via is_approved)
-- Uncomment if needed
-- DROP POLICY IF EXISTS "pub_reviews_insert" ON public.reviews;
-- CREATE POLICY "pub_reviews_insert"
-- ON public.reviews
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);
-- GRANT INSERT ON public.reviews TO anon;

-- Taliyo Marketplace Seed Data
-- Sample data for development and testing

-- =============================================
-- INSERT CATEGORIES
-- =============================================
INSERT INTO categories (name, description, icon, slug) VALUES
('Technology', 'Web development, mobile apps, and digital solutions', 'web', 'technology'),
('Design', 'Graphic design, UI/UX, and creative services', 'design', 'design'),
('Marketing', 'Digital marketing, SEO, and advertising', 'marketing', 'marketing');

-- =============================================
-- INSERT SUBCATEGORIES
-- =============================================
INSERT INTO subcategories (category_id, name, slug) VALUES
-- Technology subcategories
((SELECT id FROM categories WHERE slug = 'technology'), 'Web Development', 'web-development'),
((SELECT id FROM categories WHERE slug = 'technology'), 'Mobile App Development', 'mobile-app-development'),
((SELECT id FROM categories WHERE slug = 'technology'), 'E-commerce Development', 'ecommerce-development'),
((SELECT id FROM categories WHERE slug = 'technology'), 'Software Development', 'software-development'),

-- Design subcategories
((SELECT id FROM categories WHERE slug = 'design'), 'Logo Design', 'logo-design'),
((SELECT id FROM categories WHERE slug = 'design'), 'UI/UX Design', 'ui-ux-design'),
((SELECT id FROM categories WHERE slug = 'design'), 'Graphic Design', 'graphic-design'),
((SELECT id FROM categories WHERE slug = 'design'), 'Brand Identity', 'brand-identity'),

-- Marketing subcategories
((SELECT id FROM categories WHERE slug = 'marketing'), 'Digital Marketing', 'digital-marketing'),
((SELECT id FROM categories WHERE slug = 'marketing'), 'SEO Services', 'seo-services'),
((SELECT id FROM categories WHERE slug = 'marketing'), 'Social Media Marketing', 'social-media-marketing'),
((SELECT id FROM categories WHERE slug = 'marketing'), 'Content Marketing', 'content-marketing');

-- =============================================
-- INSERT SAMPLE SERVICES
-- =============================================
INSERT INTO services (
    title, description, category_id, subcategory_id, 
    price_min, price_max, price_type, duration_minutes,
    location, is_remote, images, 
    provider_name, provider_avatar, provider_bio, provider_phone, provider_verified,
    rating_average, rating_count, is_featured, slug
) VALUES
-- Technology Services
(
    'Professional Website Development',
    'Custom responsive websites built with modern technologies. Includes design, development, hosting setup, and 3 months support. Perfect for businesses looking to establish their online presence.',
    (SELECT id FROM categories WHERE slug = 'technology'),
    (SELECT id FROM subcategories WHERE slug = 'web-development'),
    15000, 50000, 'fixed', 2880,
    'Delhi NCR', true, 
    '["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop"]',
    'Tech Solutions Pro', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', 
    'Professional web development team with 5+ years experience in modern web technologies.', '+91 98765 43210', true,
    4.8, 124, true, 'professional-website-development'
),
(
    'Mobile App Development (Android & iOS)',
    'Native and cross-platform mobile applications. Full development cycle from concept to app store deployment. Includes UI/UX design, development, testing, and deployment.',
    (SELECT id FROM categories WHERE slug = 'technology'),
    (SELECT id FROM subcategories WHERE slug = 'mobile-app-development'),
    25000, 100000, 'fixed', 4320,
    'Mumbai', true,
    '["https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop"]',
    'Mobile Masters', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    'Specialized mobile app development company with 50+ successful app launches.', '+91 87654 32109', true,
    4.9, 89, true, 'mobile-app-development-android-ios'
),
(
    'E-commerce Website with Payment Gateway',
    'Complete e-commerce solution with product catalog, shopping cart, payment integration, order management, and admin panel. Ready to start selling online.',
    (SELECT id FROM categories WHERE slug = 'technology'),
    (SELECT id FROM subcategories WHERE slug = 'ecommerce-development'),
    30000, 80000, 'fixed', 3600,
    'Bangalore', true,
    '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop"]',
    'E-commerce Experts', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
    'E-commerce specialists helping businesses sell online with secure and scalable solutions.', '+91 76543 21098', true,
    4.7, 156, false, 'ecommerce-website-payment-gateway'
),

-- Design Services
(
    'Professional Logo Design & Brand Identity',
    'Complete brand identity package including logo design, color palette, typography, business cards, letterhead, and brand guidelines. Multiple concepts and unlimited revisions.',
    (SELECT id FROM categories WHERE slug = 'design'),
    (SELECT id FROM subcategories WHERE slug = 'logo-design'),
    5000, 25000, 'fixed', 720,
    'Delhi', false,
    '["https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop"]',
    'Creative Studio', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    'Award-winning design studio specializing in brand identity and visual communication.', '+91 65432 10987', true,
    4.9, 203, true, 'professional-logo-design-brand-identity'
),
(
    'UI/UX Design for Web & Mobile Apps',
    'User-centered design for websites and mobile applications. Includes user research, wireframing, prototyping, visual design, and usability testing.',
    (SELECT id FROM categories WHERE slug = 'design'),
    (SELECT id FROM subcategories WHERE slug = 'ui-ux-design'),
    12000, 40000, 'fixed', 1440,
    'Pune', true,
    '["https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=600&fit=crop"]',
    'UX Design Lab', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    'UX/UI design experts creating intuitive and beautiful digital experiences.', '+91 54321 09876', true,
    4.8, 167, true, 'ui-ux-design-web-mobile-apps'
),

-- Marketing Services
(
    'Complete Digital Marketing Package',
    'Comprehensive digital marketing including SEO, Google Ads, Facebook Ads, content marketing, email marketing, and monthly reporting. Boost your online presence.',
    (SELECT id FROM categories WHERE slug = 'marketing'),
    (SELECT id FROM subcategories WHERE slug = 'digital-marketing'),
    8000, 30000, 'hourly', 0,
    'Gurgaon', true,
    '["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1553830591-fddf9c346e35?w=800&h=600&fit=crop"]',
    'Digital Growth Agency', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    'Digital marketing agency helping businesses grow online with proven strategies.', '+91 43210 98765', true,
    4.6, 134, false, 'complete-digital-marketing-package'
),
(
    'SEO Optimization & Google Ranking',
    'Professional SEO services to improve your website ranking on Google. Includes keyword research, on-page optimization, link building, and monthly reports.',
    (SELECT id FROM categories WHERE slug = 'marketing'),
    (SELECT id FROM subcategories WHERE slug = 'seo-services'),
    6000, 20000, 'hourly', 0,
    'Chennai', true,
    '["https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1553830591-d8632a99e6ff?w=800&h=600&fit=crop"]',
    'SEO Masters', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    'SEO specialists with proven track record of improving website rankings and traffic.', '+91 32109 87654', true,
    4.7, 198, false, 'seo-optimization-google-ranking'
);

-- =============================================
-- INSERT SAMPLE REVIEWS
-- =============================================
INSERT INTO reviews (service_id, customer_name, rating, review_text, is_approved) VALUES
-- Reviews for Website Development
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'Rajesh Kumar', 5, 'Excellent work! They delivered exactly what I wanted. Professional team and great communication throughout the project.', true),
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'Priya Sharma', 5, 'Amazing website design and development. Very responsive and delivered on time. Highly recommended!', true),
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'Amit Singh', 4, 'Good quality work. Minor delays but overall satisfied with the final result.', true),

-- Reviews for Mobile App Development
((SELECT id FROM services WHERE slug = 'mobile-app-development-android-ios'), 'Neha Gupta', 5, 'Outstanding mobile app development! The app works perfectly on both Android and iOS. Great user experience.', true),
((SELECT id FROM services WHERE slug = 'mobile-app-development-android-ios'), 'Vikram Patel', 5, 'Professional team with excellent technical skills. They understood our requirements perfectly.', true),

-- Reviews for Logo Design
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'Sunita Agarwal', 5, 'Beautiful logo design! They created multiple options and worked with us until we were 100% satisfied.', true),
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'Rohit Mehta', 5, 'Creative and professional. The complete brand identity package exceeded our expectations.', true),
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'Kavya Reddy', 4, 'Great design work. Quick turnaround and good communication.', true);

-- =============================================
-- INSERT SAMPLE BOOKINGS
-- =============================================
INSERT INTO bookings (service_id, customer_name, customer_phone, customer_email, message, status, quoted_price) VALUES
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'Arjun Malhotra', '+91 98765 43210', 'arjun@example.com', 'Hi! I want to book Professional Website Development service. I need a website for my restaurant business.', 'confirmed', 25000),
((SELECT id FROM services WHERE slug = 'mobile-app-development-android-ios'), 'Deepika Joshi', '+91 87654 32109', 'deepika@example.com', 'Interested in mobile app development for my fitness startup. Can we discuss the requirements?', 'pending', NULL),
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'Karan Kapoor', '+91 76543 21098', 'karan@example.com', 'Need logo design for my new tech company. Looking for modern and professional design.', 'confirmed', 8000);

-- =============================================
-- INSERT ADMIN USERS
-- =============================================
INSERT INTO admins (email, name, role) VALUES
('taliyotechnologies@gmail.com', 'Taliyo Super Admin', 'super_admin');

-- =============================================
-- INSERT SETTINGS
-- =============================================
INSERT INTO settings (key, value, description) VALUES
('app_name', '"Taliyo Marketplace"', 'Application name'),
('support_phone', '"+917042523611"', 'Support phone number'),
('support_whatsapp', '"917042523611"', 'Support WhatsApp number'),
('support_email', '"contact@taliyotechnologies.com"', 'Support email address'),
('maintenance_mode', 'false', 'Maintenance mode status'),
('auto_approve_reviews', 'false', 'Auto approve reviews'),
('max_file_size_mb', '10', 'Maximum file upload size in MB'),
('currency', '"INR"', 'Default currency'),
('currency_symbol', '"₹"', 'Currency symbol'),
('timezone', '"Asia/Kolkata"', 'Default timezone'),
('featured_services_limit', '6', 'Number of featured services to show'),
('reviews_per_page', '10', 'Reviews per page'),
('services_per_page', '12', 'Services per page');

-- =============================================
-- INSERT SAMPLE ANALYTICS
-- =============================================
INSERT INTO analytics (service_id, event_type, user_ip, user_agent) VALUES
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'view', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
((SELECT id FROM services WHERE slug = 'professional-website-development'), 'whatsapp_click', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
((SELECT id FROM services WHERE slug = 'mobile-app-development-android-ios'), 'view', '192.168.1.2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'),
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'view', '192.168.1.3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
((SELECT id FROM services WHERE slug = 'professional-logo-design-brand-identity'), 'whatsapp_click', '192.168.1.3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
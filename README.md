# Taliyo Admin Panel

A Next.js admin panel for managing the Taliyo marketplace with Supabase backend.

## Features

- 🔐 **Secure Authentication** - Email/password and Google OAuth
- 📊 **Dashboard** - Real-time analytics and metrics
- 📤 **Excel Upload** - Bulk upload services, products, and packages
- 📈 **Click Tracking** - Monitor WhatsApp order clicks
- 👥 **Admin Management** - Control panel access
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React
- **File Processing**: SheetJS (xlsx)

## Setup

### 1. Environment Variables

Create `.env.local` file in the admin-panel directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2. Supabase Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create items table for services, products, packages
CREATE TABLE items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  type TEXT NOT NULL DEFAULT 'service', -- 'service', 'product', 'package'
  price DECIMAL(10,2),
  whatsapp_link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_clicks table for tracking
CREATE TABLE order_clicks (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admins table
CREATE TABLE admins (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_order_clicks_item_id ON order_clicks(item_id);
CREATE INDEX idx_order_clicks_created_at ON order_clicks(created_at);
```

### 3. Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read items
CREATE POLICY "Allow authenticated users to read items" ON items
FOR SELECT TO authenticated USING (true);

-- Allow service role to manage all data
CREATE POLICY "Allow service role full access to items" ON items
FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access to order_clicks" ON order_clicks
FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access to admins" ON admins
FOR ALL TO service_role USING (true);
```

### 4. Install Dependencies

```bash
cd admin-panel
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## Admin Access

Only pre-approved email addresses can access the admin panel:

- `taliyotechnologies@gmail.com`
- `harshbudhauliya882@gmail.com`

Additional admins can be added through the "Manage Admins" section.

## Excel Upload Format

### Required Columns
- `title` - Item name
- `description` - Item description  
- `category` - Item category
- `price` - Item price (optional)
- `whatsapp_link` - WhatsApp contact link

### Sheet Names
- `services` - For service listings
- `products` - For product listings
- `packages` - For package deals

## API Integration

To track clicks from your main app, send POST requests to:

```javascript
// Track WhatsApp clicks
await supabase
  .from('order_clicks')
  .insert({
    item_id: itemId,
    clicked_at: new Date().toISOString()
  })
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Project Structure

```
admin-panel/
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
├── pages/              # Next.js pages and API routes
├── styles/             # CSS and styling
├── public/             # Static assets
└── README.md
```

## Support

For issues or questions, contact the development team at contact@taliyotechnologies.com

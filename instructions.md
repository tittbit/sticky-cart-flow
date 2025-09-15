# Sticky Cart Drawer - Complete Installation & Setup Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Shopify Partner account
- Vercel account
- Development store

## Step 1: Project Setup

### 1.1 Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd sticky-cart-drawer
npm install
```

### 1.2 Environment Configuration
Create `.env` file in root directory:
```bash
# Supabase Configuration (Already configured)
VITE_SUPABASE_PROJECT_ID="mjfzxmpscndznuaeoxft"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg"
VITE_SUPABASE_URL="https://mjfzxmpscndznuaeoxft.supabase.co"
```

## Step 2: Shopify App Setup

### 2.1 Create Shopify Partner Account
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign up and create a development store
3. Create a new app in Partner Dashboard

### 2.2 Configure Shopify App (.env in shopify-app-setup folder)
```bash
# Navigate to shopify-app-setup directory
cd shopify-app-setup

# Create .env file with YOUR actual credentials
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
SCOPES=write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields
SHOPIFY_APP_URL=https://your-app-name.vercel.app
DATABASE_URL=postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres
```

### 2.3 Update shopify.app.toml
```toml
name = "sticky-cart-drawer"
client_id = "your_api_key_here"
application_url = "https://your-app-name.vercel.app"
embedded = true

[access_scopes]
scopes = "write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields"

[auth]
redirect_urls = [
  "https://your-app-name.vercel.app/auth/callback",
  "https://your-app-name.vercel.app/auth/shopify/callback"
]

[build]
automatically_update_urls_on_dev = true
dev_store_url = "https://your-dev-store.myshopify.com"
include_config_on_deploy = true
```

## Step 3: Database Configuration

### 3.1 Supabase Database URL
Your database is already configured with Supabase:
- **Project ID**: mjfzxmpscndznuaeoxft
- **Database URL**: `https://mjfzxmpscndznuaeoxft.supabase.co`
- **Connection String**: `postgresql://postgres:[YOUR-PASSWORD]@db.mjfzxmpscndznuaeoxft.supabase.co:5432/postgres`

### 3.2 Get Your Database Password
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mjfzxmpscndznuaeoxft/settings/database)
2. Copy your database password
3. Use it in the DATABASE_URL format above

## Step 4: Vercel Deployment Setup

### 4.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 4.2 Vercel Configuration
The `vercel.json` file is already created with proper configuration.

### 4.3 Environment Variables for Vercel
Set these in your Vercel dashboard or via CLI:

```bash
# Main App Environment Variables
vercel env add VITE_SUPABASE_PROJECT_ID
# Enter: mjfzxmpscndznuaeoxft

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg

vercel env add VITE_SUPABASE_URL
# Enter: https://mjfzxmpscndznuaeoxft.supabase.co

# Shopify App Environment Variables
vercel env add SHOPIFY_API_KEY
# Enter: your_api_key_from_partner_dashboard

vercel env add SHOPIFY_API_SECRET
# Enter: your_api_secret_from_partner_dashboard

vercel env add DATABASE_URL
# Enter: postgresql://postgres:your_password@db.mjfzxmpscndznuaeoxft.supabase.co:5432/postgres

vercel env add SHOPIFY_APP_URL
# Enter: https://your-app-name.vercel.app

vercel env add SCOPES
# Enter: write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields
```

## Step 5: Local Development

### 5.1 Start Development Server
```bash
# Main app development
npm run dev

# Shopify app development (in separate terminal)
cd shopify-app-setup
npm run dev
```

### 5.2 Test Installation
1. Follow the URL provided by Shopify CLI
2. Install app on your development store
3. Test cart drawer functionality

## Step 6: Production Deployment

### 6.1 Deploy to Vercel
```bash
# Deploy from root directory
vercel --prod

# Or push to GitHub (auto-deploys if connected)
git add .
git commit -m "Deploy to production"
git push origin main
```

### 6.2 Update Shopify URLs
After deployment:
1. Update App URL in Partner Dashboard to your Vercel domain
2. Update redirect URLs in Partner Dashboard
3. Update `SHOPIFY_APP_URL` environment variable

## Step 7: Database Migration (If Needed)

If you need to run database migrations:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref mjfzxmpscndznuaeoxft

# Run migrations (if any new ones)
supabase db push
```

## Step 8: Verification Checklist

### ✅ Frontend App
- [ ] Lovable app loads correctly
- [ ] Cart drawer appears and functions
- [ ] Sticky button works
- [ ] Admin dashboard accessible

### ✅ Shopify App
- [ ] OAuth flow works
- [ ] App installs successfully
- [ ] Settings save correctly
- [ ] Storefront integration works

### ✅ Backend APIs
- [ ] Shop configuration API responds
- [ ] Analytics API tracks events
- [ ] Billing API processes subscriptions

## Troubleshooting

### Common Issues:

**1. Database Connection Errors**
- Verify DATABASE_URL format
- Check Supabase project password
- Ensure project ID is correct

**2. Shopify OAuth Errors**
- Verify API keys match Partner Dashboard
- Check redirect URLs are identical
- Ensure app URL is accessible

**3. Vercel Deployment Errors**
- Check all environment variables are set
- Verify build process completes
- Check function logs in Vercel dashboard

## Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/mjfzxmpscndznuaeoxft
- **Edge Functions**: https://supabase.com/dashboard/project/mjfzxmpscndznuaeoxft/functions
- **Database**: https://supabase.com/dashboard/project/mjfzxmpscndznuaeoxft/editor
- **Vercel Dashboard**: https://vercel.com/dashboard

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase edge function logs
3. Verify all environment variables
4. Test on development store first

Your app is now ready for production! 🚀
# Shopify App Deployment Guide - Sticky Cart Drawer

This guide will walk you through deploying your Shopify app step by step, from initial setup to publishing on the Shopify App Store.

## Prerequisites

Before you start, make sure you have:
- Node.js 18+ installed
- A Shopify Partner account
- A development store
- Git installed
- A Vercel account (for hosting)

## Step 1: Initial Setup

### 1.1 Install Shopify CLI
```bash
npm install -g @shopify/cli @shopify/theme
```

### 1.2 Create Shopify Partner Account
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign up for a partner account
3. Create a development store

### 1.3 Create Your App in Partner Dashboard
1. In your Partner Dashboard, click "Apps"
2. Click "Create app"
3. Choose "Create a new app"
4. Enter app name: "Sticky Cart Drawer"
5. Note down your API key and API secret

## Step 2: Project Configuration

### 2.1 Clone and Setup Project
```bash
# If starting from this project
cd sticky-cart-drawer-shopify-app

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Initialize database
npx prisma db push
```

### 2.2 Configure Environment Variables
Create a `.env` file with your Shopify credentials:

```bash
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
SCOPES=write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields
SHOPIFY_APP_URL=https://your-app-domain.vercel.app
DATABASE_URL=file:./dev.sqlite
```

### 2.3 Update shopify.app.toml
```toml
name = "sticky-cart-drawer"
client_id = "your_api_key_here"
application_url = "https://your-app-domain.vercel.app"
embedded = true

[access_scopes]
scopes = "write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields"

[auth]
redirect_urls = [
  "https://your-app-domain.vercel.app/auth/callback",
  "https://your-app-domain.vercel.app/auth/shopify/callback"
]

[build]
automatically_update_urls_on_dev = true
dev_store_url = "https://your-dev-store.myshopify.com"
include_config_on_deploy = true
```

## Step 3: Development and Testing

### 3.1 Start Development Server
```bash
npm run dev
```

This will:
- Start the local development server
- Open a tunnel for Shopify to access your app
- Automatically configure your app URLs

### 3.2 Install App on Development Store
1. Follow the URL provided by the dev server
2. Install the app on your development store
3. Test all features in your store

### 3.3 Test Core Features
- ✅ App installation and OAuth flow
- ✅ Embedded admin panel loads correctly
- ✅ Settings can be saved and retrieved
- ✅ Cart drawer appears on storefront
- ✅ Sticky button functionality
- ✅ Add to cart integration works

## Step 4: Deployment Setup

### 4.1 Setup Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub repository

### 4.2 Create Production Database
For production, you'll need a proper database. Options:
- **PlanetScale** (recommended, free tier available)
- **Railway** 
- **Neon**

Update your `DATABASE_URL` in production environment variables.

### 4.3 Configure Vercel
Create `vercel.json` in your project root:

```json
{
  "functions": {
    "app/entry.server.tsx": {
      "includeFiles": "prisma/**"
    }
  },
  "env": {
    "SHOPIFY_API_KEY": "your_production_api_key",
    "SHOPIFY_API_SECRET": "your_production_api_secret",
    "SHOPIFY_APP_URL": "https://your-app-domain.vercel.app",
    "DATABASE_URL": "your_production_database_url",
    "SCOPES": "write_products,write_themes,write_script_tags,read_products,read_orders,write_metafields,read_metafields"
  }
}
```

## Step 5: Production Deployment

### 5.1 Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or push to GitHub if connected
git add .
git commit -m "Deploy to production"
git push origin main
```

### 5.2 Update Shopify App URLs
1. In Partner Dashboard, go to your app
2. Update App URL to your Vercel domain
3. Update Allowed redirection URL(s)

### 5.3 Configure Webhooks (Optional)
```bash
shopify app generate webhook
```

## Step 6: App Store Submission

### 6.1 Prepare App Listing
Required materials:
- App name and description
- App icon (1024x1024px)
- Screenshots (1280x720px)
- Privacy policy URL
- Support contact information

### 6.2 App Review Checklist
- ✅ App works on multiple themes
- ✅ Mobile responsive design
- ✅ Handles errors gracefully
- ✅ Uninstall process works correctly
- ✅ GDPR compliance (if applicable)
- ✅ Performance optimized

### 6.3 Submit for Review
1. In Partner Dashboard, go to "App Store listing"
2. Fill out all required information
3. Upload screenshots and assets
4. Submit for review

## Step 7: Post-Launch

### 7.1 Monitor Performance
- Track app installations
- Monitor error logs
- Collect user feedback

### 7.2 Implement Analytics
```javascript
// Add to your storefront integration
analytics.track('cart_drawer_opened', {
  store: shop.domain,
  timestamp: Date.now()
});
```

### 7.3 Customer Support
Set up channels for:
- Bug reports
- Feature requests
- General support

## Common Issues and Solutions

### Issue: OAuth errors during installation
**Solution**: Verify redirect URLs match exactly in both `shopify.app.toml` and Partner Dashboard

### Issue: App not loading in admin
**Solution**: Check that your app URL is accessible and returns proper headers

### Issue: Storefront integration not working
**Solution**: Verify ScriptTag injection and App Proxy configuration

### Issue: Database connection errors
**Solution**: Ensure DATABASE_URL is correct and database is accessible from Vercel

## Pricing Configuration

Update your app to include pricing tiers:

```typescript
// In app/routes/app.pricing.tsx
const PRICING_PLANS = [
  {
    name: "Basic",
    price: 29.99,
    orderLimit: 200,
    features: ["Cart Drawer", "Sticky Button", "Basic Analytics"]
  },
  {
    name: "Growth", 
    price: 34.99,
    orderLimit: 500,
    features: ["Everything in Basic", "Upsells", "Cross-sells", "Advanced Analytics"]
  },
  {
    name: "Pro",
    price: 54.99,
    orderLimit: 1000,
    features: ["Everything in Growth", "A/B Testing", "Custom Styling", "Priority Support"]
  }
];
```

## Security Best Practices

1. **Environment Variables**: Never commit API keys or secrets
2. **HTTPS**: Always use HTTPS in production
3. **Input Validation**: Validate all user inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Error Handling**: Don't expose sensitive information in errors

## Support and Resources

- [Shopify App Development Documentation](https://shopify.dev/docs/apps)
- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Shopify Partner Community](https://community.shopify.com/c/shopify-partners/ct-p/shopify-partners)
- [Remix Documentation](https://remix.run/docs)

## Next Steps

1. **Testing**: Thoroughly test your app on different stores and themes
2. **Performance**: Optimize loading times and API calls  
3. **Features**: Consider additional features based on user feedback
4. **Marketing**: Prepare marketing materials and launch strategy

Your Shopify app is now ready for deployment! Follow this guide step by step, and you'll have a production-ready app published on the Shopify App Store.
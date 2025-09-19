# Shopify App Setup - Sticky Cart Drawer

This directory contains all the files and instructions needed to create a proper Shopify app from your current prototype.

## Quick Start

### 1. Create New Shopify App Project
```bash
# Create new Shopify app using CLI
npm create @shopify/app@latest sticky-cart-drawer-app

# Choose these options:
# - Framework: Remix
# - Language: TypeScript  
# - Template: Start with Remix (recommended)
# - Package manager: npm
```

### 2. Replace Generated Files
After creating the app, replace these files with the ones from this setup directory:

- Copy `shopify.app.toml` to project root
- Copy `app/` directory contents to your app directory
- Copy `extensions/` directory to project root
- Copy `prisma/schema.prisma` to project root
- Copy `.env.example` and create your `.env` file

### 3. Install and Configure

```bash
cd sticky-cart-drawer-app
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual Shopify credentials

# Initialize database
npx prisma generate
npx prisma db push

# Link to your Partner Dashboard app
shopify app config link

# Start development
npm run dev
```

## Files Included

### Core App Files
- `shopify.app.toml` - Shopify app configuration
- `app/shopify.server.ts` - Shopify app server setup
- `app/db.server.ts` - Database configuration
- `prisma/schema.prisma` - Database schema

### App Routes
- `app/routes/_index.tsx` - Main app layout with Polaris
- `app/routes/app._index.tsx` - Dashboard page

### Theme Extension
- `extensions/sticky-cart-drawer/` - Theme app extension with cart drawer functionality
- `assets/cart-drawer.js` - Main JavaScript for storefront
- `assets/cart-drawer.css` - Styles for cart drawer

### Configuration
- `.env.example` - Environment variables template
- `package.json` - Updated dependencies for Shopify app
- `remix.config.js` - Remix configuration
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions

## What This Setup Includes

### ✅ Shopify App Features
- OAuth authentication flow
- Embedded admin panel with Polaris UI  
- Metafields for settings storage
- ScriptTag injection for storefront integration
- App proxy for secure data access
- Webhook handling for app lifecycle

### ✅ Cart Drawer Features  
- Sticky cart button with item count
- Slide-out cart drawer (mobile responsive)
- Cart item management (add/remove/update quantities)
- Free shipping progress bar
- Upsells and cross-sells sections
- Discount code application
- Custom announcements

### ✅ Integration Features
- Automatic theme integration via ScriptTag
- No manual theme edits required by merchants
- Shopify Cart API integration
- Product fetching for upsells
- Analytics event tracking ready

### ✅ Business Features
- Subscription billing integration ready
- Multiple pricing tiers support
- 14-day free trial configuration
- Order limits per plan
- App Store submission ready

## Development Workflow

1. **Prototype** (Current) - Build and test UI/UX in Lovable
2. **Shopify App** (Next) - Use this setup to create proper Shopify app
3. **Testing** - Test on development stores
4. **Deployment** - Deploy to Vercel with production database
5. **Submission** - Submit to Shopify App Store

## Next Steps

1. Follow the Quick Start guide above
2. Customize the admin panel UI to match your prototype
3. Configure your pricing plans and billing
4. Test thoroughly on multiple stores and themes
5. Deploy and submit for App Store review

Your prototype is ready to become a real Shopify app! 🚀
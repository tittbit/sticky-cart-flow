# Sticky Cart Drawer - Shopify App Setup

This directory contains the Shopify app setup for the Sticky Cart Drawer.

## Architecture

The app uses an **App Proxy** approach instead of theme extension embeds for better compatibility and control:

### App Proxy Configuration
- **Proxy URL**: `https://sticky-cart-flow.vercel.app/proxy`
- **Subpath**: `cart-drawer` 
- **Prefix**: `tools`

This makes the cart drawer accessible at: `https://[shop].myshopify.com/tools/cart-drawer/`

### Routes
- `/proxy/settings` - Returns cart drawer settings from Supabase
- `/proxy/script` - Serves the cart-drawer.js file with shop domain injected

### Theme Extension
A minimal theme extension (`sticky-cart-minimal`) provides a simple loader that:
1. Loads the cart drawer script from the app proxy
2. Only runs on storefront (not theme editor)
3. Handles errors gracefully

### Benefits
- No theme dependency issues
- Dynamic script serving with shop context
- Easy updates without theme modifications
- Better error handling and debugging
- Reduced conflicts with other apps

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

## Files Structure

```
shopify-app-setup/
├── app/
│   ├── assets/
│   │   └── cart-drawer.js          # Main cart drawer script
│   └── routes/
│       ├── proxy.settings.ts       # Settings API
│       └── proxy.script.ts         # Script serving
├── extensions/
│   └── sticky-cart-minimal/
│       ├── shopify.extension.toml
│       └── blocks/
│           └── cart-loader.liquid  # Minimal loader
└── shopify.app.toml                # App configuration
```

## What This Setup Includes

### ✅ Shopify App Features
- OAuth authentication flow
- Embedded admin panel with Polaris UI  
- App proxy for secure data access
- Webhook handling for app lifecycle
- Minimal theme extension for easy installation

### ✅ Cart Drawer Features  
- Sticky cart button with item count
- Slide-out cart drawer (mobile responsive)
- Cart item management (add/remove/update quantities)
- Free shipping progress bar
- Upsells and cross-sells sections
- Native cart blocking and replacement

### ✅ Integration Features
- App proxy serving for better compatibility
- No manual theme edits required by merchants
- Shopify Cart API integration
- Product fetching for upsells
- Settings managed via Supabase

### ✅ Business Features
- Subscription billing integration ready
- Multiple pricing tiers support
- Analytics event tracking ready
- Easy customization and updates

## Development

The cart drawer script is automatically served with the correct shop domain injected. Settings are loaded from Supabase and cached appropriately.

For debugging, check the browser console for "Sticky Cart:" prefixed messages.

## Deployment

1. **Deploy the app** to Vercel/production
2. **Install the theme extension** via Shopify CLI:
   ```bash
   shopify app deploy
   ```
3. **Enable the extension** in the merchant's theme editor
4. **Configure settings** in the app dashboard

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
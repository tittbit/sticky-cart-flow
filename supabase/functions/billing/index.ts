import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Plan configurations
const PLANS = {
  starter: {
    name: 'Starter',
    price: 9,
    limits: {
      orders: 100,
      features: ['basic_cart', 'free_shipping_bar']
    }
  },
  growth: {
    name: 'Growth',
    price: 29,
    limits: {
      orders: 1000,
      features: ['basic_cart', 'free_shipping_bar', 'upsells', 'discount_codes']
    }
  },
  pro: {
    name: 'Pro',
    price: 79,
    limits: {
      orders: 10000,
      features: ['basic_cart', 'free_shipping_bar', 'upsells', 'discount_codes', 'analytics', 'priority_support']
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
    
    if (!shopDomain) {
      return new Response(JSON.stringify({ error: 'Shop domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get billing information
      const { data: config, error } = await supabase
        .from('shop_configurations')
        .select('*')
        .eq('shop_domain', shopDomain)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching billing info:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch billing information' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: usage, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('shop_domain', shopDomain)
        .eq('month', currentMonth)
        .single();

      const currentPlan = config?.subscription_plan || 'starter';
      const planConfig = PLANS[currentPlan as keyof typeof PLANS];
      const currentUsage = usage?.orders_processed || 0;
      const usagePercentage = (currentUsage / planConfig.limits.orders * 100).toFixed(1);

      // Generate fake billing history for demo
      const billingHistory = [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: planConfig.price,
          plan: planConfig.name,
          status: 'paid'
        },
        {
          id: '2', 
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: planConfig.price,
          plan: planConfig.name,
          status: 'paid'
        },
        {
          id: '3',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: planConfig.price,
          plan: planConfig.name,
          status: 'paid'
        }
      ];

      return new Response(JSON.stringify({
        success: true,
        subscription: {
          status: config?.subscription_status || 'trial',
          plan: currentPlan,
          trialEndsAt: config?.trial_ends_at,
          price: planConfig.price,
          limits: planConfig.limits,
          usage: {
            orders: currentUsage,
            ordersLimit: planConfig.limits.orders,
            usagePercentage: parseFloat(usagePercentage)
          }
        },
        plans: PLANS,
        billingHistory
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Handle plan changes and billing actions
      const { action, plan } = await req.json();
      
      if (action === 'change_plan') {
        if (!plan || !PLANS[plan as keyof typeof PLANS]) {
          return new Response(JSON.stringify({ error: 'Invalid plan' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update subscription plan
        const { error } = await supabase
          .from('shop_configurations')
          .upsert({
            shop_domain: shopDomain,
            subscription_plan: plan,
            subscription_status: 'active',
            settings: {} // Keep existing settings
          }, {
            onConflict: 'shop_domain'
          });

        if (error) {
          console.error('Error updating plan:', error);
          return new Response(JSON.stringify({ error: 'Failed to update plan' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Successfully upgraded to ${PLANS[plan as keyof typeof PLANS].name} plan`,
          plan
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'cancel_subscription') {
        const { error } = await supabase
          .from('shop_configurations')
          .update({
            subscription_status: 'cancelled'
          })
          .eq('shop_domain', shopDomain);

        if (error) {
          console.error('Error cancelling subscription:', error);
          return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Subscription cancelled successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in billing function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
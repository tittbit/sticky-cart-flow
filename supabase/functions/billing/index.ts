import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || 'default-shop.myshopify.com';

    if (req.method === 'GET') {
      // Get billing information
      const { data: config, error } = await supabaseClient
        .from('shop_configurations')
        .select('subscription_status, subscription_plan, trial_ends_at, created_at')
        .eq('shop_domain', shopDomain)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching billing info:', error);
        throw error;
      }

      // Get current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: usage, error: usageError } = await supabaseClient
        .from('subscription_usage')
        .select('*')
        .eq('shop_domain', shopDomain)
        .eq('month', currentMonth)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Error fetching usage:', usageError);
      }

      // Plan limits and pricing
      const plans = {
        starter: { orders: 100, price: 0 },
        growth: { orders: 500, price: 19 },
        pro: { orders: 2000, price: 49 }
      };

      const plan = config?.subscription_plan || 'starter';
      const currentUsage = usage?.orders_processed || 0;
      const planLimit = plans[plan as keyof typeof plans]?.orders || 100;
      
      // Calculate trial days remaining
      let trialDaysRemaining = 0;
      if (config?.trial_ends_at) {
        const trialEnd = new Date(config.trial_ends_at);
        const now = new Date();
        trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Mock billing history (in real app, this would come from Shopify billing API)
      const billingHistory = [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: plans[plan as keyof typeof plans]?.price || 0,
          status: 'paid',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly`
        },
        {
          id: '2',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: plans[plan as keyof typeof plans]?.price || 0,
          status: 'paid',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly`
        }
      ];

      return new Response(JSON.stringify({
        subscription_status: config?.subscription_status || 'trial',
        subscription_plan: plan,
        trial_days_remaining: trialDaysRemaining,
        current_usage: currentUsage,
        plan_limit: planLimit,
        usage_percentage: Math.round((currentUsage / planLimit) * 100),
        billing_history: billingHistory,
        plans: plans
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Update subscription plan
      const { plan } = await req.json();
      
      if (!['starter', 'growth', 'pro'].includes(plan)) {
        throw new Error('Invalid plan');
      }

      const { data, error } = await supabaseClient
        .from('shop_configurations')
        .upsert({
          shop_domain: shopDomain,
          subscription_plan: plan,
          subscription_status: plan === 'starter' ? 'trial' : 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_domain'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        throw error;
      }

      console.log('Subscription updated for shop:', shopDomain, 'to plan:', plan);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully upgraded to ${plan} plan`,
        data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in billing function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});